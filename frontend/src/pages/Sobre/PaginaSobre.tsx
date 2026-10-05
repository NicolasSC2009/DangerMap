import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiCheckCircle,
  FiCode,
  FiGithub,
  FiMapPin,
  FiMonitor,
  FiPlusCircle,
  FiShield,
  FiSmartphone,
  FiGlobe,
  FiUsers,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { LayoutPadrao } from '../../components/comum/LayoutPadrao';
import { URL_ISSUES, URL_REPOSITORIO } from '../Ajuda/conteudoAjuda';
import '../Ajuda/ajuda.css';
import './sobre.css';

const TEXTO_SOBRE =
  'O DangerMap é uma plataforma cidadã de mapeamento colaborativo de perigos urbanos: buracos, alagamentos, iluminação, sinalização danificada e focos de incêndio. Qualquer pessoa pode reportar um problema, confirmar ocorrências de terceiros e acompanhar a resolução pelo mapa.';

const TEXTO_MISSAO =
  'Transformar o que cada pessoa vê na rua em informação útil para todos — e dar visibilidade aos riscos que precisam de solução.';

const PILARES: Array<{ Icone: IconType; titulo: string; texto: string }> = [
  {
    Icone: FiPlusCircle,
    titulo: 'Reporte',
    texto: 'Marque o ponto no mapa, escolha a categoria e, se quiser, anexe uma foto. A gravidade é definida automaticamente.',
  },
  {
    Icone: FiUsers,
    titulo: 'Valide em comunidade',
    texto: 'Outras pessoas confirmam, curtem ou denunciam o relato, e as confirmações mostram o que realmente existe.',
  },
  {
    Icone: FiShield,
    titulo: 'Modere',
    texto: 'A administração revisa denúncias, arquiva o que é falso e mantém o mapa confiável.',
  },
  {
    Icone: FiCheckCircle,
    titulo: 'Acompanhe a solução',
    texto: 'Ocorrências resolvidas ficam marcadas como tal, e quem registrou é avisado.',
  },
];

const PLATAFORMAS: Array<{ Icone: IconType; titulo: string; texto: string }> = [
  { Icone: FiGlobe, titulo: 'Web', texto: 'Direto no navegador, no computador ou no celular, e dá para instalar como app (PWA).' },
  { Icone: FiMonitor, titulo: 'Windows', texto: 'Aplicativo de desktop feito com Electron, numa janela própria.' },
  { Icone: FiSmartphone, titulo: 'Android', texto: 'Aplicativo nativo feito com Capacitor (em desenvolvimento).' },
];

