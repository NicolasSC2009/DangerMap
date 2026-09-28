import { Link, useLocation } from 'react-router-dom';
import { FiMapPin } from 'react-icons/fi';
import logo from '../../assets/logo-dangermap.png';
import './naoEncontrada.css';

export function PaginaNaoEncontrada() {
  const local = useLocation();

  return (
    <div className="dm-404">
      <section className="dm-404__card dm-cantos dm-entrada" aria-labelledby="dm-404-titulo">
        <div className="dm-404__deco" aria-hidden="true">
          <svg viewBox="0 0 400 500" preserveAspectRatio="none">
            <path d="M -20 380 C 80 340, 120 440, 220 400 S 380 340, 440 420" />
            <path d="M -20 120 C 60 80, 140 140, 180 80 S 320 10, 420 70" />
          </svg>
          <span className="dm-404__pin">
            <FiMapPin />
          </span>
        </div>
        <img className="dm-404__logo" src={logo} alt="DangerMap" />
        <div className="dm-404__codigo" aria-hidden="true">404</div>
        <div className="dm-eyebrow dm-eyebrow--sobre-escuro">
          <span className="dm-eyebrow__marca" aria-hidden="true" />
          Rota fora do mapa
        </div>
        <h1 id="dm-404-titulo">Página não encontrada</h1>
        <p>
          Não existe nada em <span className="dm-mono">{local.pathname}</span>. O endereço pode ter mudado ou sido
          digitado errado.
        </p>
        <div className="dm-404__acoes">
          <Link to="/" className="dm-btn dm-btn--primario">
            <span>Voltar ao mapa</span>
          </Link>
          <Link to="/ajuda" className="dm-btn dm-btn--sobre-escuro">
            Central de ajuda
          </Link>
        </div>
      </section>
    </div>
  );
}
