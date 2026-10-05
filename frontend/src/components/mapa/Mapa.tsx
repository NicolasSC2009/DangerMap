import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './mapa.css';
import iconeMarcadorPadrao from 'leaflet/dist/images/marker-icon.png';
import iconeMarcadorPadrao2x from 'leaflet/dist/images/marker-icon-2x.png';
import sombraMarcadorPadrao from 'leaflet/dist/images/marker-shadow.png';
import { FiMapPin, FiThermometer, FiDroplet } from 'react-icons/fi';
import { CHAVE_ULTIMA_VISTA_MAPA, TILES, type UnidadeTemperatura } from '../../theme/preferencias';
import { usePreferencias } from '../../contexts/PreferenciasContext';
import { CamadaOcorrencias } from './CamadaOcorrencias';
import { ZOOM_MAXIMO } from './agrupamento';
import type { Ocorrencia } from '@shared/types';

// Ícone padrão do Leaflet servido pelo próprio bundle (antes vinha do unpkg).
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconeMarcadorPadrao2x,
  iconUrl: iconeMarcadorPadrao,
  shadowUrl: sombraMarcadorPadrao,
});

// Estilos em mapa.css (.dm-marcador-usuario__*); a animação dm-pulso também.
const iconePosicaoUsuario = L.divIcon({
  className: 'dm-marcador-usuario',
  html: '<span class="dm-marcador-usuario__pulso"></span><span class="dm-marcador-usuario__ponto"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export interface VistaMapa {
  lat: number;
  lng: number;
  zoom: number;
}

// Última vista salva (preferência "lembrar posição do mapa"), ou null.
export function lerUltimaVistaMapa(): VistaMapa | null {
  try {
    const bruto = localStorage.getItem(CHAVE_ULTIMA_VISTA_MAPA);
    if (!bruto) return null;
    const v = JSON.parse(bruto);
    if (typeof v?.lat === 'number' && typeof v?.lng === 'number' && typeof v?.zoom === 'number') {
      return { lat: v.lat, lng: v.lng, zoom: v.zoom };
    }
  } catch {
    // ignora valor corrompido / storage indisponível
  }
  return null;
}

function salvarUltimaVistaMapa(vista: VistaMapa) {
  try {
    localStorage.setItem(CHAVE_ULTIMA_VISTA_MAPA, JSON.stringify(vista));
  } catch {
    // ignora
  }
}

interface MapaProps {
  ocorrencias?: Ocorrencia[];
  aoPronto?: (mapa: L.Map) => void;
  aoClicarNoMapa?: (lat: number, lng: number) => void;
  aoClicarOcorrencia?: (ocorrenciaId: number) => void;
  aoMudarZoom?: (zoom: number) => void;
  posicaoInicial?: [number, number];
  zoomInicial?: number;
  /** Salva {lat,lng,zoom} no moveend (se a preferência lembrarPosicaoMapa estiver ligada). */
  lembrarVista?: boolean;
  /** Fundo decorativo (telas de auth): sem controles, interação, geolocalização, clima nem eventos. */
  decorativo?: boolean;
}

const LIMITES_SUPER_EXPANDIDOS: L.LatLngBoundsExpression = [
  [-55.0, -110.0],
  [20.0, -10.0],
];

interface ClimaAtual {
  temperatura: number;
  umidade: number;
  condicao: string | null;
}

type StatusPermissaoLocalizacao = 'perguntando' | 'solicitando' | 'concedida' | 'negada';

// Impede que cliques/scroll em elementos sobre o mapa cheguem ao Leaflet.
function useIsolarDoMapa<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(function () {
    if (ref.current) {
      L.DomEvent.disableClickPropagation(ref.current);
      L.DomEvent.disableScrollPropagation(ref.current);
    }
  }, []);
  return ref;
}

