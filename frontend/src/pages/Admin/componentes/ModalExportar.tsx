import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiDownload, FiFileText, FiGrid, FiList } from 'react-icons/fi';
import { Modal } from '../../../components/comum/Modal';
import { api } from '../../../services/api';
import { baixarArquivo, carimboData } from '../utils/csv';
import { baixarRelatorioPlanilha, type FormatoRelatorio, type Relatorio } from '../utils/relatorios';

const FORMATOS: Array<{ chave: FormatoRelatorio; rotulo: string; descricao: string; extensao: string; Icone: typeof FiFileText }> = [
  { chave: 'pdf', rotulo: 'PDF', descricao: 'Documento pronto para imprimir ou enviar', extensao: 'pdf', Icone: FiFileText },
  { chave: 'xlsx', rotulo: 'Excel', descricao: 'Planilha com resumo e lista completa', extensao: 'xlsx', Icone: FiGrid },
  { chave: 'csv', rotulo: 'CSV', descricao: 'Texto simples, abre em qualquer programa', extensao: 'csv', Icone: FiList },
];

interface ModalExportarProps {
  titulo: string;
  subtitulo: string;
  /** Dados do relatório para Excel e CSV (o PDF é gerado no servidor). */
  relatorio: Relatorio;
  /** Endereço e parâmetros do PDF no servidor. */
  pdf: { url: string; params?: Record<string, string | number | undefined> };
  previa: Array<{ numero: string; rotulo: string }>;
  nota?: string;
  aoFechar: () => void;
}

// Janela única para baixar qualquer relatório do painel em PDF, Excel ou CSV.
export function ModalExportar(props: ModalExportarProps) {
  const [formato, setFormato] = useState<FormatoRelatorio>('pdf');
  const [exportando, setExportando] = useState(false);

  async function exportar() {
    setExportando(true);
    try {
      if (formato === 'pdf') {
        const resposta = await api.get(props.pdf.url, { params: props.pdf.params, responseType: 'blob', timeout: 60000 });
        baixarArquivo(resposta.data, `${props.relatorio.nomeArquivo}.pdf`, 'application/pdf');
      } else {
        baixarRelatorioPlanilha(props.relatorio, formato);
      }
      toast.success('Relatório baixado.');
      props.aoFechar();
    } catch {
      toast.error('Não foi possível gerar o relatório agora. Tente de novo em instantes.');
    } finally {
      setExportando(false);
    }
  }

  const escolhido = FORMATOS.find((f) => f.chave === formato)!;

  return (
    <Modal
      variante="claro"
      largura={560}
      eyebrow="Relatórios"
      titulo={props.titulo}
      subtitulo={props.subtitulo}
      aoFechar={props.aoFechar}
      bloquearFechamento={exportando}
      acoes={
        <>
          <button type="button" className="dm-btn dm-btn--ghost" onClick={props.aoFechar} disabled={exportando}>
            Cancelar
          </button>
          <button type="button" className="dm-btn dm-btn--primario" onClick={exportar} disabled={exportando}>
            <FiDownload aria-hidden="true" /> {exportando ? 'Gerando…' : `Baixar ${escolhido.rotulo}`}
          </button>
        </>
      }
    >
      <div className="dm-campo-grupo">
        <span className="dm-rotulo" id="dm-admin-formato">
          Formato do arquivo
        </span>
        <div className="dm-admin-formatos" role="radiogroup" aria-labelledby="dm-admin-formato">
          {FORMATOS.map((f) => (
            <button
              key={f.chave}
              type="button"
              role="radio"
              aria-checked={formato === f.chave}
              className={`dm-admin-formato${formato === f.chave ? ' dm-admin-formato--ativo' : ''}`}
              onClick={() => setFormato(f.chave)}
              disabled={exportando}
            >
              <f.Icone size={20} aria-hidden="true" />
              <strong>{f.rotulo}</strong>
              <small>{f.descricao}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="dm-admin-previa">
        {props.previa.map((p, i) => (
          <div key={p.rotulo} className={i > 0 ? 'dm-admin-previa__dir' : undefined}>
            <div className="dm-admin-previa__num">{p.numero}</div>
            <div className="dm-admin-previa__rotulo">{p.rotulo}</div>
          </div>
        ))}
      </div>
      <p className="dm-dica">
        {props.nota ?? 'O arquivo é gerado agora, com os dados e filtros que você está vendo.'} Nome: {props.relatorio.nomeArquivo}.{escolhido.extensao}
      </p>
    </Modal>
  );
}

export { carimboData };