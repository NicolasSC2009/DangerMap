import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './mapa.css';
import '../comum/esqueleto.css';
import iconeMarcadorPadrao from 'leaflet/dist/images/marker-icon.png';
import iconeMarcadorPadrao2x from 'leaflet/dist/images/marker-icon-2x.png';
import sombraMarcadorPadrao from 'leaflet/dist/images/marker-shadow.png';
import { FiChevronRight, FiDroplet, FiMapPin } from 'react-icons/fi';
import { CHAVE_ULTIMA_VISTA_MAPA, TILES, type ClimaOrigem, type UnidadeTemperatura } from '../../theme/preferencias';
import { api } from '../../services/api';
import { usePreferencias } from '../../contexts/PreferenciasContext';
import { CamadaOcorrencias } from './CamadaOcorrencias';
import { buscarEndereco } from '../../services/geo';
import { ZOOM_MAXIMO } from './agrupamento';
import { IconeClima, ModalClima } from '../clima/ModalClima';
import { NOME_CLIMA, type PrevisaoClima } from '../clima/clima';
import type { Ocorrencia } from '@shared/types';
import { obterPosicao } from '../../services/geolocalizacao';

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

function CapsulaClima(props: {
  lat: number;
  lng: number;
  previsao: PrevisaoClima | null;
  carregando: boolean;
  unidade: UnidadeTemperatura;
  daMinhaPosicao: boolean;
}) {
  const ref = useIsolarDoMapa<HTMLDivElement>();
  const [lugar, setLugar] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const atual = props.previsao?.atual ?? null;
  const temperatura = atual
    ? props.unidade === 'f'
      ? Math.round((atual.temperatura * 9) / 5 + 32)
      : atual.temperatura
    : 0;

  // Mostra a cidade (ex.: "Criciúma - SC") em vez de números de coordenada.
  useEffect(
    function () {
      let ativo = true;
      buscarEndereco(props.lat, props.lng).then(function (endereco) {
        if (!ativo) return;
        const cidade = [endereco?.cidade, endereco?.uf].filter(Boolean).join(' - ');
        setLugar(cidade || null);
      });
      return function () {
        ativo = false;
      };
    },
    [props.lat, props.lng]
  );

  const nomeLugar = lugar ?? 'Local no mapa';
  const dica = props.daMinhaPosicao ? `Clima onde você está (${nomeLugar})` : `Clima em ${nomeLugar}`;
  const abrivel = Boolean(props.previsao) && !props.carregando;

  return (
    <div ref={ref} className="dm-mapa-clima-raiz">
      <button
        type="button"
        className="dm-mapa-clima"
        onClick={() => setAberto(true)}
        disabled={!abrivel}
        aria-label={atual ? `${dica}: ${temperatura} graus, ${NOME_CLIMA[atual.clima]}. Ver previsão` : dica}
        title={abrivel ? 'Ver a previsão completa' : dica}
      >
        {props.carregando ? (
          <span className="dm-mapa-clima__carregando" role="status">
            <span className="dm-visually-hidden">Carregando clima…</span>
            <span className="dm-esqueleto" style={{ width: 32, height: 32, borderRadius: '50%' }} aria-hidden="true" />
            <span className="dm-mapa-clima__textos" aria-hidden="true">
              <span className="dm-esqueleto" style={{ width: 92, height: 11, borderRadius: 6 }} />
              <span className="dm-esqueleto" style={{ width: 64, height: 9, borderRadius: 5 }} />
            </span>
          </span>
        ) : atual ? (
          <>
            <IconeClima tipo={atual.clima} className="dm-mapa-clima__icone" />
            <span className="dm-mapa-clima__temp">
              {temperatura}°{props.unidade === 'f' ? 'F' : 'C'}
            </span>
            <span className="dm-mapa-clima__textos">
              <span className="dm-mapa-clima__condicao">{NOME_CLIMA[atual.clima]}</span>
              <span className="dm-mapa-clima__detalhe">
                <FiMapPin size={11} aria-hidden="true" />
                <span className="dm-mapa-clima__lugar">{nomeLugar}</span>
                {atual.umidade !== null && (
                  <span className="dm-mapa-clima__umidade">
                    <FiDroplet size={11} aria-hidden="true" />
                    {atual.umidade}%
                  </span>
                )}
              </span>
            </span>
            <FiChevronRight className="dm-mapa-clima__seta" size={16} aria-hidden="true" />
          </>
        ) : (
          <span className="dm-mapa-clima__suave">
            <FiMapPin size={13} aria-hidden="true" /> Clima indisponível
          </span>
        )}
      </button>

      {aberto && props.previsao && (
        <ModalClima
          previsao={props.previsao}
          lugar={lugar}
          unidade={props.unidade}
          aoFechar={() => setAberto(false)}
        />
      )}
    </div>
  );
}

