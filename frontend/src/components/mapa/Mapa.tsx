import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface OcorrenciaMapa {
  id: number;
  latitude: number;
  longitude: number;
  titulo?: string;
  categoriaNome?: string;
}

interface MapaProps {
  ocorrencias?: OcorrenciaMapa[];
  aoClicarNoMapa?: (lat: number, lng: number) => void;
  posicaoInicial?: [number, number];
}

// Margem ampliada cobrindo toda a América do Sul e oceanos
const LIMITES_SUPER_EXPANDIDOS: L.LatLngBoundsExpression = [
  [-55.0, -110.0], // Sudoeste bem amplo (Oceano Pacífico / Sul do continente)
  [20.0, -10.0]    // Nordeste bem amplo (Caribe / Oceano Atlântico)
];

function LocalizadorUsuario() {
  const mapa = useMap();

  useEffect(function() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        function(posicao) {
          const lat = posicao.coords.latitude;
          const lng = posicao.coords.longitude;
          mapa.flyTo([lat, lng], 14, { animate: true });
        },
        function(erro) {
          console.warn('[GEOLOCALIZAÇÃO]: Permissão negada ou indisponível.', erro);
        }
      );
    }
  }, [mapa]);

  return null;
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

        {props.ocorrencias && props.ocorrencias.map(function(item) {
          return (
            <Marker key={item.id} position={[item.latitude, item.longitude]}>
              <Popup>
                <div>
                  <strong>{item.categoriaNome || 'Ocorrência'}</strong>
                  <p>{item.titulo || 'Perigo reportado'}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}