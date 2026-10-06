import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { toast } from 'react-toastify';
import { FiCrosshair, FiSearch, FiSliders, FiX } from 'react-icons/fi';
import { api } from '../../services/api';
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

function alternar<T>(lista: T[], item: T): T[] {
  return lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item];
}

export function FerramentasMapa(props: Props) {
  const { mapa } = props;
  const [painel, setPainel] = useState<Painel>(null);
  const [termo, setTermo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState<ResultadoBusca[] | null>(null);
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

  async function buscar(evento: React.FormEvent) {
    evento.preventDefault();
    const texto = termo.trim();
    if (texto.length < 3) {
      toast.info('Digite pelo menos 3 letras do endereço ou lugar.');
      return;
    }
    setBuscando(true);
    try {
      const resposta = await api.get<{ resultados: ResultadoBusca[] }>('/geo/buscar', { params: { q: texto } });
      setResultados(resposta.data.resultados);
    } catch {
      setResultados(null);
      toast.error('Não foi possível buscar agora. Tente de novo em instantes.');
    } finally {
      setBuscando(false);
    }
  }

  function irPara(r: ResultadoBusca) {
    if (!mapa) return;
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
      <div className="dm-ferramentas__botoes">
        <button
          type="button"
          className={`dm-ferramenta${painel === 'busca' ? ' dm-ferramenta--ativa' : ''}`}
          onClick={() => setPainel((p) => (p === 'busca' ? null : 'busca'))}
          aria-label="Buscar endereço"
          aria-expanded={painel === 'busca'}
          title="Buscar endereço"
        >
          <FiSearch aria-hidden="true" />
        </button>

        <button
          type="button"
          className={`dm-ferramenta${painel === 'filtros' ? ' dm-ferramenta--ativa' : ''}`}
          onClick={() => setPainel((p) => (p === 'filtros' ? null : 'filtros'))}
          aria-label={ativos ? `Filtros (${ativos} ativos)` : 'Filtros'}
          aria-expanded={painel === 'filtros'}
          title="Filtrar ocorrências"
        >
          <FiSliders aria-hidden="true" />
          {ativos > 0 && <span className="dm-ferramenta__selo">{ativos}</span>}
        </button>

        <button
          type="button"
          className="dm-ferramenta"
          onClick={localizar}
          disabled={localizando}
          aria-label="Ir para a minha localização"
          title="Minha localização"
        >
          <FiCrosshair aria-hidden="true" className={localizando ? 'dm-ferramenta__girando' : undefined} />
        </button>
      </div>

      {painel === 'busca' && (
        <div className="dm-ferramentas__painel" role="dialog" aria-label="Buscar endereço">
          <form className="dm-busca" onSubmit={buscar}>
            <input
              ref={campoRef}
              type="search"
              className="dm-busca__campo"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Rua, bairro ou cidade"
              maxLength={120}
              aria-label="Endereço, bairro ou cidade"
              enterKeyHint="search"
            />
            <button type="submit" className="dm-btn dm-btn--primario dm-btn--pequeno" disabled={buscando}>
              {buscando ? 'Buscando…' : 'Buscar'}
            </button>
          </form>

          {resultados && resultados.length === 0 && (
            <p className="dm-ferramentas__vazio">Nada encontrado. Tente com a cidade, por exemplo “Rua X, Criciúma”.</p>
          )}
          {resultados && resultados.length > 0 && (
            <ul className="dm-busca__lista">
              {resultados.map((r, i) => (
                <li key={`${r.latitude}-${r.longitude}-${i}`}>
                  <button type="button" className="dm-busca__item" onClick={() => irPara(r)}>
                    <strong>{r.nome}</strong>
                    <span>{r.texto}</span>
                  </button>
                </li>
              ))}
            </ul>
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
