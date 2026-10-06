import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { toast } from 'react-toastify';
import { FiBarChart2, FiClock, FiCrosshair, FiMapPin, FiMinus, FiPlus, FiSearch, FiSliders, FiX } from 'react-icons/fi';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { COR_GRAVIDADE, ROTULO_GRAVIDADE } from '../../theme/rotulos';
import { obterIconeCategoria } from '../../theme/iconesCategorias';
import type { Gravidade } from '@shared/types';
import {
  FILTROS_VAZIOS,
  GRAVIDADES,
  quantidadeFiltrosAtivos,
  type FiltrosMapa,
} from '../../services/filtrosMapa';
import './ferramentasMapa.css';

interface ResultadoBusca {
  nome: string;
  texto: string;
  latitude: number;
  longitude: number;
  limites: [number, number, number, number] | null;
}

interface Props {
  mapa: L.Map | null;
  /** Categorias presentes nas ocorrências carregadas (vale pra quem não está logado também). */
  categorias: { id: number; nome: string }[];
  filtros: FiltrosMapa;
  aoMudarFiltros: (filtros: FiltrosMapa) => void;
  totalGeral: number;
  totalVisivel: number;
  mostrarLegenda: boolean;
}

type Painel = 'busca' | 'filtros' | null;

const CHAVE_BUSCAS_RECENTES = '@DangerMap:mapa:buscasRecentes';
const MAXIMO_RECENTES = 5;
const MINIMO_LETRAS = 3;
const ESPERA_DIGITACAO_MS = 450;

function lerRecentes(): ResultadoBusca[] {
  try {
    const lista = JSON.parse(localStorage.getItem(CHAVE_BUSCAS_RECENTES) || '[]');
    return Array.isArray(lista)
      ? lista.filter((r) => r && typeof r.nome === 'string' && typeof r.latitude === 'number').slice(0, MAXIMO_RECENTES)
      : [];
  } catch {
    return [];
  }
}

function guardarRecentes(lista: ResultadoBusca[]) {
  try {
    localStorage.setItem(CHAVE_BUSCAS_RECENTES, JSON.stringify(lista));
  } catch {
    // sem armazenamento: só não lembra
  }
}

// Endereço sem o que já aparece no título, sem "Brasil" e sem CEP.
function complemento(r: ResultadoBusca): string {
  const partes = r.texto.split(', ').map((p) => p.trim());
  if (partes[0] === r.nome) partes.shift();
  return partes
    .filter((p) => p && p !== 'Brasil' && !/^\d{5}-?\d{3}$/.test(p) && !p.startsWith('Região '))
    .slice(0, 4)
    .join(', ');
}
function alternar<T>(lista: T[], item: T): T[] {
  return lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item];
}

