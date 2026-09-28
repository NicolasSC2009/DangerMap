// Preferências do usuário que ficam só no navegador (localStorage) e são
// aplicadas como atributos em <html>: data-tema, data-fonte, data-animacoes.

export type Tema = 'claro' | 'escuro' | 'sistema';
export type TamanhoFonte = 'normal' | 'grande';
export type EstiloMapa = 'padrao' | 'claro' | 'escuro' | 'auto'; // OSM | Carto Voyager | Carto Dark | segue tema
export type EstiloMapaResolvido = 'padrao' | 'claro' | 'escuro';

export interface Preferencias {
  tema: Tema;
  tamanhoFonte: TamanhoFonte;
  reduzirAnimacoes: boolean;
  estiloMapa: EstiloMapa;
  mostrarClima: boolean;
  lembrarPosicaoMapa: boolean;
}

export const PREFERENCIAS_PADRAO: Preferencias = {
  tema: 'sistema',
  tamanhoFonte: 'normal',
  reduzirAnimacoes: false,
  estiloMapa: 'auto',
  mostrarClima: true,
  lembrarPosicaoMapa: true,
};

export const CHAVE_PREFERENCIAS = '@DangerMap:preferencias';
// Chave usada pelo mapa (P1) para lembrar a última vista {lat,lng,zoom}.
export const CHAVE_ULTIMA_VISTA_MAPA = '@DangerMap:mapa:ultimaVista';

const TEMAS: Tema[] = ['claro', 'escuro', 'sistema'];
const FONTES: TamanhoFonte[] = ['normal', 'grande'];
const ESTILOS: EstiloMapa[] = ['padrao', 'claro', 'escuro', 'auto'];

function normalizar(bruto: unknown): Preferencias {
  const p = (bruto && typeof bruto === 'object' ? bruto : {}) as Partial<Record<keyof Preferencias, unknown>>;
  const d = PREFERENCIAS_PADRAO;
  return {
    tema: TEMAS.includes(p.tema as Tema) ? (p.tema as Tema) : d.tema,
    tamanhoFonte: FONTES.includes(p.tamanhoFonte as TamanhoFonte) ? (p.tamanhoFonte as TamanhoFonte) : d.tamanhoFonte,
    reduzirAnimacoes: typeof p.reduzirAnimacoes === 'boolean' ? p.reduzirAnimacoes : d.reduzirAnimacoes,
    estiloMapa: ESTILOS.includes(p.estiloMapa as EstiloMapa) ? (p.estiloMapa as EstiloMapa) : d.estiloMapa,
    mostrarClima: typeof p.mostrarClima === 'boolean' ? p.mostrarClima : d.mostrarClima,
    lembrarPosicaoMapa: typeof p.lembrarPosicaoMapa === 'boolean' ? p.lembrarPosicaoMapa : d.lembrarPosicaoMapa,
  };
}

export function lerPreferencias(): Preferencias {
  try {
    const salvo = localStorage.getItem(CHAVE_PREFERENCIAS);
    return normalizar(salvo ? JSON.parse(salvo) : null);
  } catch {
    return { ...PREFERENCIAS_PADRAO };
  }
}

export function salvarPreferencias(p: Preferencias): void {
  try {
    localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify(p));
  } catch {
    // localStorage indisponível (modo privado, cota) — preferências valem só nesta sessão.
  }
}

export function sistemaPrefereEscuro(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

// 'sistema' resolvido para o tema efetivo.
export function resolverTema(p: Preferencias): 'claro' | 'escuro' {
  if (p.tema === 'sistema') return sistemaPrefereEscuro() ? 'escuro' : 'claro';
  return p.tema;
}

export function aplicarPreferenciasNoDocumento(p: Preferencias): void {
  if (typeof document === 'undefined') return;
  const raiz = document.documentElement;
  const tema = resolverTema(p);
  raiz.dataset.tema = tema;
  raiz.dataset.fonte = p.tamanhoFonte;
  if (p.reduzirAnimacoes) raiz.dataset.animacoes = 'reduzidas';
  else delete raiz.dataset.animacoes;

  const metaTema = document.querySelector('meta[name="theme-color"]');
  if (metaTema) metaTema.setAttribute('content', tema === 'escuro' ? '#0f1512' : '#003223');
}

const ATRIBUICAO_OSM = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const ATRIBUICAO_CARTO = `${ATRIBUICAO_OSM} &copy; <a href="https://carto.com/attributions">CARTO</a>`;

export const TILES: Record<EstiloMapaResolvido, { url: string; attribution: string }> = {
  padrao: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: ATRIBUICAO_OSM,
  },
  claro: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: ATRIBUICAO_CARTO,
  },
  escuro: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: ATRIBUICAO_CARTO,
  },
};

// 'auto' segue o tema efetivo: escuro → Carto Dark; claro → OSM padrão.
export function resolverEstiloMapa(p: Preferencias): EstiloMapaResolvido {
  if (p.estiloMapa !== 'auto') return p.estiloMapa;
  return resolverTema(p) === 'escuro' ? 'escuro' : 'padrao';
}
