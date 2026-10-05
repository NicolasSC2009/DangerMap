// Regras de exibição das ocorrências no mapa conforme o zoom (no estilo do
// Waze/Google Maps) e o agrupamento feito no navegador, em pixels da tela:
//
//   zoom < ZOOM_PONTOS    → nada (longe demais, só poluiria)
//   ZOOM_PONTOS … 12      → bolinhas amarelas; as muito próximas viram uma só
//   ZOOM_ICONES … 16      → ícones das categorias; próximos viram um balão com número
//   zoom ≥ ZOOM_ESPALHAR  → nunca junta; ocorrências sobrepostas abrem em leque
//
// Agrupar por pixel (e não por metro) faz o resultado ficar igual em qualquer
// tela e dispensa buscar de novo no servidor a cada mudança de zoom.

import type { Gravidade, Ocorrencia } from '@shared/types';

export const ZOOM_PONTOS = 9;
export const ZOOM_ICONES = 13;
export const ZOOM_ESPALHAR = 17;
export const ZOOM_MAXIMO = 19;

export type NivelMapa = 'oculto' | 'pontos' | 'icones';

export function nivelPorZoom(zoom: number): NivelMapa {
  if (zoom < ZOOM_PONTOS) return 'oculto';
  if (zoom < ZOOM_ICONES) return 'pontos';
  return 'icones';
}

export interface PontoMapa {
  id: number;
  lat: number;
  lng: number;
  gravidade: Gravidade | null;
  ocorrencia: Ocorrencia;
}

export interface GrupoMapa {
  lat: number;
  lng: number;
  itens: PontoMapa[];
  gravidadeMaisAlta: Gravidade | null;
}

/** Posição de um item que foi afastado dos vizinhos (leque). */
export interface ItemEspalhado {
  item: PontoMapa;
  lat: number;
  lng: number;
  origemLat: number;
  origemLng: number;
}

const ORDEM_GRAVIDADE: Record<Gravidade, number> = { baixo: 1, medio: 2, alto: 3 };

export function pontoDaOcorrencia(o: Ocorrencia): PontoMapa | null {
  const lat = Number(o.latitude);
  const lng = Number(o.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { id: o.id, lat, lng, gravidade: o.gravidade ?? null, ocorrencia: o };
}

/** Raio (em pixels) dentro do qual duas ocorrências viram um único marcador. */
export function raioAgrupamentoPx(zoom: number): number {
  if (zoom < ZOOM_ICONES) return 30; // bolinhas
  if (zoom <= 14) return 54;
  if (zoom === 15) return 48;
  if (zoom === 16) return 42;
  return 36; // só vale pra detectar sobreposição (a partir do ZOOM_ESPALHAR)
}

type Projetar = (lat: number, lng: number) => { x: number; y: number };

/**
 * Agrupamento guloso em grade: cada ponto ainda livre abre um grupo e absorve
 * os vizinhos a menos de `raioPx`. Pontos mais graves vêm primeiro, assim o
 * grupo "nasce" no perigo mais importante.
 */
export function agruparPorPixel(pontos: PontoMapa[], raioPx: number, projetar: Projetar): GrupoMapa[] {
  const ordenados = [...pontos].sort(function (a, b) {
    const diferenca = (b.gravidade ? ORDEM_GRAVIDADE[b.gravidade] : 0) - (a.gravidade ? ORDEM_GRAVIDADE[a.gravidade] : 0);
    return diferenca !== 0 ? diferenca : a.id - b.id;
  });

  const celulas = new Map<string, number[]>();
  const posicoes = ordenados.map(function (p) {
    return projetar(p.lat, p.lng);
  });
  posicoes.forEach(function (pos, indice) {
    const chave = `${Math.floor(pos.x / raioPx)}:${Math.floor(pos.y / raioPx)}`;
    const lista = celulas.get(chave);
    if (lista) lista.push(indice);
    else celulas.set(chave, [indice]);
  });

  const usado = new Array<boolean>(ordenados.length).fill(false);
  const grupos: GrupoMapa[] = [];

  for (let i = 0; i < ordenados.length; i++) {
    if (usado[i]) continue;
    usado[i] = true;
    const membros: PontoMapa[] = [ordenados[i]];
    const base = posicoes[i];
    const cx = Math.floor(base.x / raioPx);
    const cy = Math.floor(base.y / raioPx);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const vizinhos = celulas.get(`${cx + dx}:${cy + dy}`);
        if (!vizinhos) continue;
        for (const j of vizinhos) {
          if (usado[j]) continue;
          if (Math.hypot(posicoes[j].x - base.x, posicoes[j].y - base.y) <= raioPx) {
            usado[j] = true;
            membros.push(ordenados[j]);
          }
        }
      }
    }

    grupos.push(construirGrupo(membros));
  }

  return grupos;
}

function construirGrupo(membros: PontoMapa[]): GrupoMapa {
  let somaLat = 0;
  let somaLng = 0;
  let maisAlta: Gravidade | null = null;
  for (const m of membros) {
    somaLat += m.lat;
    somaLng += m.lng;
    if (m.gravidade && (!maisAlta || ORDEM_GRAVIDADE[m.gravidade] > ORDEM_GRAVIDADE[maisAlta])) {
      maisAlta = m.gravidade;
    }
  }
  return {
    lat: somaLat / membros.length,
    lng: somaLng / membros.length,
    itens: membros,
    gravidadeMaisAlta: maisAlta,
  };
}

/**
 * Abre um grupo em leque (círculo) em volta do centro, em pixels. Usado no zoom
 * máximo, onde juntar não resolve — ocorrências no mesmo lugar continuam todas
 * clicáveis.
 */
export function espalharEmLeque(
  grupo: GrupoMapa,
  projetar: Projetar,
  desprojetar: (x: number, y: number) => { lat: number; lng: number }
): ItemEspalhado[] {
  const centro = projetar(grupo.lat, grupo.lng);
  const n = grupo.itens.length;
  const raio = Math.max(46, 16 + n * 8);
  // Dois itens ficam lado a lado (os ícones são mais altos que largos); com mais,
  // o primeiro fica em cima e os outros seguem no sentido horário.
  const inicio = n === 2 ? Math.PI : -Math.PI / 2;
  return grupo.itens.map(function (item, indice) {
    const angulo = inicio + (indice * 2 * Math.PI) / n;
    const ponto = desprojetar(centro.x + Math.cos(angulo) * raio, centro.y + Math.sin(angulo) * raio);
    return { item, lat: ponto.lat, lng: ponto.lng, origemLat: grupo.lat, origemLng: grupo.lng };
  });
}