function CartaoPermissaoLocalizacao(props: { aoPermitir: () => void; aoRecusar: () => void; solicitando: boolean }) {
  const ref = useIsolarDoMapa<HTMLDivElement>();

  return (
    <div ref={ref} className="dm-mapa-permissao" role="dialog" aria-labelledby="dm-mapa-permissao-titulo">
      <span className="dm-mapa-permissao__icone" aria-hidden="true">
        <FiMapPin size={18} />
      </span>
      <div className="dm-mapa-permissao__corpo">
        <div className="dm-eyebrow dm-eyebrow--sobre-escuro dm-mapa-permissao__eyebrow">
          <span className="dm-eyebrow__marca" aria-hidden="true" />
          Localização
        </div>
        <h2 id="dm-mapa-permissao-titulo" className="dm-mapa-permissao__titulo">
          Usar sua localização atual?
        </h2>
        <p className="dm-mapa-permissao__texto">
          O DangerMap centraliza o mapa perto de você e mostra o clima do local. Sua posição não é compartilhada com
          outros usuários.
        </p>
        <div className="dm-mapa-permissao__acoes">
          <button
            type="button"
            className="dm-btn dm-btn--primario dm-btn--pequeno"
            onClick={props.aoPermitir}
            disabled={props.solicitando}
          >
            {props.solicitando ? 'Solicitando…' : 'Permitir'}
          </button>
          <button type="button" className="dm-btn dm-btn--sobre-escuro dm-btn--pequeno" onClick={props.aoRecusar}>
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}

function CapsulaCoordenadaClima(props: {
  lat: number;
  lng: number;
  clima: ClimaAtual | null;
  carregando: boolean;
  unidade: UnidadeTemperatura;
}) {
  const ref = useIsolarDoMapa<HTMLDivElement>();
  const temperatura = props.clima
    ? props.unidade === 'f'
      ? Math.round((props.clima.temperatura * 9) / 5 + 32)
      : props.clima.temperatura
    : 0;
  const coordenadas =`${props.lat.toFixed(4)}, ${props.lng.toFixed(4)}`;

  return (
    <div ref={ref} className="dm-mapa-clima" aria-live="polite" title={`Sua posição: ${coordenadas}`}>
      <span className="dm-mapa-clima__item dm-mapa-clima__coord">
        <FiMapPin size={13} aria-hidden="true" />
        <span className="dm-mapa-clima__texto-coord">{coordenadas}</span>
      </span>

      <span className="dm-mapa-clima__sep" aria-hidden="true" />

      {props.carregando ? (
        <span className="dm-mapa-clima__suave">Carregando clima…</span>
      ) : props.clima ? (
        <>
          <span className="dm-mapa-clima__item" aria-label={`Temperatura ${temperatura} graus`}>
            <FiThermometer size={13} aria-hidden="true" />
            {temperatura}°{props.unidade === 'f' ? 'F' : 'C'}
          </span>
          <span className="dm-mapa-clima__item" aria-label={`Umidade ${props.clima.umidade}%`}>
            <FiDroplet size={13} aria-hidden="true" />
            {props.clima.umidade}%
          </span>
          {props.clima.condicao && (
            <span className="dm-mapa-clima__suave dm-mapa-clima__condicao">{props.clima.condicao}</span>
          )}
        </>
      ) : (
        <span className="dm-mapa-clima__suave">Clima indisponível</span>
      )}
    </div>
  );
}

const CHAVE_ESCOLHA_LOCALIZACAO = '@DangerMap:escolhaLocalizacao';

function LocalizadorUsuario(props: { mostrarClima: boolean; voarAoIniciar: boolean; unidade: UnidadeTemperatura }) {
  const mapa = useMap();
  const [status, setStatus] = useState<StatusPermissaoLocalizacao>('perguntando');
  const [posicaoAtual, setPosicaoAtual] = useState<[number, number] | null>(null);
  const [clima, setClima] = useState<ClimaAtual | null>(null);
  const [carregandoClima, setCarregandoClima] = useState(false);

  useEffect(function () {
    if (!('geolocation' in navigator)) {
      setStatus('negada');
      return;
    }

    const escolhaSalva = localStorage.getItem(CHAVE_ESCOLHA_LOCALIZACAO);
    if (escolhaSalva === 'concedida') {
      // Já autorizado antes: se existe uma vista lembrada, não arrasta o mapa para longe dela.
      solicitarLocalizacao(props.voarAoIniciar);
    } else if (escolhaSalva === 'negada') {
      setStatus('negada');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function buscarClima(lat: number, lng: number) {
    setCarregandoClima(true);
    fetch(`/api/clima?lat=${lat}&lng=${lng}`)
      .then(function (res) {
        return res.json();
      })
      .then(function (dados) {
        if (dados && typeof dados.temperatura === 'number') {
          setClima({
            temperatura: Math.round(dados.temperatura),
            umidade: dados.umidade ?? 0,
            condicao: dados.condicao_tempo ?? null,
          });
        }
      })
      .catch(function (erro) {
        console.error('[ERRO AO BUSCAR CLIMA]:', erro);
      })
      .finally(function () {
        setCarregandoClima(false);
      });
  }

  function solicitarLocalizacao(voar: boolean = true) {
    setStatus('solicitando');
    navigator.geolocation.getCurrentPosition(
      function (posicao) {
        const lat = posicao.coords.latitude;
        const lng = posicao.coords.longitude;
        localStorage.setItem(CHAVE_ESCOLHA_LOCALIZACAO, 'concedida');
        setStatus('concedida');
        setPosicaoAtual([lat, lng]);
        if (voar) mapa.flyTo([lat, lng], 14, { animate: true });
        buscarClima(lat, lng);
      },
      function (erro) {
        console.warn('[GEOLOCALIZAÇÃO]: Permissão negada ou indisponível.', erro);
        localStorage.setItem(CHAVE_ESCOLHA_LOCALIZACAO, 'negada');
        setStatus('negada');
      },
      { timeout: 10000 }
    );
  }

  function recusarLocalizacao() {
    localStorage.setItem(CHAVE_ESCOLHA_LOCALIZACAO, 'negada');
    setStatus('negada');
  }

  return (
    <>
      {(status === 'perguntando' || status === 'solicitando') && (
        <CartaoPermissaoLocalizacao
          aoPermitir={() => solicitarLocalizacao(true)}
          aoRecusar={recusarLocalizacao}
          solicitando={status === 'solicitando'}
        />
      )}

      {status === 'concedida' && posicaoAtual && (
        <>
          <Marker position={posicaoAtual} icon={iconePosicaoUsuario} interactive={false} />
          {props.mostrarClima && (
            <CapsulaCoordenadaClima
              lat={posicaoAtual[0]}
              lng={posicaoAtual[1]}
              clima={clima}
              carregando={carregandoClima}
              unidade={props.unidade}
            />
          )}
        </>
      )}
    </>
  );
}

function EscutadorDeCliques(props: { aoClicar?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: function (evento) {
      if (props.aoClicar) {
        props.aoClicar(evento.latlng.lat, evento.latlng.lng);
      }
    },
  });
  return null;
}

function SalvadorDeVista() {
  const mapa = useMap();
  useMapEvents({
    moveend: function () {
      const centro = mapa.getCenter();
      salvarUltimaVistaMapa({
        lat: Number(centro.lat.toFixed(5)),
        lng: Number(centro.lng.toFixed(5)),
        zoom: mapa.getZoom(),
      });
    },
  });
  return null;
}

// Entrega a instância do Leaflet para fora do <MapContainer> (botões de busca, filtros etc.).
function EntregarMapa(props: { aoPronto?: (mapa: L.Map) => void }) {
  const mapa = useMap();
  useEffect(
    function () {
      props.aoPronto?.(mapa);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mapa]
  );
  return null;
}
export function Mapa(props: MapaProps) {
  const { preferencias, estiloMapaEfetivo } = usePreferencias();
  const centroPadrao: [number, number] = props.posicaoInicial || [-28.6775, -49.3703];
  const tiles = TILES[estiloMapaEfetivo];
  const lembrar = Boolean(props.lembrarVista && preferencias.lembrarPosicaoMapa);
  // Se o mapa abriu numa vista informada/lembrada, não voa automaticamente para o GPS.
  const voarAoIniciar = !props.posicaoInicial;

  const decorativo = Boolean(props.decorativo);

  return (
    <div className={`dm-mapa dm-mapa--${estiloMapaEfetivo}`}>
      <MapContainer
        center={centroPadrao}
        zoom={props.zoomInicial ?? 5}
        minZoom={3}
        maxZoom={ZOOM_MAXIMO}
        maxBounds={LIMITES_SUPER_EXPANDIDOS}
        maxBoundsViscosity={0.2}
        className="dm-mapa__leaflet"
        {...(decorativo
          ? {
              zoomControl: false,
              attributionControl: false,
              dragging: false,
              scrollWheelZoom: false,
              doubleClickZoom: false,
              touchZoom: false,
              boxZoom: false,
              keyboard: false,
            }
          : {})}
      >
        {!decorativo && <LocalizadorUsuario
            mostrarClima={preferencias.mostrarClima}
            voarAoIniciar={voarAoIniciar}
            unidade={preferencias.unidadeTemperatura}
          />}

        <TileLayer key={estiloMapaEfetivo} attribution={tiles.attribution} url={tiles.url} noWrap={true} maxZoom={ZOOM_MAXIMO} maxNativeZoom={19} />
        <EntregarMapa aoPronto={props.aoPronto} />

        {!decorativo && <EscutadorDeCliques aoClicar={props.aoClicarNoMapa} />}
        {!decorativo && lembrar && <SalvadorDeVista />}

        {!decorativo && (
          <CamadaOcorrencias
            ocorrencias={props.ocorrencias}
            agrupar={preferencias.agruparOcorrencias}
            tamanho={preferencias.tamanhoMarcadores}
            aoClicarOcorrencia={props.aoClicarOcorrencia}
            aoMudarZoom={props.aoMudarZoom}
          />
        )}
      </MapContainer>
    </div>
  );
}
