import type { Gravidade } from '@shared/types';

// Filtros do mapa (gravidade e categoria), guardados no aparelho pra voltarem como estavam.
export interface FiltrosMapa {
  gravidades: Gravidade[];
  categorias: number[];
}

export const FILTROS_VAZIOS: FiltrosMapa = { gravidades: [], categorias: [] };

const CHAVE_FILTROS = '@DangerMap:mapa:filtros';
export const GRAVIDADES: Gravidade[] = ['alto', 'medio', 'baixo'];

export function lerFiltrosSalvos(): FiltrosMapa {
  try {
    const bruto = localStorage.getItem(CHAVE_FILTROS);
    if (!bruto) return FILTROS_VAZIOS;
    const f = JSON.parse(bruto);
    return {
      gravidades: Array.isArray(f?.gravidades) ? f.gravidades.filter((g: unknown) => GRAVIDADES.includes(g as Gravidade)) : [],
      categorias: Array.isArray(f?.categorias) ? f.categorias.filter((c: unknown) => typeof c === 'number') : [],
    };
  } catch {
    return FILTROS_VAZIOS;
  }
}

export function salvarFiltros(filtros: FiltrosMapa) {
  try {
    localStorage.setItem(CHAVE_FILTROS, JSON.stringify(filtros));
  } catch {
    // ignora (modo privado / cota)
  }
}

export function quantidadeFiltrosAtivos(f: FiltrosMapa): number {
  return f.gravidades.length + f.categorias.length;
}
