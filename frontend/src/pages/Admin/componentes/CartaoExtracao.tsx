import { Link } from 'react-router-dom';
import { FiCrosshair, FiMapPin } from 'react-icons/fi';

// Teaser verde que leva à ferramenta de extração regional (aba "relatorio").
export function CartaoExtracao(props: { aoAbrirRapido?: () => void }) {
  return (
    <section className="dm-admin-extracao">
      <div className="dm-admin-extracao__mapa" aria-hidden="true">
        <div className="dm-admin-extracao__anel" />
        <FiMapPin className="dm-admin-extracao__pino" />
      </div>
      <div className="dm-admin-extracao__texto">
        <span className="dm-eyebrow">
          <span className="dm-eyebrow__marca" aria-hidden="true" />
          Relatório regional
        </span>
        <h3>Extração regional por raio</h3>
        <p>
          Defina um ponto e um raio no mapa para listar as ocorrências contidas na área e exportar a tabela em CSV ou PDF.
        </p>
      </div>
      <div className="dm-admin-extracao__acoes">
        <Link to="/admin/relatorio" className="dm-btn dm-btn--primario dm-btn--pequeno">
          <FiCrosshair aria-hidden="true" /> Abrir ferramenta
        </Link>
        {props.aoAbrirRapido && (
          <button type="button" className="dm-btn dm-btn--sobre-escuro dm-btn--pequeno" onClick={props.aoAbrirRapido}>
            Prévia rápida
          </button>
        )}
      </div>
    </section>
  );
}