// Clima do lugar: da posição do usuário (quando ele permitiu) ou do centro do mapa.
// Assim o clima aparece mesmo para quem não compartilha a localização.
function ClimaNoMapa(props: { unidade: UnidadeTemperatura; origem: ClimaOrigem; posicaoUsuario: [number, number] | null }) {
  const mapa = useMap();
  const [centro, setCentro] = useState<[number, number]>(function () {
    const c = mapa.getCenter();
    return [c.lat, c.lng];
  });
  const [previsao, setPrevisao] = useState<PrevisaoClima | null>(null);
  const [carregando, setCarregando] = useState(true);

  useMapEvents({
    moveend: function () {
      const c = mapa.getCenter();
      setCentro([c.lat, c.lng]);
    },
  });

  const daMinhaPosicao = props.origem === 'minha' && props.posicaoUsuario !== null;
  const alvo = daMinhaPosicao ? (props.posicaoUsuario as [number, number]) : centro;
  // Arredonda a ~5 km: arrastar um pouco o mapa não dispara nova consulta.
  const lat = Math.round(alvo[0] * 20) / 20;
  const lng = Math.round(alvo[1] * 20) / 20;

  useEffect(
    function () {
      let ativo = true;
      setCarregando(true);
      const espera = setTimeout(function () {
        api
          .get<PrevisaoClima>('/clima/previsao', { params: { lat, lng } })
          .then(function (resposta) {
            if (ativo) setPrevisao(resposta.data?.atual ? resposta.data : null);
          })
          .catch(function () {
            if (ativo) setPrevisao(null);
          })
          .finally(function () {
            if (ativo) setCarregando(false);
          });
      }, 600);
      return function () {
        ativo = false;
        clearTimeout(espera);
      };
    },
    [lat, lng]
  );

  return (
    <CapsulaClima
      lat={lat}
      lng={lng}
      previsao={previsao}
      carregando={carregando}
      unidade={props.unidade}
      daMinhaPosicao={daMinhaPosicao}
    />
  );
}
const CHAVE_ESCOLHA_LOCALIZACAO = '@DangerMap:escolhaLocalizacao';

function LocalizadorUsuario(props: {
  mostrarClima: boolean;
  voarAoIniciar: boolean;
  unidade: UnidadeTemperatura;
  climaOrigem: ClimaOrigem;
}) {
  const mapa = useMap();
  const [status, setStatus] = useState<StatusPermissaoLocalizacao>('perguntando');
  const [posicaoAtual, setPosicaoAtual] = useState<[number, number] | null>(null);

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

  function solicitarLocalizacao(voar: boolean = true) {
    setStatus('solicitando');
    obterPosicao(
      function (posicao) {
        const lat = posicao.coords.latitude;
        const lng = posicao.coords.longitude;
        localStorage.setItem(CHAVE_ESCOLHA_LOCALIZACAO, 'concedida');
        setStatus('concedida');
        setPosicaoAtual([lat, lng]);
        if (voar) mapa.flyTo([lat, lng], 14, { animate: true });
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
        <Marker position={posicaoAtual} icon={iconePosicaoUsuario} interactive={false} />
      )}

      {props.mostrarClima && (
        <ClimaNoMapa
          unidade={props.unidade}
          origem={props.climaOrigem}
          posicaoUsuario={status === 'concedida' ? posicaoAtual : null}
        />
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
      mapa.attributionControl?.setPrefix(false);
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
        zoomControl={false}
        className="dm-mapa__leaflet"
        {...(decorativo
          ? {
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
            climaOrigem={preferencias.climaOrigem}
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
