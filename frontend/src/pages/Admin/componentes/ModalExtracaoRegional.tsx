import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTable } from 'react-icons/fi';
import { Modal } from '../../../components/comum/Modal';
import { FerramentaRaio, RAIO_PADRAO_M, areaKm2, useBuscaRegiao, type Coordenada } from './FerramentaRaio';

// Prévia rápida da extração regional (aberta pela visão geral). O resultado
// completo (tabela, filtros, CSV, impressão) fica na aba /admin/relatorio,
// para onde o botão principal leva com o centro/raio na URL.
export function ModalExtracaoRegional(props: { aoFechar: () => void }) {
  const navegar = useNavigate();
  const [centro, setCentro] = useState<Coordenada | null>(null);
  const [raio, setRaio] = useState(RAIO_PADRAO_M);
  const { resultados, buscando } = useBuscaRegiao(centro, raio);

  function abrirTabela() {
    if (!centro) return;
    props.aoFechar();
    navegar(`/admin/relatorio?lat=${centro.lat.toFixed(6)}&lng=${centro.lng.toFixed(6)}&raio=${raio}`);
  }

  return (
    <Modal
      variante="claro"
      largura={780}
      eyebrow="Relatório regional"
      titulo="Extração regional"
      subtitulo="Clique no mapa para definir o centro e arraste o ponto ou a alça para ajustar o raio. A tabela considera apenas as ocorrências dentro do círculo."
      aoFechar={props.aoFechar}
      acoes={
        <>
          <button type="button" className="dm-btn dm-btn--ghost" onClick={props.aoFechar}>
            Cancelar
          </button>
          <button type="button" className="dm-btn dm-btn--primario" onClick={abrirTabela} disabled={!centro}>
            <FiTable aria-hidden="true" /> Gerar tabela
          </button>
        </>
      }
    >
      <FerramentaRaio compacta centro={centro} raioMetros={raio} aoMudarCentro={setCentro} aoMudarRaio={setRaio} />

      <div className="dm-admin-previa" aria-live="polite">
        <div>
          <div className="dm-admin-previa__num">{!centro ? '—' : buscando || !resultados ? '…' : resultados.length.toLocaleString('pt-BR')}</div>
          <div className="dm-admin-previa__rotulo">Ocorrências na área</div>
        </div>
        <div className="dm-admin-previa__dir">
          <div className="dm-admin-previa__num">{areaKm2(raio)}</div>
          <div className="dm-admin-previa__rotulo">km² abrangidos</div>
        </div>
      </div>
    </Modal>
  );
}
