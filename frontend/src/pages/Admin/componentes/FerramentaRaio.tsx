import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, CircleMarker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'react-toastify';
import { FiNavigation } from 'react-icons/fi';
import { api } from '../../../services/api';
import { TILES } from '../../../theme/preferencias';
import { usePreferencias } from '../../../contexts/PreferenciasContext';
import { COR_GRAVIDADE, ROTULO_GRAVIDADE } from '../../../theme/rotulos';
import type { ResultadoRelatorioRegiao } from '@shared/types';

export interface Coordenada {
  lat: number;
  lng: number;
}

export const RAIO_MINIMO_M = 500;
export const RAIO_MAXIMO_M = 20000;
export const RAIO_PADRAO_M = 5000;
const CENTRO_BRASIL: [number, number] = [-14.235, -51.9253];

export function limitarRaio(metros: number): number {
  if (!Number.isFinite(metros)) return RAIO_PADRAO_M;
  return Math.min(RAIO_MAXIMO_M, Math.max(RAIO_MINIMO_M, Math.round(metros)));
}

export function formatarRaio(metros: number): string {
  return (metros / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

export function areaKm2(metros: number): string {
  const km = metros / 1000;
  return (Math.PI * km * km).toLocaleString('pt-BR', { maximumFractionDigits: km < 2 ? 2 : 1 });
}

// Ponto na borda leste do círculo (onde fica a alça de arraste).
function pontoLeste(centro: Coordenada, raioMetros: number): Coordenada {
  const metrosPorGrauLng = 111320 * Math.cos((centro.lat * Math.PI) / 180);
  return { lat: centro.lat, lng: centro.lng + raioMetros / Math.max(1, metrosPorGrauLng) };
}

const iconeCentro = L.divIcon({
  className: 'dm-admin-raio-centro',
  html: '<span></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const iconeAlca = L.divIcon({
  className: 'dm-admin-raio-alca',
  html: '<span></span>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

/* ---------------------------------------------------------------------------
   Busca no backend (GET /admin/relatorio-regiao) com debounce — compartilhada
   pela aba "Relatório regional" e pelo modal de prévia rápida.
   ------------------------------------------------------------------------ */

export function useBuscaRegiao(centro: Coordenada | null, raioMetros: number, atrasoMs = 450) {
  const [resultados, setResultados] = useState<ResultadoRelatorioRegiao[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState(false);
  const [versao, setVersao] = useState(0);
  const idRequisicao = useRef(0);

  useEffect(
    function () {
      if (!centro) return;
      const id = ++idRequisicao.current;
      setBuscando(true);
      const temporizador = window.setTimeout(function () {
        api
          .get<ResultadoRelatorioRegiao[]>('/admin/relatorio-regiao', {
            params: { lat: centro.lat, lng: centro.lng, raio: raioMetros },
          })
          .then(function (r) {
            if (id !== idRequisicao.current) return;
            setResultados(r.data);
            setErro(false);
          })
          .catch(function () {
            if (id !== idRequisicao.current) return;
            setErro(true);
            toast.error('Não foi possível gerar o relatório agora.', { toastId: 'erro-relatorio-regiao' });
          })
          .finally(function () {
            if (id === idRequisicao.current) setBuscando(false);
          });
      }, atrasoMs);
      return function () {
        window.clearTimeout(temporizador);
      };
    },
    [centro?.lat, centro?.lng, raioMetros, versao, atrasoMs]
  );

  return { resultados, buscando, erro, recarregar: () => setVersao((v) => v + 1) };
}

/* ------------------------------------------------------------------------ */

function EscutadorDeCliques(props: { aoClicar: (c: Coordenada) => void }) {
  useMapEvents({
    click(evento) {
      props.aoClicar({ lat: evento.latlng.lat, lng: evento.latlng.lng });
    },
  });
  return null;
}

// Reenquadra o mapa no círculo quando `pedido` muda e mantém o tamanho do
// Leaflet em dia quando o container muda (modal abrindo, sidebar, resize).
function AjustarVista(props: { centro: Coordenada | null; raio: number; pedido: number }) {
  const mapa = useMap();

  useEffect(
    function () {
      const container = mapa.getContainer();
      const observador = new ResizeObserver(() => mapa.invalidateSize());
      observador.observe(container);
      const t = window.setTimeout(() => mapa.invalidateSize(), 260);
      return function () {
        observador.disconnect();
        window.clearTimeout(t);
      };
    },
    [mapa]
  );

  useEffect(
    function () {
      if (!props.centro || props.pedido === 0) return;
      const limites = L.latLng(props.centro.lat, props.centro.lng).toBounds(props.raio * 2);
      mapa.fitBounds(limites, { padding: [24, 24], animate: true });
    },
    // só reage a pedidos explícitos (não a cada arraste)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.pedido]
  );

  return null;
}

export interface PontoResultado {
  id: number;
  lat: number;
  lng: number;
  gravidade: ResultadoRelatorioRegiao['gravidade'];
  rotulo: string;
}

interface FerramentaRaioProps {
  centro: Coordenada | null;
  raioMetros: number;
  aoMudarCentro: (c: Coordenada) => void;
  aoMudarRaio: (metros: number) => void;
  /** Ocorrências encontradas, desenhadas como pontos no mapa. */
  pontos?: PontoResultado[];
  aoClicarPonto?: (id: number) => void;
  /** Conteúdo extra na coluna lateral (filtros, prévia, ações…). */
  children?: React.ReactNode;
  /** Variante compacta usada dentro do modal. */
  compacta?: boolean;
}

export function FerramentaRaio(props: FerramentaRaioProps) {
  const { estiloMapaEfetivo } = usePreferencias();
  const tiles = TILES[estiloMapaEfetivo];
  const [pedidoFoco, setPedidoFoco] = useState(props.centro ? 1 : 0);
  const [alcaArrastando, setAlcaArrastando] = useState<Coordenada | null>(null);
  const [textoCoordenada, setTextoCoordenada] = useState('');
  const [erroCoordenada, setErroCoordenada] = useState<string | null>(null);
  const [localizando, setLocalizando] = useState(false);
  const [textoRaio, setTextoRaio] = useState(String(props.raioMetros));

  // Mantém os campos de texto sincronizados com o estado controlado.
  useEffect(
    function () {
      setTextoRaio(String(props.raioMetros));
    },
    [props.raioMetros]
  );
  useEffect(
    function () {
      if (props.centro) setTextoCoordenada(`${props.centro.lat.toFixed(5)}, ${props.centro.lng.toFixed(5)}`);
    },
    [props.centro?.lat, props.centro?.lng]
  );

  const posicaoAlca = useMemo(
    function () {
      if (!props.centro) return null;
      return alcaArrastando ?? pontoLeste(props.centro, props.raioMetros);
    },
    [props.centro, props.raioMetros, alcaArrastando]
  );

  function focar() {
    setPedidoFoco((n) => n + 1);
  }

  function definirCentro(c: Coordenada, reenquadrar: boolean) {
    props.aoMudarCentro(c);
    if (reenquadrar) window.setTimeout(focar, 0);
  }

  function definirRaio(metros: number, reenquadrar: boolean) {
    props.aoMudarRaio(limitarRaio(metros));
    if (reenquadrar && props.centro) window.setTimeout(focar, 0);
  }

  function usarMinhaLocalizacao() {
    if (!navigator.geolocation) {
      toast.info('Seu navegador não oferece geolocalização.');
      return;
    }
    setLocalizando(true);
    navigator.geolocation.getCurrentPosition(
      function (posicao) {
        setLocalizando(false);
        definirCentro({ lat: posicao.coords.latitude, lng: posicao.coords.longitude }, true);
      },
      function () {
        setLocalizando(false);
        toast.info('Não foi possível obter sua localização.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function aplicarCoordenadaDigitada() {
    const partes = textoCoordenada.split(/[,;\s]+/).filter(Boolean).map((p) => Number(p.replace(',', '.')));
    const [lat, lng] = partes;
    if (partes.length !== 2 || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      setErroCoordenada('Use o formato "latitude, longitude" — ex.: -27.5954, -48.5480');
      return;
    }
    setErroCoordenada(null);
    definirCentro({ lat, lng }, true);
  }

  const eventosCentro = useMemo(
    () => ({
      drag(evento: L.LeafletEvent) {
        const p = (evento.target as L.Marker).getLatLng();
        props.aoMudarCentro({ lat: p.lat, lng: p.lng });
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.aoMudarCentro]
  );

  const eventosAlca = useMemo(
    () => ({
      dragstart(evento: L.LeafletEvent) {
        const p = (evento.target as L.Marker).getLatLng();
        setAlcaArrastando({ lat: p.lat, lng: p.lng });
      },
      drag(evento: L.LeafletEvent) {
        if (!props.centro) return;
        const p = (evento.target as L.Marker).getLatLng();
        setAlcaArrastando({ lat: p.lat, lng: p.lng });
        const distancia = L.latLng(props.centro.lat, props.centro.lng).distanceTo(p);
        props.aoMudarRaio(limitarRaio(Math.round(distancia / 50) * 50));
      },
      dragend() {
        setAlcaArrastando(null); // volta para a borda leste do círculo
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.centro?.lat, props.centro?.lng, props.aoMudarRaio]
  );

  const centroLatLng: [number, number] | null = props.centro ? [props.centro.lat, props.centro.lng] : null;

  return (
    <div className={`dm-admin-raio${props.compacta ? ' dm-admin-raio--compacta' : ''}`}>
      <div className="dm-admin-raio__mapa dm-admin-nao-imprimir">
        <MapContainer
          center={centroLatLng ?? CENTRO_BRASIL}
          zoom={centroLatLng ? 12 : 4}
          scrollWheelZoom
          className="dm-admin-raio__leaflet"
        >
          <TileLayer key={estiloMapaEfetivo} url={tiles.url} attribution={tiles.attribution} />
          <EscutadorDeCliques aoClicar={(c) => definirCentro(c, !props.centro)} />
          <AjustarVista centro={props.centro} raio={props.raioMetros} pedido={pedidoFoco} />

          {centroLatLng && (
            <>
              <Circle
                center={centroLatLng}
                radius={props.raioMetros}
                pathOptions={{ color: '#FF6400', weight: 1.8, dashArray: '6 6', fillColor: '#FF6400', fillOpacity: 0.1 }}
                interactive={false}
              />
              {(props.pontos ?? []).map((p) => (
                <CircleMarker
                  key={p.id}
                  center={[p.lat, p.lng]}
                  radius={6}
                  pathOptions={{ color: '#ffffff', weight: 1.5, fillColor: COR_GRAVIDADE[p.gravidade], fillOpacity: 1 }}
                  eventHandlers={props.aoClicarPonto ? { click: () => props.aoClicarPonto?.(p.id) } : undefined}
                >
                  <Tooltip direction="top" offset={[0, -6]}>
                    {p.rotulo} · {ROTULO_GRAVIDADE[p.gravidade]}
                  </Tooltip>
                </CircleMarker>
              ))}
              <Marker
                position={centroLatLng}
                icon={iconeCentro}
                draggable
                eventHandlers={eventosCentro}
                title="Centro da área (arraste para mover)"
                keyboard={false}
              />
              {posicaoAlca && (
                <Marker
                  position={[posicaoAlca.lat, posicaoAlca.lng]}
                  icon={iconeAlca}
                  draggable
                  eventHandlers={eventosAlca}
                  title="Arraste para ajustar o raio"
                  keyboard={false}
                  zIndexOffset={1000}
                />
              )}
            </>
          )}
        </MapContainer>
        <span className="dm-admin-raio__dica">
          {props.centro ? 'Arraste o ponto ou a alça branca para ajustar' : 'Clique no mapa para escolher o centro'}
        </span>
      </div>

      <div className="dm-admin-raio__lado">
        <div className="dm-admin-raio__campo">
          <span className="dm-rotulo" id="dm-admin-raio-rotulo">
            Raio selecionado
          </span>
          <div className="dm-admin-raio__valor">
            <span>{formatarRaio(props.raioMetros)}</span> km
          </div>
          <input
            type="range"
            className="dm-admin-raio__slider dm-admin-nao-imprimir"
            min={RAIO_MINIMO_M / 1000}
            max={RAIO_MAXIMO_M / 1000}
            step={0.5}
            value={props.raioMetros / 1000}
            onChange={(e) => definirRaio(Number(e.target.value) * 1000, false)}
            onPointerUp={() => props.centro && focar()}
            onKeyUp={() => props.centro && focar()}
            aria-labelledby="dm-admin-raio-rotulo"
            aria-valuetext={`${formatarRaio(props.raioMetros)} quilômetros`}
          />
          <div className="dm-admin-raio__escala dm-admin-nao-imprimir" aria-hidden="true">
            <span>0,5 km</span>
            <span>20 km</span>
          </div>
        </div>

        <div className="dm-campo-grupo dm-admin-nao-imprimir">
          <label className="dm-rotulo" htmlFor="dm-admin-raio-metros">
            Raio em metros
          </label>
          <input
            id="dm-admin-raio-metros"
            className="dm-campo"
            type="number"
            inputMode="numeric"
            min={RAIO_MINIMO_M}
            max={RAIO_MAXIMO_M}
            step={50}
            value={textoRaio}
            onChange={(e) => setTextoRaio(e.target.value)}
            onBlur={() => definirRaio(Number(textoRaio), true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') definirRaio(Number(textoRaio), true);
            }}
          />
        </div>

        <div className="dm-campo-grupo dm-admin-nao-imprimir">
          <label className="dm-rotulo" htmlFor="dm-admin-raio-coord">
            Coordenada central
          </label>
          <input
            id="dm-admin-raio-coord"
            className="dm-campo dm-mono"
            type="text"
            inputMode="decimal"
            placeholder="-27.59540, -48.54800"
            value={textoCoordenada}
            aria-invalid={erroCoordenada ? 'true' : undefined}
            onChange={(e) => setTextoCoordenada(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') aplicarCoordenadaDigitada();
            }}
            onBlur={() => {
              if (textoCoordenada.trim()) aplicarCoordenadaDigitada();
            }}
          />
          {erroCoordenada ? <span className="dm-erro">{erroCoordenada}</span> : <span className="dm-dica">Ou clique no mapa. Enter para aplicar.</span>}
        </div>

        <button
          type="button"
          className="dm-btn dm-btn--ghost dm-btn--pequeno dm-admin-nao-imprimir"
          onClick={usarMinhaLocalizacao}
          disabled={localizando}
        >
          <FiNavigation aria-hidden="true" /> {localizando ? 'Localizando…' : 'Minha localização'}
        </button>

        {props.children}
      </div>
    </div>
  );
}
