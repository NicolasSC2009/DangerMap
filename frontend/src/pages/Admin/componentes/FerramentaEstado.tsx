import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'react-toastify';
import { api } from '../../../services/api';
import { TILES } from '../../../theme/preferencias';
import { usePreferencias } from '../../../contexts/PreferenciasContext';
import { COR_GRAVIDADE, ROTULO_GRAVIDADE } from '../../../theme/rotulos';
import { ESTADOS_BRASIL } from '../../../theme/estadosBrasil';
import type { RespostaRelatorioEstado, GeometriaGeoJSON } from '@shared/types';
import type { PontoResultado } from './FerramentaRaio';

const CENTRO_BRASIL: [number, number] = [-14.235, -51.9253];
const ESTILO_FRONTEIRA = { color: '#FF6400', weight: 2, fillColor: '#FF6400', fillOpacity: 0.06 };

/* ---------------------------------------------------------------------------
   Busca no backend (GET /admin/relatorio-estado) com cache simples por UF —
   a fronteira e a lista de ocorrências mudam pouco entre trocas de aba.
   ------------------------------------------------------------------------ */

export function useBuscaEstado(uf: string | null) {
  const [dados, setDados] = useState<RespostaRelatorioEstado | null>(null);
  const [buscando, setBuscando] = useState(false);
  const idRequisicao = useRef(0);
  const [versao, setVersao] = useState(0);

  useEffect(
    function () {
      if (!uf) {
        setDados(null);
        return;
      }
      const id = ++idRequisicao.current;
      setBuscando(true);
      setDados(null);
      api
        .get<RespostaRelatorioEstado>('/admin/relatorio-estado', { params: { uf } })
        .then(function (r) {
          if (id !== idRequisicao.current) return;
          setDados(r.data);
        })
        .catch(function () {
          if (id !== idRequisicao.current) return;
          toast.error('Não foi possível gerar o relatório desse estado agora.', { toastId: 'erro-relatorio-estado' });
        })
        .finally(function () {
          if (id === idRequisicao.current) setBuscando(false);
        });
    },
    [uf, versao]
  );

  return { dados, buscando, recarregar: () => setVersao((v) => v + 1) };
}

function AjustarVistaPoligono(props: { poligono: GeometriaGeoJSON | null }) {
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
      if (!props.poligono) return;
      const camada = L.geoJSON(props.poligono as GeoJSON.GeoJsonObject);
      const limites = camada.getBounds();
      if (limites.isValid()) mapa.fitBounds(limites, { padding: [24, 24], animate: true });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.poligono]
  );

  return null;
}

interface FerramentaEstadoProps {
  uf: string | null;
  aoMudarUf: (uf: string) => void;
  poligono: GeometriaGeoJSON | null;
  pontos?: PontoResultado[];
  aoClicarPonto?: (id: number) => void;
  children?: React.ReactNode;
}

export function FerramentaEstado(props: FerramentaEstadoProps) {
  const { estiloMapaEfetivo } = usePreferencias();
  const tiles = TILES[estiloMapaEfetivo];

  function estilizarFronteira() {
    return ESTILO_FRONTEIRA;
  }

  return (
    <div className="dm-admin-raio">
      <div className="dm-admin-raio__mapa dm-admin-nao-imprimir">
        <MapContainer center={CENTRO_BRASIL} zoom={4} scrollWheelZoom className="dm-admin-raio__leaflet">
          <TileLayer key={estiloMapaEfetivo} url={tiles.url} attribution={tiles.attribution} />
          <AjustarVistaPoligono poligono={props.poligono} />

          {props.poligono && (
            <GeoJSON
              key={props.uf ?? 'sem-uf'}
              data={props.poligono as GeoJSON.GeoJsonObject}
              style={estilizarFronteira}
              interactive={false}
            />
          )}

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
        </MapContainer>
        <span className="dm-admin-raio__dica">{props.uf ? 'Arraste ou dê zoom para explorar' : 'Escolha um estado ao lado'}</span>
      </div>

      <div className="dm-admin-raio__lado">
        <div className="dm-campo-grupo dm-admin-nao-imprimir">
          <label className="dm-rotulo" htmlFor="dm-admin-estado-select">
            Estado
          </label>
          <select
            id="dm-admin-estado-select"
            className="dm-campo"
            value={props.uf ?? ''}
            onChange={(e) => e.target.value && props.aoMudarUf(e.target.value)}
          >
            <option value="" disabled>
              Selecione um estado
            </option>
            {ESTADOS_BRASIL.map((e) => (
              <option key={e.uf} value={e.uf}>
                {e.nome} ({e.uf})
              </option>
            ))}
          </select>
        </div>

        {props.children}
      </div>
    </div>
  );
}
