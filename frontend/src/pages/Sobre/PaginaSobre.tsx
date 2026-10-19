import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiCheckCircle,
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
import { URL_ISSUES } from '../Ajuda/conteudoAjuda';
import '../Ajuda/ajuda.css';
import './sobre.css';

const TEXTO_SOBRE =
  'O DangerMap é um mapa onde qualquer pessoa pode avisar sobre perigos da cidade, como buracos, alagamentos, falta de iluminação, sinalização danificada e focos de incêndio. Você também pode confirmar o que outras pessoas registraram e acompanhar quando o problema for resolvido.';

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
    titulo: 'Confirme com a comunidade',
    texto: 'Outras pessoas confirmam, curtem ou denunciam o aviso. Quanto mais confirmações, mais confiável ele fica.',
  },
  {
    Icone: FiShield,
    titulo: 'Cuidamos do mapa',
    texto: 'Nossa equipe analisa as denúncias e retira o que for falso ou repetido.',
  },
  {
    Icone: FiCheckCircle,
    titulo: 'Acompanhe a solução',
    texto: 'Ocorrências resolvidas ficam marcadas como tal, e quem registrou é avisado.',
  },
];

const PLATAFORMAS: Array<{ Icone: IconType; titulo: string; texto: string }> = [
  { Icone: FiGlobe, titulo: 'Internet', texto: 'Direto no navegador, no computador ou no celular — e dá para instalar como se fosse um aplicativo.' },
  { Icone: FiMonitor, titulo: 'Windows', texto: 'Aplicativo para o computador, com janela própria.' },
  { Icone: FiSmartphone, titulo: 'Android', texto: 'Aplicativo para o celular (em desenvolvimento).' },
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
            Um mapa feito por quem vive a cidade: moradores avisam sobre perigos e confirmam os avisos uns dos outros,
            para todo mundo se deslocar com mais segurança.
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
                O DangerMap é feito por estudantes e está aberto a sugestões: qualquer pessoa pode ajudar a melhorá-lo.
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
              <p>Quatro passos para manter o mapa útil e confiável.</p>
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
              <p>O mesmo mapa e as mesmas ocorrências, não importa onde você abra.</p>
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
            <span className="dm-ajuda-secao__icone" aria-hidden="true"><FiUsers size={18} /></span>
            <div>
              <span className="dm-ajuda-secao__numero">04</span>
              <h2 id="sobre-projeto">O projeto</h2>
              <p>Feito por estudantes, com a ajuda de quem usa. Sua opinião é bem-vinda.</p>
            </div>
          </header>
          <ul className="dm-ajuda-contatos">
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
