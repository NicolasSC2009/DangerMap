import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FiMapPin, FiThermometer, FiDroplet } from 'react-icons/fi';
import { CORES } from '../../theme/cores';
import { obterIconeCategoria } from '../../theme/iconesCategorias';
import type { ClusterOcorrencia, Gravidade } from '@shared/types';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const iconePosicaoUsuario = L.divIcon({
  className: 'dm-marcador-usuario',
  html: `
    <div style="position:relative;width:20px;height:20px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:${CORES.verdeSalada};opacity:0.35;animation:dm-pulso 1.8s ease-out infinite;"></div>
      <div style="position:absolute;top:4px;left:4px;width:12px;height:12px;border-radius:50%;background:${CORES.verdeSalada};border:2px solid ${CORES.eggshell};box-shadow:0 0 6px rgba(0,0,0,0.4);"></div>
    </div>
    <style>
      @keyframes dm-pulso {
        0% { transform: scale(0.6); opacity: 0.5; }
        100% { transform: scale(2.4); opacity: 0; }
      }
    </style>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const CORES_POR_GRAVIDADE: Record<Gravidade, string> = {
  alto: CORES.vermelhoAlerta,
  medio: CORES.laranja,
  baixo: CORES.verdeSalada,
};

function iconeOcorrencia(gravidade?: Gravidade | null, nomeCategoria?: string | null) {
  const cor = (gravidade && CORES_POR_GRAVIDADE[gravidade]) || CORES.laranja;
  const icone = obterIconeCategoria(nomeCategoria);
  return L.divIcon({
    className: 'dm-marcador-ocorrencia',
    html: `
      <div style="position:relative;width:38px;height:39px;">
        <img src="${icone}" alt="" style="width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.45));" />
        <span style="position:absolute;top:-1px;right:1px;width:11px;height:11px;border-radius:50%;background:${cor};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.5);"></span>
      </div>`,
    iconSize: [38, 39],
    iconAnchor: [19, 37],
  });
}

function iconeCluster(quantidade: number, gravidade?: Gravidade | null) {
  const cor = (gravidade && CORES_POR_GRAVIDADE[gravidade]) || CORES.verdeGarrafa;
  const tamanho = quantidade >= 10 ? 44 : 36;
  return L.divIcon({
    className: 'dm-marcador-cluster',
    html: `<div style="width:${tamanho}px;height:${tamanho}px;border-radius:50%;background:${cor};border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Inter',sans-serif;font-weight:800;font-size:${quantidade >= 10 ? 14 : 13}px;">${quantidade}</div>`,
    iconSize: [tamanho, tamanho],
    iconAnchor: [tamanho / 2, tamanho / 2],
  });
}

interface MapaProps {
  clusters?: ClusterOcorrencia[];
  aoClicarNoMapa?: (lat: number, lng: number) => void;
  aoClicarOcorrencia?: (ocorrenciaId: number) => void;
  posicaoInicial?: [number, number];
}

const LIMITES_SUPER_EXPANDIDOS: L.LatLngBoundsExpression = [
  [-55.0, -110.0],
  [20.0, -10.0]
];

interface ClimaAtual {
  temperatura: number;
  umidade: number;
}

type StatusPermissaoLocalizacao = 'perguntando' | 'solicitando' | 'concedida' | 'negada';

function CartaoPermissaoLocalizacao(props: { aoPermitir: () => void; aoRecusar: () => void; solicitando: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(function () {
    if (ref.current) {
      L.DomEvent.disableClickPropagation(ref.current);
      L.DomEvent.disableScrollPropagation(ref.current);
    }
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1200,
        maxWidth: 380,
        width: 'calc(100% - 40px)',
        backgroundColor: CORES.verdeGarrafaProfundo,
        color: CORES.eggshell,
        borderRadius: 16,
        padding: '16px 18px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        fontFamily: "'Inter', system-ui, sans-serif",
        border: `1px solid ${CORES.verdeSalada}33`,
      }}
    >
      <FiMapPin size={22} aria-hidden="true" style={{ flexShrink: 0, marginTop: 3 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Usar sua localização atual?</div>
        <p style={{ fontSize: 12.5, opacity: 0.8, margin: 0, marginBottom: 12, lineHeight: 1.4 }}>
          O DangerMap centraliza o mapa perto de você e mostra o clima do local. Sua posição não é
          compartilhada com outros usuários.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={props.aoPermitir}
            disabled={props.solicitando}
            style={{
              padding: '8px 16px',
              borderRadius: 20,
              border: 'none',
              backgroundColor: CORES.laranja,
              color: CORES.eggshell,
              fontWeight: 700,
              fontSize: 12.5,
              cursor: props.solicitando ? 'default' : 'pointer',
              opacity: props.solicitando ? 0.7 : 1,
            }}
          >
            {props.solicitando ? 'Solicitando…' : 'Permitir localização'}
          </button>
          <button
            onClick={props.aoRecusar}
            style={{
              padding: '8px 14px',
              borderRadius: 20,
              border: `1px solid ${CORES.eggshell}55`,
              backgroundColor: 'transparent',
              color: CORES.eggshell,
              fontWeight: 600,
              fontSize: 12.5,
              cursor: 'pointer',
            }}
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}

function CapsulaCoordenadaClima(props: { lat: number; lng: number; clima: ClimaAtual | null; carregando: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(function () {
    if (ref.current) {
      L.DomEvent.disableClickPropagation(ref.current);
      L.DomEvent.disableScrollPropagation(ref.current);
    }
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: 20,
        left: 20,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        borderRadius: 999,
        backgroundColor: `${CORES.verdeGarrafa}e6`,
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
        color: CORES.eggshell,
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 12.5,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <FiMapPin size={13} aria-hidden="true" />
        {props.lat.toFixed(4)}, {props.lng.toFixed(4)}
      </span>

      <span style={{ width: 1, height: 14, backgroundColor: `${CORES.eggshell}33` }} />

      {props.carregando ? (
        <span style={{ opacity: 0.75 }}>Carregando clima…</span>
      ) : props.clima ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <FiThermometer size={13} aria-hidden="true" />
            {props.clima.temperatura}°C
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <FiDroplet size={13} aria-hidden="true" />
            {props.clima.umidade}%
          </span>
        </span>
      ) : (
        <span style={{ opacity: 0.6 }}>Clima indisponível</span>
      )}
    </div>
  );
}

function LocalizadorUsuario() {
  const mapa = useMap();
  const [status, setStatus] = useState<StatusPermissaoLocalizacao>('perguntando');
  const [posicaoAtual, setPosicaoAtual] = useState<[number, number] | null>(null);
  const [clima, setClima] = useState<ClimaAtual | null>(null);
  const [carregandoClima, setCarregandoClima] = useState(false);

  useEffect(function () {
    if (!('geolocation' in navigator)) {
      setStatus('negada');
    }
  }, []);

  function buscarClima(lat: number, lng: number) {
    setCarregandoClima(true);
    fetch(`/api/clima?lat=${lat}&lng=${lng}`)
      .then(function (res) {
        return res.json();
      })
      .then(function (dados) {
        if (dados && typeof dados.temperatura === 'number') {
          setClima({ temperatura: Math.round(dados.temperatura), umidade: dados.umidade ?? 0 });
        }
      })
      .catch(function (erro) {
        console.error('[ERRO AO BUSCAR CLIMA]:', erro);
      })
      .finally(function () {
        setCarregandoClima(false);
      });
  }

  function solicitarLocalizacao() {
    setStatus('solicitando');
    navigator.geolocation.getCurrentPosition(
      function (posicao) {
        const lat = posicao.coords.latitude;
        const lng = posicao.coords.longitude;
        setStatus('concedida');
        setPosicaoAtual([lat, lng]);
        mapa.flyTo([lat, lng], 14, { animate: true });
        buscarClima(lat, lng);
      },
      function (erro) {
        console.warn('[GEOLOCALIZAÇÃO]: Permissão negada ou indisponível.', erro);
        setStatus('negada');
      }
    );
  }

  function recusarLocalizacao() {
    setStatus('negada');
  }

  return (
    <>
      {status === 'perguntando' && (
        <CartaoPermissaoLocalizacao
          aoPermitir={solicitarLocalizacao}
          aoRecusar={recusarLocalizacao}
          solicitando={false}
        />
      )}
      {status === 'solicitando' && (
        <CartaoPermissaoLocalizacao aoPermitir={solicitarLocalizacao} aoRecusar={recusarLocalizacao} solicitando={true} />
      )}

      {status === 'concedida' && posicaoAtual && (
        <>
          <Marker position={posicaoAtual} icon={iconePosicaoUsuario} interactive={false} />
          <CapsulaCoordenadaClima
            lat={posicaoAtual[0]}
            lng={posicaoAtual[1]}
            clima={clima}
            carregando={carregandoClima}
          />
        </>
      )}
    </>
  );
}

function EscutadorDeCliques(props: { aoClicar?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: function(evento) {
      if (props.aoClicar) {
        props.aoClicar(evento.latlng.lat, evento.latlng.lng);
      }
    }
  });
  return null;
}

export function Mapa(props: MapaProps) {
  const centroPadrao: [number, number] = props.posicaoInicial || [-28.6775, -49.3703];

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#0f172a' }}>
      <MapContainer
        center={centroPadrao}
        zoom={5}
        minZoom={3}
        maxBounds={LIMITES_SUPER_EXPANDIDOS}
        maxBoundsViscosity={0.2}
        style={{ height: '100%', width: '100%', backgroundColor: '#0f172a' }}
      >
        <LocalizadorUsuario />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          noWrap={true}
        />

        <EscutadorDeCliques aoClicar={props.aoClicarNoMapa} />

        {props.clusters && props.clusters.map(function (cluster, indice) {
          if (cluster.quantidade === 1 && cluster.ocorrencia) {
            const ocorrencia = cluster.ocorrencia;
            return (
              <Marker
                key={`oc-${ocorrencia.id}`}
                position={[cluster.latitude, cluster.longitude]}
                icon={iconeOcorrencia(ocorrencia.gravidade, ocorrencia.categorias?.nome)}
                eventHandlers={{
                  click: function () {
                    if (props.aoClicarOcorrencia) props.aoClicarOcorrencia(ocorrencia.id);
                  },
                }}
              />
            );
          }

          return (
            <Marker
              key={`cluster-${indice}-${cluster.latitude}-${cluster.longitude}`}
              position={[cluster.latitude, cluster.longitude]}
              icon={iconeCluster(cluster.quantidade, cluster.gravidadeMaisAlta)}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
