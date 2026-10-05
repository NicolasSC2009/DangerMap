import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CircleMarker, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { FiZoomIn } from 'react-icons/fi';
import { CORES } from '../../theme/cores';
import { COR_GRAVIDADE } from '../../theme/rotulos';
import { obterIconeCategoria } from '../../theme/iconesCategorias';
import type { TamanhoMarcadores } from '../../theme/preferencias';
import type { Gravidade, Ocorrencia } from '@shared/types';
import {
  ZOOM_ESPALHAR,
  ZOOM_ICONES,
  ZOOM_MAXIMO,
  ZOOM_PONTOS,
  agruparPorPixel,
  espalharEmLeque,
  nivelPorZoom,
  pontoDaOcorrencia,
  raioAgrupamentoPx,
  type GrupoMapa,
  type PontoMapa,
} from './agrupamento';

const COR_PONTO = '#F5B800'; // amarelo das bolinhas de média distância (como no Waze)

const MULTIPLICADOR: Record<TamanhoMarcadores, number> = { pequeno: 0.82, normal: 1, grande: 1.22 };

// Tamanho do ícone da ocorrência (1 = 56×58 px) em cada zoom.
function fatorPin(zoom: number): number {
  const tabela: Record<number, number> = { 13: 0.58, 14: 0.7, 15: 0.82, 16: 0.94, 17: 1.04, 18: 1.12, 19: 1.2 };
  return tabela[Math.min(ZOOM_MAXIMO, Math.max(ZOOM_ICONES, Math.round(zoom)))];
}

// Diâmetro da bolinha amarela em cada zoom.
function diametroPonto(zoom: number): number {
  const tabela: Record<number, number> = { 9: 9, 10: 11, 11: 13, 12: 15 };
  return tabela[Math.min(ZOOM_ICONES - 1, Math.max(ZOOM_PONTOS, Math.round(zoom)))];
}

// divIcon novo a cada render faz o Leaflet recriar o marcador (piscando): guarda por chave.
const cacheIcones = new Map<string, L.DivIcon>();
function iconeEmCache(chave: string, criar: () => L.DivIcon): L.DivIcon {
  let icone = cacheIcones.get(chave);
  if (!icone) {
    if (cacheIcones.size > 400) cacheIcones.clear();
    icone = criar();
    cacheIcones.set(chave, icone);
  }
  return icone;
}

function iconePonto(quantidade: number, zoom: number, mult: number): L.DivIcon {
  const base = Math.round(diametroPonto(zoom) * mult);
  const diametro = quantidade > 1 ? base + 9 : base;
  const mostrarNumero = quantidade > 1;
  return iconeEmCache(`ponto|${quantidade}|${diametro}`, function () {
    return L.divIcon({
      className: 'dm-marcador-ponto',
      html: `<div class="dm-marcador-ponto__corpo" style="width:${diametro}px;height:${diametro}px;background:${COR_PONTO};font-size:${Math.max(
        9,
        Math.round(diametro * 0.5)
      )}px;">${mostrarNumero ? quantidade : ''}</div>`,
      iconSize: [diametro, diametro],
      iconAnchor: [diametro / 2, diametro / 2],
    });
  });
}

function iconePin(gravidade: Gravidade | null, nomeCategoria: string | undefined, zoom: number, mult: number): L.DivIcon {
  const fator = fatorPin(zoom) * mult;
  const largura = Math.round(56 * fator);
  const altura = Math.round(58 * fator);
  const badge = Math.max(9, Math.round(15 * fator));
  const cor = (gravidade && COR_GRAVIDADE[gravidade]) || CORES.laranja;
  const icone = obterIconeCategoria(nomeCategoria);
  return iconeEmCache(`pin|${cor}|${icone}|${largura}`, function () {
    return L.divIcon({
      className: 'dm-marcador-ocorrencia',
      html: `
        <div class="dm-marcador-ocorrencia__corpo" style="width:${largura}px;height:${altura}px;">
          <img src="${icone}" alt="" />
          <span class="dm-marcador-ocorrencia__badge" style="width:${badge}px;height:${badge}px;background:${cor};"></span>
        </div>`,
      iconSize: [largura, altura],
      iconAnchor: [largura / 2, Math.round(altura * 0.95)],
    });
  });
}

function iconeBalao(quantidade: number, gravidade: Gravidade | null, zoom: number, mult: number): L.DivIcon {
  const cor = (gravidade && COR_GRAVIDADE[gravidade]) || CORES.verdeGarrafa;
  const tamanho = Math.round((34 + Math.min(quantidade, 40) * 0.3) * (zoom >= 15 ? 1.08 : 1) * mult);
  const fonte = Math.max(11, Math.round(tamanho * 0.38));
  return iconeEmCache(`balao|${cor}|${quantidade}|${tamanho}`, function () {
    return L.divIcon({
      className: 'dm-marcador-cluster',
      html: `<div class="dm-marcador-cluster__corpo" style="width:${tamanho}px;height:${tamanho}px;background:${cor};font-size:${fonte}px;">${quantidade}</div>`,
      iconSize: [tamanho, tamanho],
      iconAnchor: [tamanho / 2, tamanho / 2],
    });
  });
}

interface CamadaProps {
  ocorrencias?: Ocorrencia[];
  agrupar: boolean;
  tamanho: TamanhoMarcadores;
  aoClicarOcorrencia?: (ocorrenciaId: number) => void;
  aoMudarZoom?: (zoom: number) => void;
}

