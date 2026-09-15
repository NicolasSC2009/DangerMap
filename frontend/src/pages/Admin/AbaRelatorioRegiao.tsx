import React, { useState } from 'react';
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

export function AbaRelatorioRegiao() {
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [raio, setRaio] = useState('5000');
  const [resultados, setResultados] = useState<ResultadoRegiao[] | null>(null);
  const [buscando, setBuscando] = useState(false);

  function usarMinhaLocalizacao() {
    navigator.geolocation?.getCurrentPosition(
      (posicao) => {
        setLat(String(posicao.coords.latitude));
        setLng(String(posicao.coords.longitude));
      },
      () => toast.info('Não foi possível obter sua localização.')
    );
  }

  async function buscar() {
    if (!lat || !lng) {
      toast.warn('Informe latitude e longitude.');
      return;
    }
    setBuscando(true);
    try {
      const resposta = await api.get<ResultadoRegiao[]>('/admin/relatorio-regiao', { params: { lat, lng, raio } });
      setResultados(resposta.data);
    } catch {
      toast.error('Não foi possível gerar o relatório agora.');
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div>
      <div style={s.topbar}>
        <div>
          <span style={s.eyebrow}>Relatórios</span>
          <h1 style={s.titulo}>Extração por região</h1>
          <p style={s.subtitulo}>Consulta espacial via PostGIS (ST_DWithin), retornando ocorrências dentro de um raio a partir de uma coordenada.</p>
        </div>
      </div>

      <div style={{ ...s.painel, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={s.rotuloCampo}>Latitude</label>
            <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-27.5954" style={s.campo} />
          </div>
          <div>
            <label style={s.rotuloCampo}>Longitude</label>
            <input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="-48.5480" style={s.campo} />
          </div>
          <div>
            <label style={s.rotuloCampo}>Raio (metros)</label>
            <input value={raio} onChange={(e) => setRaio(e.target.value)} placeholder="5000" style={s.campo} />
          </div>
          <button onClick={buscar} disabled={buscando} style={{ ...s.btnPrimario, height: 44 }}>
            {buscando ? 'Buscando…' : 'Buscar'}
          </button>
        </div>
        <button onClick={usarMinhaLocalizacao} style={{ marginTop: 12, background: 'none', border: 'none', color: CORES.laranjaEscuro, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiMapPin size={13} aria-hidden="true" /> Usar minha localização atual
        </button>
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
