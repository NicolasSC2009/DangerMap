import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiDownload, FiFileText, FiGrid } from 'react-icons/fi';
import { Modal } from '../../../components/comum/Modal';
import { api } from '../../../services/api';
import type { EstatisticasDashboard } from '@shared/types';
import { baixarArquivo, baixarCsv, carimboData, csvEstatisticas } from '../utils/csv';

type Formato = 'pdf' | 'csv';

const FORMATOS: Array<{ chave: Formato; rotulo: string; descricao: string; Icone: typeof FiFileText }> = [
  { chave: 'pdf', rotulo: 'PDF', descricao: 'Relatório executivo gerado pelo servidor', Icone: FiFileText },
  { chave: 'csv', rotulo: 'CSV', descricao: 'Planilha com totais, distribuições e série diária', Icone: FiGrid },
];

interface ModalExportarRelatorioProps {
  dados: EstatisticasDashboard;
  aoFechar: () => void;
}

export function ModalExportarRelatorio(props: ModalExportarRelatorioProps) {
  const [formato, setFormato] = useState<Formato>('pdf');
  const [exportando, setExportando] = useState(false);
  const registros30Dias = props.dados.serieTemporal.reduce((acc, d) => acc + d.total, 0);

  async function exportar() {
    setExportando(true);
    try {
      if (formato === 'pdf') {
        const resposta = await api.get('/admin/dashboard/relatorio.pdf', { responseType: 'blob', timeout: 30000 });
        baixarArquivo(resposta.data, `relatorio-dangermap-${carimboData()}.pdf`, 'application/pdf');
      } else {
        baixarCsv(csvEstatisticas(props.dados), `relatorio-dangermap-${carimboData()}.csv`);
      }
      toast.success('Relatório exportado.');
      props.aoFechar();
    } catch {
      toast.error('Não foi possível exportar o relatório agora.');
    } finally {
      setExportando(false);
    }
  }

  return (
    <Modal
      variante="claro"
      largura={520}
      eyebrow="Relatórios"
      titulo="Exportar relatório"
      subtitulo="Relatório consolidado com os totais gerais e as ocorrências por status, gravidade e categoria. O CSV inclui também a série diária dos últimos 30 dias."
      aoFechar={props.aoFechar}
      bloquearFechamento={exportando}
      acoes={
        <>
          <button type="button" className="dm-btn dm-btn--ghost" onClick={props.aoFechar} disabled={exportando}>
            Cancelar
          </button>
          <button type="button" className="dm-btn dm-btn--primario" onClick={exportar} disabled={exportando}>
            <FiDownload aria-hidden="true" /> {exportando ? 'Gerando…' : `Exportar ${formato.toUpperCase()}`}
          </button>
        </>
      }
    >
      <div className="dm-campo-grupo">
        <span className="dm-rotulo" id="dm-admin-formato">
          Formato
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
            >
              <f.Icone size={20} aria-hidden="true" />
              <strong>{f.rotulo}</strong>
              <small>{f.descricao}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="dm-admin-previa">
        <div>
          <div className="dm-admin-previa__num">{props.dados.totais.totalOcorrencias.toLocaleString('pt-BR')}</div>
          <div className="dm-admin-previa__rotulo">Ocorrências no total</div>
        </div>
        <div className="dm-admin-previa__dir">
          <div className="dm-admin-previa__num">{registros30Dias.toLocaleString('pt-BR')}</div>
          <div className="dm-admin-previa__rotulo">Nos últimos 30 dias</div>
        </div>
      </div>
      <p className="dm-dica">
        Dados gerados em {new Date(props.dados.geradoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}.
      </p>
    </Modal>
  );
}
