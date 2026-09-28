import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiArrowRight,
  FiBookOpen,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiCode,
  FiFlag,
  FiGithub,
  FiMapPin,
  FiPlusCircle,
  FiSearch,
  FiShield,
  FiSmartphone,
  FiUserPlus,
  FiX,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { LayoutPadrao } from '../../components/comum/LayoutPadrao';
import { useAuth } from '../../contexts/AuthContext';
import { useCategorias } from '../../hooks/useCategorias';
import { obterIconeCategoria } from '../../theme/iconesCategorias';
import { ROTULO_GRAVIDADE, ROTULO_STATUS } from '../../theme/rotulos';
import {
  ACOES_MODERACAO,
  CATEGORIAS_PADRAO,
  FAQ,
  LEGENDA_GRAVIDADE,
  LEGENDA_STATUS,
  PASSOS,
  REGRAS_CONVIVENCIA,
  SECOES_AJUDA,
  TEXTO_MISSAO,
  TEXTO_SOBRE,
  ULTIMA_ATUALIZACAO,
  URL_ISSUES,
  URL_REPOSITORIO,
  type IdSecaoAjuda,
  type PerguntaFaq,
} from './conteudoAjuda';
import './ajuda.css';

const ICONES_PASSOS: IconType[] = [FiUserPlus, FiMapPin, FiPlusCircle, FiCheckCircle];

// Remove acentos e caixa. Para texto em NFC o comprimento é preservado,
// o que permite reaproveitar os índices para destacar o termo buscado.
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function textoDaPergunta(item: PerguntaFaq): string {
  return normalizar(`${item.pergunta} ${item.resposta.join(' ')}`);
}

function Destaque(props: { texto: string; termo: string }) {
  const termo = normalizar(props.termo.trim());
  if (!termo) return <>{props.texto}</>;
  const base = normalizar(props.texto.normalize('NFC'));
  const texto = props.texto.normalize('NFC');
  const partes: React.ReactNode[] = [];
  let inicio = 0;
  let indice = base.indexOf(termo);
  while (indice !== -1) {
    if (indice > inicio) partes.push(texto.slice(inicio, indice));
    partes.push(<mark key={indice}>{texto.slice(indice, indice + termo.length)}</mark>);
    inicio = indice + termo.length;
    indice = base.indexOf(termo, inicio);
  }
  partes.push(texto.slice(inicio));
  return <>{partes}</>;
}

function prefereMenosMovimento(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.dataset.animacoes === 'reduzidas'
  );
}

function rolarAte(id: string) {
  const alvo = document.getElementById(id);
  if (alvo) alvo.scrollIntoView({ behavior: prefereMenosMovimento() ? 'auto' : 'smooth', block: 'start' });
}

function CabecalhoSecao(props: { numero: string; titulo: string; descricao?: React.ReactNode; Icone: IconType }) {
  return (
    <header className="dm-ajuda-secao__cabecalho">
      <span className="dm-ajuda-secao__icone" aria-hidden="true">
        <props.Icone size={18} />
      </span>
      <div>
        <span className="dm-ajuda-secao__numero">{props.numero}</span>
        <h2>{props.titulo}</h2>
        {props.descricao && <p>{props.descricao}</p>}
      </div>
    </header>
  );
}