export function FerramentasMapa(props: Props) {
  const { mapa } = props;
  const { ehAdmin } = useAuth();
  const navegar = useNavigate();
  const [zoom, setZoom] = useState<number | null>(null);
  const [painel, setPainel] = useState<Painel>(null);
  const [termo, setTermo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState<ResultadoBusca[] | null>(null);
  const [falhou, setFalhou] = useState(false);
  const [ativo, setAtivo] = useState(-1);
  const [recentes, setRecentes] = useState<ResultadoBusca[]>(lerRecentes);
  const [localizando, setLocalizando] = useState(false);
  const raizRef = useRef<HTMLDivElement>(null);
  const campoRef = useRef<HTMLInputElement>(null);
  const marcadorBuscaRef = useRef<L.Marker | null>(null);
  const ativos = quantidadeFiltrosAtivos(props.filtros);

  // Cliques/roda aqui não podem mexer no mapa por baixo.
  useEffect(function () {
    if (raizRef.current) {
      L.DomEvent.disableClickPropagation(raizRef.current);
      L.DomEvent.disableScrollPropagation(raizRef.current);
    }
  }, []);

  // Mantém os botões de zoom (+ e −) em sintonia com o mapa: desligam no limite.
  useEffect(
    function () {
      if (!mapa) return;
      const atualizar = () => setZoom(mapa.getZoom());
      atualizar();
      mapa.on('zoomend', atualizar);
      return function () {
        mapa.off('zoomend', atualizar);
      };
    },
    [mapa]
  );

  useEffect(
    function () {
      if (painel === 'busca') campoRef.current?.focus();
    },
    [painel]
  );

  useEffect(function () {
    function aoPressionarEsc(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setPainel(null);
    }
    document.addEventListener('keydown', aoPressionarEsc);
    return function () {
      document.removeEventListener('keydown', aoPressionarEsc);
    };
  }, []);

  useEffect(function () {
    return function () {
      marcadorBuscaRef.current?.remove();
    };
  }, []);

  // Sugestões enquanto digita: espera uma pausa na digitação e ignora respostas antigas.
  useEffect(
    function () {
      const texto = termo.trim();
      setAtivo(-1);
      setFalhou(false);
      if (texto.length < MINIMO_LETRAS) {
        setResultados(null);
        setBuscando(false);
        return;
      }
      setBuscando(true);
      const controle = new AbortController();
      const espera = window.setTimeout(function () {
        api
          .get<{ resultados: ResultadoBusca[] }>('/geo/buscar', { params: { q: texto }, signal: controle.signal })
          .then(function (resposta) {
            // O mesmo trecho de rua costuma vir repetido: mostra só um de cada.
            const vistos = new Set<string>();
            setResultados(
              resposta.data.resultados.filter(function (r) {
                const chave = r.nome + '|' + complemento(r);
                if (vistos.has(chave)) return false;
                vistos.add(chave);
                return true;
              })
            );
            setBuscando(false);
          })
          .catch(function (erro) {
            if (controle.signal.aborted || erro?.code === 'ERR_CANCELED') return;
            setResultados(null);
            setFalhou(true);
            setBuscando(false);
          });
      }, ESPERA_DIGITACAO_MS);
      return function () {
        window.clearTimeout(espera);
        controle.abort();
      };
    },
    [termo]
  );

  const mostrandoRecentes = termo.trim().length < MINIMO_LETRAS;
  const opcoes = mostrandoRecentes ? recentes : resultados ?? [];

  function aoDigitarTecla(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      if (opcoes.length === 0) return;
      evento.preventDefault();
      const passo = evento.key === 'ArrowDown' ? 1 : -1;
      setAtivo((i) => (i + passo + opcoes.length) % opcoes.length);
    } else if (evento.key === 'Enter') {
      evento.preventDefault();
      const escolhida = opcoes[ativo >= 0 ? ativo : 0];
      if (escolhida) irPara(escolhida);
    }
  }

  function limparRecentes() {
    setRecentes([]);
    guardarRecentes([]);
  }
  function irPara(r: ResultadoBusca) {
    if (!mapa) return;
    const novas = [r, ...recentes.filter((x) => !(x.latitude === r.latitude && x.longitude === r.longitude))].slice(0, MAXIMO_RECENTES);
    setRecentes(novas);
    guardarRecentes(novas);
    if (r.limites) {
      const [sul, norte, oeste, leste] = r.limites; // o Nominatim manda [sul, norte, oeste, leste]
      mapa.flyToBounds(
        [
          [sul, oeste],
          [norte, leste],
        ],
        { maxZoom: 17, padding: [40, 40], duration: 0.8 }
      );
    } else {
      mapa.flyTo([r.latitude, r.longitude], 16, { duration: 0.8 });
    }

    marcadorBuscaRef.current?.remove();
    const marcador = L.marker([r.latitude, r.longitude], {
      interactive: false,
      icon: L.divIcon({
        className: 'dm-marcador-busca',
        html: '<span class="dm-marcador-busca__pino"></span>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
    }).addTo(mapa);
    marcadorBuscaRef.current = marcador;
    window.setTimeout(function () {
      if (marcadorBuscaRef.current === marcador) {
        marcador.remove();
        marcadorBuscaRef.current = null;
      }
    }, 9000);

    setPainel(null);
  }

  function localizar() {
    if (!mapa) return;
    if (!navigator.geolocation) {
      toast.info('Este aparelho não permite usar a localização.');
      return;
    }
    setLocalizando(true);
    navigator.geolocation.getCurrentPosition(
      function (posicao) {
        setLocalizando(false);
        mapa.flyTo([posicao.coords.latitude, posicao.coords.longitude], Math.max(mapa.getZoom(), 16), { duration: 0.8 });
      },
      function () {
        setLocalizando(false);
        toast.info('Não foi possível obter sua localização. Confira se a permissão está liberada.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  return (
    <div ref={raizRef} className="dm-ferramentas">
      <div className="dm-barra" role="toolbar" aria-orientation="vertical" aria-label="Ferramentas do mapa">
        <div className="dm-barra__grupo">
          <button
            type="button"
            className="dm-barra__botao"
            onClick={() => mapa?.zoomIn()}
            disabled={!mapa || (zoom !== null && mapa.getMaxZoom() <= zoom)}
            aria-label="Aproximar o mapa"
            title="Aproximar"
          >
            <FiPlus aria-hidden="true" />
          </button>
          <button
            type="button"
            className="dm-barra__botao"
            onClick={() => mapa?.zoomOut()}
            disabled={!mapa || (zoom !== null && mapa.getMinZoom() >= zoom)}
            aria-label="Afastar o mapa"
            title="Afastar"
          >
            <FiMinus aria-hidden="true" />
          </button>
        </div>

        <div className="dm-barra__grupo">
          <button
            type="button"
            className={`dm-barra__botao${painel === 'busca' ? ' dm-barra__botao--ativo' : ''}`}
            onClick={() => setPainel((p) => (p === 'busca' ? null : 'busca'))}
            aria-label="Buscar endereço"
            aria-expanded={painel === 'busca'}
            title="Buscar endereço"
          >
            <FiSearch aria-hidden="true" />
          </button>

          <button
            type="button"
            className={`dm-barra__botao${painel === 'filtros' ? ' dm-barra__botao--ativo' : ''}`}
            onClick={() => setPainel((p) => (p === 'filtros' ? null : 'filtros'))}
            aria-label={ativos ? `Filtros (${ativos} ativos)` : 'Filtros'}
            aria-expanded={painel === 'filtros'}
            title="Filtrar ocorrências"
          >
            <FiSliders aria-hidden="true" />
            {ativos > 0 && <span className="dm-barra__selo">{ativos}</span>}
          </button>

          <button
            type="button"
            className="dm-barra__botao"
            onClick={localizar}
            disabled={localizando}
            aria-label="Ir para a minha localização"
            title="Minha localização"
          >
            <FiCrosshair aria-hidden="true" className={localizando ? 'dm-barra__girando' : undefined} />
          </button>
        </div>

        {ehAdmin && (
          <div className="dm-barra__grupo">
            <button
              type="button"
              className="dm-barra__botao"
              onClick={() => navegar('/admin')}
              aria-label="Painel do administrador"
              title="Painel do administrador"
            >
              <FiBarChart2 aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      {painel === 'busca' && (
        <div className="dm-ferramentas__painel dm-ferramentas__painel--busca" role="dialog" aria-label="Buscar endereço">
          <div className="dm-busca">
            <FiSearch className="dm-busca__lupa" aria-hidden="true" />
            <input
              ref={campoRef}
              type="text"
              role="combobox"
              aria-expanded={opcoes.length > 0}
              aria-controls="dm-busca-lista"
              aria-activedescendant={ativo >= 0 ? `dm-busca-opcao-${ativo}` : undefined}
              aria-autocomplete="list"
              className="dm-busca__campo"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              onKeyDown={aoDigitarTecla}
              placeholder="Buscar rua, bairro ou cidade"
              maxLength={120}
              autoComplete="off"
              spellCheck={false}
              aria-label="Endereço, bairro ou cidade"
              enterKeyHint="search"
            />
            {buscando ? (
              <span className="dm-busca__girando" role="status" aria-label="Buscando" />
            ) : (
              termo && (
                <button
                  type="button"
                  className="dm-busca__limpar"
                  onClick={() => {
                    setTermo('');
                    campoRef.current?.focus();
                  }}
                  aria-label="Limpar busca"
                >
                  <FiX aria-hidden="true" />
                </button>
              )
            )}
          </div>

          {mostrandoRecentes && recentes.length > 0 && (
            <div className="dm-busca__cabeca">
              <span>Buscas recentes</span>
              <button type="button" onClick={limparRecentes}>
                Limpar
              </button>
            </div>
          )}

          {opcoes.length > 0 && (
            <ul className="dm-busca__lista" id="dm-busca-lista" role="listbox">
              {opcoes.map((r, i) => (
                <li
                  key={`${r.latitude}-${r.longitude}-${i}`}
                  id={`dm-busca-opcao-${i}`}
                  role="option"
                  aria-selected={i === ativo}
                >
                  <button
                    type="button"
                    className={`dm-busca__item${i === ativo ? ' dm-busca__item--ativo' : ''}`}
                    onClick={() => irPara(r)}
                    onMouseEnter={() => setAtivo(i)}
                  >
                    <span className="dm-busca__icone" aria-hidden="true">
                      {mostrandoRecentes ? <FiClock /> : <FiMapPin />}
                    </span>
                    <span className="dm-busca__textos">
                      <strong>{r.nome}</strong>
                      {complemento(r) && <span>{complemento(r)}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!mostrandoRecentes && !buscando && !falhou && resultados && resultados.length === 0 && (
            <p className="dm-ferramentas__vazio">Nada encontrado. Tente incluir a cidade, por exemplo “Rua X, Criciúma”.</p>
          )}
          {!mostrandoRecentes && falhou && (
            <p className="dm-ferramentas__vazio">Não foi possível buscar agora. Tente de novo em instantes.</p>
          )}
          {mostrandoRecentes && recentes.length === 0 && (
            <p className="dm-ferramentas__vazio">Digite pelo menos {MINIMO_LETRAS} letras: as sugestões aparecem enquanto você escreve.</p>
          )}
        </div>
      )}
      {painel === 'filtros' && (
        <div className="dm-ferramentas__painel" role="dialog" aria-label="Filtrar ocorrências">
          <div className="dm-filtros__topo">
            <strong>Filtrar ocorrências</strong>
            <button type="button" className="dm-filtros__fechar" onClick={() => setPainel(null)} aria-label="Fechar filtros">
              <FiX aria-hidden="true" />
            </button>
          </div>
          <p className="dm-filtros__resumo">
            Mostrando <strong>{props.totalVisivel}</strong> de {props.totalGeral}
          </p>

          <h3 className="dm-filtros__titulo">Gravidade</h3>
          <div className="dm-filtros__chips">
            {GRAVIDADES.map((g) => {
              const marcado = props.filtros.gravidades.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  className={`dm-filtro-chip${marcado ? ' dm-filtro-chip--marcado' : ''}`}
                  aria-pressed={marcado}
                  onClick={() => props.aoMudarFiltros({ ...props.filtros, gravidades: alternar(props.filtros.gravidades, g) })}
                >
                  <span className="dm-filtro-chip__ponto" style={{ background: COR_GRAVIDADE[g] }} aria-hidden="true" />
                  {ROTULO_GRAVIDADE[g]}
                </button>
              );
            })}
          </div>

          {props.categorias.length > 0 && (
            <>
              <h3 className="dm-filtros__titulo">Categoria</h3>
              <div className="dm-filtros__chips">
                {props.categorias.map((c) => {
                  const marcado = props.filtros.categorias.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={`dm-filtro-chip${marcado ? ' dm-filtro-chip--marcado' : ''}`}
                      aria-pressed={marcado}
                      onClick={() =>
                        props.aoMudarFiltros({ ...props.filtros, categorias: alternar(props.filtros.categorias, c.id) })
                      }
                    >
                      <img src={obterIconeCategoria(c.nome)} alt="" />
                      {c.nome}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="dm-filtros__rodape">
            <button
              type="button"
              className="dm-btn dm-btn--ghost dm-btn--pequeno"
              onClick={() => props.aoMudarFiltros(FILTROS_VAZIOS)}
              disabled={ativos === 0}
            >
              Limpar filtros
            </button>
          </div>

          <h3 className="dm-filtros__titulo">Como ler o mapa</h3>
          <Legenda />
        </div>
      )}

      {props.mostrarLegenda && painel !== 'filtros' && (
        <div className="dm-legenda-fixa">
          <Legenda />
        </div>
      )}
    </div>
  );
}

function Legenda() {
  return (
    <ul className="dm-legenda">
      {GRAVIDADES.map((g) => (
        <li key={g}>
          <span className="dm-legenda__ponto" style={{ background: COR_GRAVIDADE[g] }} aria-hidden="true" />
          Gravidade {ROTULO_GRAVIDADE[g].toLowerCase()}
        </li>
      ))}
      <li>
        <span className="dm-legenda__ponto" style={{ background: '#F5B800' }} aria-hidden="true" />
        Ocorrência vista de longe
      </li>
      <li>
        <span className="dm-legenda__balao" aria-hidden="true">
          3
        </span>
        Várias juntas — toque para aproximar
      </li>
    </ul>
  );
}
