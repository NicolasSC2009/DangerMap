import { Link, useLocation } from 'react-router-dom';
import { FiCompass, FiDownload, FiFolder, FiHelpCircle, FiInfo, FiLogIn } from 'react-icons/fi';
import logo from '../../assets/logo-auth.png';
import './naoEncontrada.css';

const ATALHOS = [
  { para: '/categorias', rotulo: 'Categorias de perigo', Icone: FiFolder },
  { para: '/ajuda', rotulo: 'Central de ajuda', Icone: FiHelpCircle },
  { para: '/sobre', rotulo: 'Sobre o DangerMap', Icone: FiInfo },
  { para: '/baixar-app', rotulo: 'Baixar o app', Icone: FiDownload },
  { para: '/entrar', rotulo: 'Entrar', Icone: FiLogIn },
];

// Pino do mapa no lugar do "0" do 404.
function PinPerdido() {
  return (
    <svg className="dm-404__pin" viewBox="0 0 64 64" aria-hidden="true">
      <path
        d="M32 6c-10.6 0-19.2 8.3-19.2 18.6 0 13.2 14.9 28.6 18 31.7.7.7 1.8.7 2.4 0 3.1-3.1 18-18.5 18-31.7C51.2 14.3 42.6 6 32 6z"
        fill="#FF6400"
      />
      <rect x="29.2" y="15" width="5.6" height="14.6" rx="2.8" fill="#fff" />
      <circle cx="32" cy="36.2" r="3.4" fill="#fff" />
    </svg>
  );
}

export function PaginaNaoEncontrada() {
  const local = useLocation();

  return (
    <div className="dm-404">
      <div className="dm-404__fundo" aria-hidden="true">
        <svg viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
          <path d="M -40 560 C 160 500, 260 620, 460 560 S 780 470, 1000 560 S 1180 520, 1260 580" />
          <path d="M -40 160 C 140 100, 300 190, 480 120 S 800 20, 1000 110 S 1160 90, 1260 140" />
          <path d="M -40 360 C 200 330, 340 420, 560 370 S 900 300, 1260 380" />
        </svg>
      </div>

      <main className="dm-404__conteudo dm-entrada" aria-labelledby="dm-404-titulo">
        <Link to="/" className="dm-404__marca" aria-label="DangerMap — voltar para o mapa">
          <img src={logo} alt="DangerMap" />
        </Link>

        <div className="dm-404__codigo" role="img" aria-label="Erro 404">
          <span>4</span>
          <PinPerdido />
          <span>4</span>
        </div>

        <h1 id="dm-404-titulo">Esse endereço saiu do mapa</h1>
        <p>
          Não encontramos nada em <span className="dm-404__caminho">{local.pathname}</span>. O link pode ter mudado ou ter
          sido digitado errado.
        </p>

        <div className="dm-404__acoes">
          <Link to="/" className="dm-btn dm-btn--primario">
            <FiCompass aria-hidden="true" />
            <span>Voltar ao mapa</span>
          </Link>
        </div>

        <nav className="dm-404__atalhos" aria-label="Páginas do DangerMap">
          {ATALHOS.map(({ para, rotulo, Icone }) => (
            <Link key={para} to={para} className="dm-404__atalho">
              <Icone aria-hidden="true" />
              {rotulo}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}