export function PaginaSobre() {
  return (
    <LayoutPadrao variante="clara" className="dm-ajuda-pagina dm-sobre-pagina">
      <section className="dm-ajuda-hero" aria-labelledby="dm-sobre-titulo">
        <div className="dm-ajuda-hero__deco" aria-hidden="true">
          <svg viewBox="0 0 600 300" preserveAspectRatio="none">
            <path d="M -20 220 C 90 180, 150 270, 280 230 S 520 170, 640 240" />
            <path d="M -20 90 C 70 50, 170 120, 240 70 S 460 10, 640 80" />
          </svg>
          <span className="dm-ajuda-hero__pin">
            <FiMapPin />
          </span>
        </div>
        <div className="dm-ajuda-hero__conteudo">
          <div className="dm-eyebrow dm-eyebrow--sobre-escuro">
            <span className="dm-eyebrow__marca" aria-hidden="true" />
            Sobre
          </div>
          <h1 id="dm-sobre-titulo">Sobre o DangerMap</h1>
          <p className="dm-ajuda-hero__sub">
            Um sistema multiplataforma de mapeamento colaborativo de riscos urbanos, onde cidadãos registram e validam
            ocorrências e administradores moderam e extraem relatórios geográficos.
          </p>
        </div>
      </section>

      <div className="dm-sobre">
        <section className="dm-ajuda-secao" aria-labelledby="sobre-o-que-e">
          <header className="dm-ajuda-secao__cabecalho">
            <span className="dm-ajuda-secao__icone" aria-hidden="true"><FiMapPin size={18} /></span>
            <div>
              <span className="dm-ajuda-secao__numero">01</span>
              <h2 id="sobre-o-que-e">O que é</h2>
            </div>
          </header>
          <div className="dm-ajuda-sobre">
            <div className="dm-ajuda-sobre__texto">
              <p>{TEXTO_SOBRE}</p>
              <p>
                O projeto é de código aberto: o mapa, a moderação e os alertas são construídos em público e qualquer
                pessoa pode sugerir melhorias.
              </p>
            </div>
            <aside className="dm-ajuda-cartao-verde">
              <div className="dm-eyebrow dm-eyebrow--sobre-escuro">
                <span className="dm-eyebrow__marca" aria-hidden="true" />
                Nossa missão
              </div>
              <p className="dm-ajuda-cartao-verde__texto">{TEXTO_MISSAO}</p>
              <Link to="/ajuda" className="dm-btn dm-btn--primario dm-btn--pequeno">
                <span>Como usar</span>
                <FiArrowRight size={14} aria-hidden="true" />
              </Link>
            </aside>
          </div>
        </section>

        <section className="dm-ajuda-secao" aria-labelledby="sobre-como-funciona">
          <header className="dm-ajuda-secao__cabecalho">
            <span className="dm-ajuda-secao__icone" aria-hidden="true"><FiUsers size={18} /></span>
            <div>
              <span className="dm-ajuda-secao__numero">02</span>
              <h2 id="sobre-como-funciona">Como funciona</h2>
              <p>Quatro passos que mantêm o mapa útil e confiável.</p>
            </div>
          </header>
          <ul className="dm-sobre-grade">
            {PILARES.map((p, i) => (
              <li key={p.titulo} className="dm-painel dm-sobre-cartao">
                <span className="dm-sobre-cartao__icone" aria-hidden="true">
                  <p.Icone size={20} />
                </span>
                <span className="dm-sobre-cartao__num">{String(i + 1).padStart(2, '0')}</span>
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="dm-ajuda-secao" aria-labelledby="sobre-plataformas">
          <header className="dm-ajuda-secao__cabecalho">
            <span className="dm-ajuda-secao__icone" aria-hidden="true"><FiSmartphone size={18} /></span>
            <div>
              <span className="dm-ajuda-secao__numero">03</span>
              <h2 id="sobre-plataformas">Em todas as telas</h2>
              <p>Uma só base de código e uma só API atendendo todas as plataformas.</p>
            </div>
          </header>
          <ul className="dm-sobre-grade dm-sobre-grade--tres">
            {PLATAFORMAS.map((p) => (
              <li key={p.titulo} className="dm-painel dm-sobre-cartao">
                <span className="dm-sobre-cartao__icone" aria-hidden="true">
                  <p.Icone size={20} />
                </span>
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
              </li>
            ))}
          </ul>
          <p className="dm-sobre-acao">
            <Link to="/baixar-app" className="dm-btn dm-btn--ghost dm-btn--pequeno">
              <FiSmartphone size={14} aria-hidden="true" />
              <span>Baixar o app</span>
            </Link>
          </p>
        </section>

        <section className="dm-ajuda-secao" aria-labelledby="sobre-projeto">
          <header className="dm-ajuda-secao__cabecalho">
            <span className="dm-ajuda-secao__icone" aria-hidden="true"><FiGithub size={18} /></span>
            <div>
              <span className="dm-ajuda-secao__numero">04</span>
              <h2 id="sobre-projeto">O projeto</h2>
              <p>Código aberto, feito por estudantes. Contribuições são bem-vindas.</p>
            </div>
          </header>
          <ul className="dm-ajuda-contatos">
            <li>
              <a className="dm-ajuda-contato" href={URL_REPOSITORIO} target="_blank" rel="noreferrer">
                <span className="dm-ajuda-contato__icone" aria-hidden="true"><FiCode size={18} /></span>
                <strong>Código-fonte</strong>
                <span>Veja como o DangerMap funciona por dentro e contribua com o projeto.</span>
                <span className="dm-ajuda-contato__cta">Abrir repositório <FiArrowRight size={13} aria-hidden="true" /></span>
              </a>
            </li>
            <li>
              <a className="dm-ajuda-contato" href={URL_ISSUES} target="_blank" rel="noreferrer">
                <span className="dm-ajuda-contato__icone" aria-hidden="true"><FiPlusCircle size={18} /></span>
                <strong>Sugestões e feedback</strong>
                <span>Ideia de categoria nova, recurso ou melhoria? Conte para a gente.</span>
                <span className="dm-ajuda-contato__cta">Enviar sugestão <FiArrowRight size={13} aria-hidden="true" /></span>
              </a>
            </li>
          </ul>
        </section>
      </div>
    </LayoutPadrao>
  );
}
