import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'react-toastify';
import { FiMapPin } from 'react-icons/fi';
import { CORES } from '../../theme/cores';
import { api } from '../../services/api';
import { estilosAdmin as s } from './estilosAdmin';

interface ResultadoRegiao {
  id: number;
  descricao: string | null;
  latitude: string;
  longitude: string;
  gravidade: string;
  status: string;
  data_registro: string;
  distancia_metros: string;
}

const CENTRO_PADRAO: [number, number] = [-14.235, -51.9253];

const iconePonto = L.divIcon({
  className: 'dm-marcador-relatorio',
  html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:${CORES.laranjaEscuro};transform:rotate(-45deg);border:2.5px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,0.45);"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

function EscutadorDeCliques(props: { aoClicar: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(evento) {
      props.aoClicar(evento.latlng.lat, evento.latlng.lng);
    },
  });
  return null;
}

export function AbaRelatorioRegiao() {
  const [ponto, setPonto] = useState<{ lat: number; lng: number } | null>(null);
  const [raio, setRaio] = useState('5000');
  const [resultados, setResultados] = useState<ResultadoRegiao[] | null>(null);
  const [buscando, setBuscando] = useState(false);

  function usarMinhaLocalizacao() {
    navigator.geolocation?.getCurrentPosition(
      (posicao) => setPonto({ lat: posicao.coords.latitude, lng: posicao.coords.longitude }),
      () => toast.info('Não foi possível obter sua localização.')
    );
  }

  async function buscar() {
    if (!ponto) {
      toast.warn('Clique no mapa para escolher o centro da busca.');
      return;
    }
    setBuscando(true);
    try {
      const resposta = await api.get<ResultadoRegiao[]>('/admin/relatorio-regiao', {
        params: { lat: ponto.lat, lng: ponto.lng, raio },
      });
      setResultados(resposta.data);
    } catch {
      toast.error('Não foi possível gerar o relatório agora.');
    } finally {
      setBuscando(false);
    }
  }

  const raioMetros = Number(raio) || 0;

  return (
    <div>
      <div style={s.topbar}>
        <div>
          <span style={s.eyebrow}>Relatórios</span>
          <h1 style={s.titulo}>Extração por região</h1>
          <p style={s.subtitulo}>Clique no mapa para escolher o centro da área e ajuste o raio para gerar o relatório.</p>
        </div>
      </div>

      <div style={{ ...s.painel, marginBottom: 16, padding: 0, overflow: 'hidden' }}>
        <div style={{ height: 380, position: 'relative' }}>
          <MapContainer center={CENTRO_PADRAO} zoom={4} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <EscutadorDeCliques aoClicar={(lat, lng) => setPonto({ lat, lng })} />
            {ponto && (
              <>
                <Marker position={[ponto.lat, ponto.lng]} icon={iconePonto} />
                {raioMetros > 0 && <Circle center={[ponto.lat, ponto.lng]} radius={raioMetros} pathOptions={{ color: CORES.laranjaEscuro, fillColor: CORES.laranja, fillOpacity: 0.12, weight: 1.5 }} />}
              </>
            )}
          </MapContainer>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, padding: 16, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12.5, color: CORES.tintaSuave, flex: 1, minWidth: 200 }}>
            {ponto ? (
              <>Centro selecionado: <strong style={{ color: CORES.verdeGarrafa }}>{ponto.lat.toFixed(5)}, {ponto.lng.toFixed(5)}</strong></>
            ) : (
              'Clique em qualquer ponto do mapa para escolher o centro da busca.'
            )}
          </div>
          <div>
            <label style={s.rotuloCampo}>Raio (metros)</label>
            <input value={raio} onChange={(e) => setRaio(e.target.value)} placeholder="5000" style={{ ...s.campo, width: 120 }} />
          </div>
          <button onClick={usarMinhaLocalizacao} style={{ background: 'none', border: 'none', color: CORES.laranjaEscuro, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '11px 4px' }}>
            <FiMapPin size={13} aria-hidden="true" /> Minha localização
          </button>
          <button onClick={buscar} disabled={buscando || !ponto} className="dm-botao-primario dm-botao-seta" style={{ ...s.btnPrimario, height: 44, opacity: !ponto ? 0.5 : 1 }}>
            <span>{buscando ? 'Buscando…' : 'Buscar'}</span>
          </button>
        </div>
      </div>

      {resultados && (
        <div style={s.painel}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <strong style={{ fontSize: 14, color: CORES.verdeGarrafa }}>{resultados.length} ocorrência(s) encontrada(s)</strong>
          </div>
          {resultados.length === 0 ? (
            <p style={{ fontSize: 13.5, color: CORES.tintaSuave }}>Nenhuma ocorrência dentro do raio informado.</p>
          ) : (
            <table style={s.tabela}>
              <thead>
                <tr>
                  <th style={s.th}>Descrição</th>
                  <th style={s.th}>Gravidade</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Distância</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((r) => (
                  <tr key={r.id}>
                    <td style={s.td}>{r.descricao || <em style={{ color: CORES.tintaSuave }}>sem descrição</em>}</td>
                    <td style={{ ...s.td, textTransform: 'capitalize' }}>{r.gravidade}</td>
                    <td style={s.td}>{r.status}</td>
                    <td style={s.td}>{Number(r.distancia_metros).toLocaleString('pt-BR')} m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