export function PaginaAjuda() {
  const { autenticado } = useAuth();
  const { categorias, carregando: carregandoCategorias } = useCategorias(autenticado);
  const local = useLocation();
  const navegar = useNavigate();
  const [busca, setBusca] = useState('');
  const [secaoAtiva, setSecaoAtiva] = useState<IdSecaoAjuda>('primeiros-passos');
  const indiceRef = useRef<HTMLElement>(null);

  const termo = normalizar(busca.trim());
  const perguntasFiltradas = useMemo(
    function () {
      if (!termo) return FAQ;
      return FAQ.filter((item) => textoDaPergunta(item).includes(termo));
    },
    [termo]
  );

  // Deep-link: /ajuda#faq, /ajuda#sobre (Navbar) etc.
  useEffect(
    function () {
      if (!local.hash) window.scrollTo(0, 0);
    },
    [local.hash]
  );

  // Rola até o #hash e rola de novo quando as categorias terminam de carregar
  // (a seção de categorias muda de altura e deslocaria o alvo).
  useEffect(
    function () {
      if (!local.hash) return;
      const id = decodeURIComponent(local.hash.slice(1));
      // espera o layout montar antes de rolar
      const quadro = requestAnimationFrame(() => rolarAte(id));
      return () => cancelAnimationFrame(quadro);
    },
    [local.hash, carregandoCategorias]
  );

  // Realce da seção visível no índice.
  useEffect(function () {
    if (typeof IntersectionObserver === 'undefined') return;
    const visiveis = new Map<string, boolean>();
    const observador = new IntersectionObserver(
      function (entradas) {
        entradas.forEach((entrada) => visiveis.set(entrada.target.id, entrada.isIntersecting));
        const primeira = SECOES_AJUDA.find((secao) => visiveis.get(secao.id));
        if (primeira) setSecaoAtiva(primeira.id);
      },
      { rootMargin: '-20% 0px -55% 0px' }
    );
    SECOES_AJUDA.forEach(function (secao) {
      const elemento = document.getElementById(secao.id);
      if (elemento) observador.observe(elemento);
    });
    return () => observador.disconnect();
  }, []);

  // No mobile o índice é uma faixa rolável: mantém o chip ativo à vista.
  useEffect(
    function () {
      const nav = indiceRef.current;
      const chip = nav?.querySelector<HTMLElement>(`[data-secao="${secaoAtiva}"]`);
      if (!nav || !chip || nav.scrollWidth <= nav.clientWidth) return;
      nav.scrollTo({
        left: chip.offsetLeft - nav.clientWidth / 2 + chip.clientWidth / 2,
        behavior: prefereMenosMovimento() ? 'auto' : 'smooth',
      });
    },
    [secaoAtiva]
  );

  function irParaSecao(evento: React.MouseEvent<HTMLAnchorElement>, id: IdSecaoAjuda) {
    evento.preventDefault();
    setSecaoAtiva(id);
    if (local.hash === `#${id}`) rolarAte(id);
    else navegar({ hash: id }, { replace: true });
  }

  function aoBuscar(evento: React.FormEvent) {
    evento.preventDefault();
    rolarAte('faq');
  }

  const listaCategorias = autenticado
    ? categorias.map((c) => ({ chave: String(c.id), nome: c.nome, descricao: c.descricao }))
    : CATEGORIAS_PADRAO.map((nome) => ({ chave: nome, nome, descricao: null as string | null }));

  return (
    <LayoutPadrao variante="clara" className="dm-ajuda-pagina">
      {/* ---------- HERO ---------- */}
      <section className="dm-ajuda-hero" aria-labelledby="dm-ajuda-titulo">
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
            Central de ajuda
          </div>
          <h1 id="dm-ajuda-titulo">Como usar o DangerMap</h1>
          <p className="dm-ajuda-hero__sub">
            Tudo o que você precisa para registrar, confirmar e acompanhar perigos na sua cidade — e entender o que
            cada cor e ícone do mapa quer dizer.
          </p>

          <form className="dm-ajuda-busca" role="search" onSubmit={aoBuscar}>
            <FiSearch className="dm-ajuda-busca__icone" size={18} aria-hidden="true" />
            <label htmlFor="dm-ajuda-busca" className="dm-visually-hidden">
              Buscar nas perguntas frequentes
            </label>
            <input
              id="dm-ajuda-busca"
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Busque uma dúvida: senha, anônimo, notificação…"
              autoComplete="off"
              enterKeyHint="search"
            />
            {busca && (
              <button type="button" className="dm-ajuda-busca__limpar" onClick={() => setBusca('')} aria-label="Limpar busca">
                <FiX size={16} aria-hidden="true" />
              </button>
            )}
          </form>
          <p className="dm-ajuda-busca__status" aria-live="polite">
            {termo ? (
              perguntasFiltradas.length > 0 ? (
                <>
                  {perguntasFiltradas.length}{' '}
                  {perguntasFiltradas.length === 1 ? 'pergunta encontrada' : 'perguntas encontradas'} ·{' '}
                  <a href="#faq" onClick={(e) => irParaSecao(e, 'faq')}>
                    ver respostas <FiArrowRight size={12} aria-hidden="true" />
                  </a>
                </>
              ) : (
                'Nenhuma pergunta encontrada. Tente outra palavra.'
              )
            ) : (
              <>
                Atalhos:{' '}
                <a href="#primeiros-passos" onClick={(e) => irParaSecao(e, 'primeiros-passos')}>primeiros passos</a> ·{' '}
                <a href="#legenda" onClick={(e) => irParaSecao(e, 'legenda')}>legenda</a> ·{' '}
                <a href="#faq" onClick={(e) => irParaSecao(e, 'faq')}>perguntas frequentes</a>
              </>
            )}
          </p>
        </div>
      </section>

      <div className="dm-ajuda-grid">
        {/* ---------- ÍNDICE ---------- */}
        <nav className="dm-ajuda-indice" aria-label="Nesta página" ref={indiceRef}>
          <p className="dm-ajuda-indice__titulo">Nesta página</p>
          <ol>
            {SECOES_AJUDA.map((secao, i) => (
              <li key={secao.id}>
                <a
                  href={`#${secao.id}`}
                  data-secao={secao.id}
                  className={secaoAtiva === secao.id ? 'ativo' : undefined}
                  aria-current={secaoAtiva === secao.id ? 'location' : undefined}
                  onClick={(e) => irParaSecao(e, secao.id)}
                >
                  <span className="dm-ajuda-indice__num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  {secao.rotulo}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="dm-ajuda-conteudo">
          {/* ---------- PRIMEIROS PASSOS ---------- */}
          <section id="primeiros-passos" className="dm-ajuda-secao">
            <CabecalhoSecao
              numero="01"
              Icone={FiBookOpen}
              titulo="Primeiros passos"
              descricao="Do cadastro à primeira ocorrência em menos de um minuto."
            />
            <ol className="dm-ajuda-passos">
              {PASSOS.map(function (passo, i) {
                const Icone = ICONES_PASSOS[i] || FiCheck;
                const concluido = passo.acao.somenteVisitante && autenticado;
                return (
                  <li key={passo.titulo} className="dm-ajuda-passo">
                    <div className="dm-ajuda-passo__topo">
                      <span className="dm-ajuda-passo__num">{String(i + 1).padStart(2, '0')}</span>
                      <span className="dm-ajuda-passo__icone" aria-hidden="true">
                        <Icone size={18} />
                      </span>
                    </div>
                    <h3>{passo.titulo}</h3>
                    <p>{passo.texto}</p>
                    {concluido ? (
                      <span className="dm-pill dm-pill--sucesso">
                        <FiCheck size={12} aria-hidden="true" /> Você já tem conta
                      </span>
                    ) : (
                      <Link to={passo.acao.para} className="dm-ajuda-passo__acao">
                        {passo.acao.rotulo} <FiArrowRight size={13} aria-hidden="true" />
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>

          {/* ---------- LEGENDA ---------- */}
          <section id="legenda" className="dm-ajuda-secao">
            <CabecalhoSecao
              numero="02"
              Icone={FiMapPin}
              titulo="Legenda do mapa"
              descricao="Cores, etiquetas e marcadores que você encontra no mapa e nos cartões de ocorrência."
            />
            <div className="dm-ajuda-legenda">
              <div className="dm-painel dm-ajuda-legenda__bloco">
                <h3>Gravidade</h3>
                <ul>
                  {LEGENDA_GRAVIDADE.map((item) => (
                    <li key={item.gravidade}>
                      <span className={`dm-severidade dm-severidade--${item.gravidade}`}>
                        <span className="dm-severidade__ponto" aria-hidden="true" />
                        {ROTULO_GRAVIDADE[item.gravidade]}
                      </span>
                      <p>{item.texto}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="dm-painel dm-ajuda-legenda__bloco">
                <h3>Status</h3>
                <ul>
                  {LEGENDA_STATUS.map((item) => (
                    <li key={item.status}>
                      <span className={`dm-tag dm-tag--${item.status}`}>{ROTULO_STATUS[item.status]}</span>
                      <p>{item.texto}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="dm-painel dm-ajuda-legenda__bloco">
                <h3>Marcadores</h3>
                <ul>
                  <li>
                    <span className="dm-ajuda-marcador" aria-hidden="true">
                      <img src={obterIconeCategoria('Buraco na via')} alt="" />
                      <span className="dm-ajuda-marcador__badge" />
                    </span>
                    <p>
                      <strong>Uma ocorrência.</strong> O ícone mostra a categoria e o ponto no canto, a gravidade. Toque
                      para ver os detalhes.
                    </p>
                  </li>
                  <li>
                    <span className="dm-ajuda-cluster" aria-hidden="true">12</span>
                    <p>
                      <strong>Agrupamento.</strong> Várias ocorrências próximas. Toque para aproximar e separar os
                      marcadores.
                    </p>
                  </li>
                  <li>
                    <span className="dm-ajuda-usuario" aria-hidden="true">
                      <span className="dm-ajuda-usuario__pulso" />
                      <span className="dm-ajuda-usuario__ponto" />
                    </span>
                    <p>
                      <strong>Você está aqui.</strong> Sua posição, quando você permite o acesso à localização.
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* ---------- CATEGORIAS ---------- */}
          <section id="categorias" className="dm-ajuda-secao">
            <CabecalhoSecao
              numero="03"
              Icone={FiAlertTriangle}
              titulo="Categorias de perigo"
              descricao={
                autenticado
                  ? 'As categorias ativas que você pode escolher ao registrar uma ocorrência.'
                  : 'Os tipos de perigo que você pode registrar no mapa.'
              }
            />
            {!autenticado && (
              <p className="dm-ajuda-aviso">
                <FiShield size={15} aria-hidden="true" />
                <span>
                  Esta é a lista padrão. <Link to="/entrar">Entre</Link> para ver as categorias ativas no momento, com
                  a descrição de cada uma.
                </span>
              </p>
            )}
            {autenticado && carregandoCategorias ? (
              <ul className="dm-ajuda-categorias" aria-busy="true" aria-label="Carregando categorias">
                {Array.from({ length: 8 }).map((_, i) => (
                  <li key={i} className="dm-ajuda-categoria dm-ajuda-categoria--esqueleto" />
                ))}
              </ul>
            ) : listaCategorias.length === 0 ? (
              <p className="dm-ajuda-vazio">Nenhuma categoria ativa no momento.</p>
            ) : (
              <ul className="dm-ajuda-categorias">
                {listaCategorias.map((categoria) => (
                  <li key={categoria.chave} className="dm-ajuda-categoria">
                    <img src={obterIconeCategoria(categoria.nome)} alt="" />
                    <strong>{categoria.nome}</strong>
                    {categoria.descricao && <span>{categoria.descricao}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ---------- FAQ ---------- */}
          <section id="faq" className="dm-ajuda-secao">
            <CabecalhoSecao
              numero="04"
              Icone={FiFlag}
              titulo="Perguntas frequentes"
              descricao={
                termo ? (
                  <>
                    Mostrando {perguntasFiltradas.length} de {FAQ.length} para “{busca.trim()}”.{' '}
                    <button type="button" className="dm-ajuda-link" onClick={() => setBusca('')}>
                      Limpar busca
                    </button>
                  </>
                ) : (
                  'Respostas rápidas para as dúvidas mais comuns.'
                )
              }
            />
            {perguntasFiltradas.length === 0 ? (
              <div className="dm-ajuda-vazio">
                <p>Nenhuma pergunta combina com “{busca.trim()}”.</p>
                <div className="dm-ajuda-vazio__acoes">
                  <button type="button" className="dm-btn dm-btn--ghost dm-btn--pequeno" onClick={() => setBusca('')}>
                    Ver todas
                  </button>
                  <a href="#contato" className="dm-btn dm-btn--ghost dm-btn--pequeno" onClick={(e) => irParaSecao(e, 'contato')}>
                    Falar com a equipe
                  </a>
                </div>
              </div>
            ) : (
              <div className="dm-ajuda-faq-lista">
                {perguntasFiltradas.map((item) => (
                  <details key={item.id} className="dm-ajuda-faq" open={termo ? true : undefined}>
                    <summary>
                      <span>
                        <Destaque texto={item.pergunta} termo={busca} />
                      </span>
                      <FiChevronDown className="dm-ajuda-faq__seta" size={18} aria-hidden="true" />
                    </summary>
                    <div className="dm-ajuda-faq__resposta">
                      {item.resposta.map((paragrafo, i) => (
                        <p key={i}>
                          <Destaque texto={paragrafo} termo={busca} />
                        </p>
                      ))}
                      {item.link && (
                        <Link to={item.link.para} className="dm-ajuda-faq__link">
                          {item.link.rotulo} <FiArrowRight size={13} aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </section>

          {/* ---------- MODERAÇÃO ---------- */}
          <section id="moderacao" className="dm-ajuda-secao">
            <CabecalhoSecao
              numero="05"
              Icone={FiShield}
              titulo="Moderação e convivência"
              descricao="Como manter o mapa confiável — e o que acontece com o que é denunciado."
            />
            <div className="dm-ajuda-moderacao">
              <div className="dm-painel dm-ajuda-moderacao__como">
                <h3>Como denunciar</h3>
                <ol className="dm-ajuda-lista-numerada">
                  <li>
                    <strong>Ocorrência:</strong> abra o marcador no mapa e use <em>Denunciar</em> no fim do cartão,
                    informando o motivo.
                  </li>
                  <li>
                    <strong>Perfil:</strong> abra o perfil público da pessoa e use <em>Denunciar perfil</em>.
                  </li>
                  <li>A denúncia vai para a fila da administração, que revisa cada caso.</li>
                </ol>
              </div>
              <div className="dm-painel dm-ajuda-moderacao__regras">
                <h3>Regras de convivência</h3>
                <ul>
                  {REGRAS_CONVIVENCIA.map((regra) => (
                    <li key={regra}>
                      <FiCheck size={14} aria-hidden="true" />
                      <span>{regra}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <h3 className="dm-ajuda-subtitulo">O que a moderação pode fazer</h3>
            <ul className="dm-ajuda-acoes-mod">
              {ACOES_MODERACAO.map((acao) => (
                <li key={acao.titulo}>
                  <span className="dm-ajuda-acoes-mod__rotulo">{acao.titulo}</span>
                  <p>{acao.texto}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* ---------- SOBRE ---------- */}
          <section id="sobre" className="dm-ajuda-secao">
            <CabecalhoSecao numero="06" Icone={FiMapPin} titulo="Sobre o DangerMap" />
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
                <Link to="/baixar-app" className="dm-btn dm-btn--primario dm-btn--pequeno">
                  <FiSmartphone size={14} aria-hidden="true" />
                  <span>Leve no celular</span>
                </Link>
              </aside>
            </div>
          </section>

          {/* ---------- CONTATO ---------- */}
          <section id="contato" className="dm-ajuda-secao">
            <CabecalhoSecao
              numero="07"
              Icone={FiGithub}
              titulo="Contato"
              descricao="Não achou sua resposta? Fale com quem mantém o projeto."
            />
            <ul className="dm-ajuda-contatos">
              <li>
                <a className="dm-ajuda-contato" href={URL_ISSUES} target="_blank" rel="noreferrer">
                  <span className="dm-ajuda-contato__icone" aria-hidden="true"><FiAlertTriangle size={18} /></span>
                  <strong>Encontrou um erro?</strong>
                  <span>Descreva o que aconteceu, em qual tela e, se puder, com um print. Abra uma issue no GitHub.</span>
                  <span className="dm-ajuda-contato__cta">Relatar problema <FiArrowRight size={13} aria-hidden="true" /></span>
                </a>
              </li>
              <li>
                <a className="dm-ajuda-contato" href={URL_ISSUES} target="_blank" rel="noreferrer">
                  <span className="dm-ajuda-contato__icone" aria-hidden="true"><FiPlusCircle size={18} /></span>
                  <strong>Sugestões e feedback</strong>
                  <span>Ideia de categoria nova, recurso ou melhoria? Conte para a gente pelo mesmo canal.</span>
                  <span className="dm-ajuda-contato__cta">Enviar sugestão <FiArrowRight size={13} aria-hidden="true" /></span>
                </a>
              </li>
              <li>
                <a className="dm-ajuda-contato" href={URL_REPOSITORIO} target="_blank" rel="noreferrer">
                  <span className="dm-ajuda-contato__icone" aria-hidden="true"><FiCode size={18} /></span>
                  <strong>Código-fonte</strong>
                  <span>Veja como o DangerMap funciona por dentro e contribua com o projeto.</span>
                  <span className="dm-ajuda-contato__cta">Abrir repositório <FiArrowRight size={13} aria-hidden="true" /></span>
                </a>
              </li>
            </ul>
            <p className="dm-ajuda-nota">
              Problema com uma ocorrência ou um perfil específico? Use a <strong>denúncia</strong> dentro do próprio app
              — ela chega direto na moderação.
            </p>
          </section>
        </div>
      </div>

      {/* ---------- RODAPÉ ---------- */}
      <footer className="dm-ajuda-rodape">
        <span className="dm-mono">Última atualização: {ULTIMA_ATUALIZACAO}</span>
        <nav aria-label="Links úteis">
          {autenticado && <Link to="/configuracoes">Configurações</Link>}
          <Link to="/baixar-app">Baixar o app</Link>
          <Link to="/">Voltar ao mapa</Link>
        </nav>
      </footer>
    </LayoutPadrao>
  );
}