// Aviso para quando o zoom está longe demais: nenhuma ocorrência é desenhada.
function DicaAproximar(props: { aoAproximar: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(function () {
    if (ref.current) L.DomEvent.disableClickPropagation(ref.current);
  }, []);
  return (
    <button ref={ref} type="button" className="dm-mapa-dica" onClick={props.aoAproximar}>
      <FiZoomIn size={15} aria-hidden="true" />
      <span>Aproxime o mapa para ver as ocorrências</span>
    </button>
  );
}

export function CamadaOcorrencias(props: CamadaProps) {
  const mapa = useMap();
  const [zoom, setZoom] = useState(mapa.getZoom());
  // Área visível (com folga): só desenha o que está na tela.
  const [limites, setLimites] = useState(() => mapa.getBounds().pad(0.3));
  const mult = MULTIPLICADOR[props.tamanho];

  useMapEvents({
    zoomend: function () {
      const novoZoom = mapa.getZoom();
      setZoom(novoZoom);
      setLimites(mapa.getBounds().pad(0.3));
      props.aoMudarZoom?.(novoZoom);
    },
    moveend: function () {
      setLimites(mapa.getBounds().pad(0.3));
    },
  });

  useEffect(
    function () {
      props.aoMudarZoom?.(mapa.getZoom());
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const pontos = useMemo(
    function () {
      return (props.ocorrencias ?? []).map(pontoDaOcorrencia).filter((p): p is PontoMapa => p !== null);
    },
    [props.ocorrencias]
  );

  const projetar = useCallback(
    function (lat: number, lng: number) {
      return mapa.project([lat, lng], zoom);
    },
    [mapa, zoom]
  );

  const nivel = nivelPorZoom(zoom);

  const grupos = useMemo<GrupoMapa[]>(
    function () {
      if (nivel === 'oculto') return [];
      // Sem agrupar, só se junta o que está sobreposto no zoom máximo (o leque).
      if (!props.agrupar && zoom < ZOOM_ESPALHAR) {
        return pontos.map((p) => ({ lat: p.lat, lng: p.lng, itens: [p], gravidadeMaisAlta: p.gravidade }));
      }
      return agruparPorPixel(pontos, raioAgrupamentoPx(zoom), projetar);
    },
    [pontos, nivel, zoom, props.agrupar, projetar]
  );

  const visiveis = useMemo(
    function () {
      return grupos.filter((g) => limites.contains([g.lat, g.lng]));
    },
    [grupos, limites]
  );

  function aproximarDoGrupo(grupo: GrupoMapa) {
    const area = L.latLngBounds(grupo.itens.map((i) => [i.lat, i.lng] as [number, number]));
    mapa.flyToBounds(area, { padding: [70, 70], maxZoom: ZOOM_MAXIMO, duration: 0.6 });
  }

  function aoClicarPonto(grupo: GrupoMapa) {
    if (grupo.itens.length === 1) props.aoClicarOcorrencia?.(grupo.itens[0].id);
    else aproximarDoGrupo(grupo);
  }

  if (nivel === 'oculto') {
    return pontos.length > 0 ? <DicaAproximar aoAproximar={() => mapa.setZoom(ZOOM_PONTOS + 1)} /> : null;
  }

  function pinDe(ponto: PontoMapa, lat: number, lng: number) {
    const o = ponto.ocorrencia;
    return (
      <Marker
        key={`oc-${ponto.id}`}
        position={[lat, lng]}
        icon={iconePin(ponto.gravidade, o.categorias?.nome, zoom, mult)}
        title={o.categorias?.nome || 'Ocorrência'}
        zIndexOffset={ponto.gravidade === 'alto' ? 300 : ponto.gravidade === 'medio' ? 150 : 0}
        eventHandlers={{ click: () => props.aoClicarOcorrencia?.(ponto.id) }}
      />
    );
  }

  return (
    <>
      {visiveis.map(function (grupo) {
        const quantidade = grupo.itens.length;
        const primeiro = grupo.itens[0];

        // ---- longe: bolinhas amarelas ----
        if (nivel === 'pontos') {
          return (
            <Marker
              key={`pt-${primeiro.id}-${quantidade}`}
              position={[grupo.lat, grupo.lng]}
              icon={iconePonto(quantidade, zoom, mult)}
              title={quantidade > 1 ? `${quantidade} ocorrências — toque para aproximar` : 'Ocorrência'}
              eventHandlers={{ click: () => aoClicarPonto(grupo) }}
            />
          );
        }

        // ---- perto: ícones ----
        if (quantidade === 1) return pinDe(primeiro, grupo.lat, grupo.lng);

        // zoom máximo: abre em leque (nada fica preso um no outro)
        if (zoom >= ZOOM_ESPALHAR) {
          const leque = espalharEmLeque(
            grupo,
            projetar,
            (x, y) => mapa.unproject(L.point(x, y), zoom)
          );
          return (
            <Fragment key={`leque-${primeiro.id}-${quantidade}`}>
              {leque.map((l) => (
                <Polyline
                  key={`perna-${l.item.id}`}
                  positions={[
                    [l.origemLat, l.origemLng],
                    [l.lat, l.lng],
                  ]}
                  pathOptions={{ color: '#ffffff', weight: 2.5, opacity: 0.95, className: 'dm-leque-perna' }}
                  interactive={false}
                />
              ))}
              <CircleMarker
                center={[grupo.lat, grupo.lng]}
                radius={5}
                pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#222', fillOpacity: 1 }}
                interactive={false}
              />
              {leque.map((l) => pinDe(l.item, l.lat, l.lng))}
            </Fragment>
          );
        }

        return (
          <Marker
            key={`balao-${primeiro.id}-${quantidade}`}
            position={[grupo.lat, grupo.lng]}
            icon={iconeBalao(quantidade, grupo.gravidadeMaisAlta, zoom, mult)}
            title={`${quantidade} ocorrências — clique para aproximar`}
            eventHandlers={{ click: () => aproximarDoGrupo(grupo) }}
          />
        );
      })}
    </>
  );
}
