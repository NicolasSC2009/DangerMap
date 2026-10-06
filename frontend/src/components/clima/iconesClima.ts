// Ilustrações chapadas do clima, na paleta do DangerMap. Cada função devolve o
// miolo de um <svg viewBox="0 0 160 120">; use com dangerouslySetInnerHTML
// (o conteúdo é todo gerado aqui, não vem de fora).
import type { TipoClima } from './clima';

const ESC = '#F5EBE1';
const ESC2 = '#D6CAB8';
const ORG = '#FF6400';
const SAL = '#8CC850';
let uid = 0;

const NUVEM = 'M36 98A20 20 0 0 1 36 58A26 26 0 0 1 72 40A30 30 0 0 1 116 56A21 21 0 0 1 116 98Z';

function nuvem(x: number, y: number, escala: number, cor: string, sombra: string): string {
  const id = 'dm-nuvem-' + uid++;
  return (
    `<g transform="translate(${x} ${y}) scale(${escala})"><clipPath id="${id}"><path d="${NUVEM}"/></clipPath>` +
    `<path d="${NUVEM}" fill="${cor}"/><rect x="0" y="82" width="160" height="30" fill="${sombra}" clip-path="url(#${id})"/></g>`
  );
}

function traco(d: string, cor: string, largura = 5): string {
  return `<path d="${d}" fill="none" stroke="${cor}" stroke-width="${largura}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function sol(cx: number, cy: number, r: number): string {
  let raios = '';
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const c = Math.cos(a);
    const k = Math.sin(a);
    raios += traco(`M${cx + (r + 9) * c} ${cy + (r + 9) * k}L${cx + (r + 18) * c} ${cy + (r + 18) * k}`, ORG);
  }
  return raios + `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${ORG}"/>`;
}

function gota(x: number, y: number): string {
  return `<path transform="translate(${x} ${y})" d="M0-11C8-1 9 7 0 9C-9 7-8-1 0-11Z" fill="${SAL}"/>`;
}

function barra(x: number, y: number, largura: number): string {
  return `<rect x="${x}" y="${y}" width="${largura}" height="9" rx="4.5" fill="${ESC}"/>`;
}

const BRACO = 'M0-40V40M-10-28L0-18L10-28M-10 28L0 18L10 28';

const ICONES: Record<TipoClima, () => string> = {
  ensolarado: () => sol(80, 60, 27),
  'parcialmente-nublado': () => sol(56, 46, 19) + nuvem(30, 22, 0.85, ESC, ESC2),
  nublado: () => nuvem(40, -6, 0.7, '#9DB3A6', '#85998C') + nuvem(4, 14, 0.95, ESC, ESC2),
  'chuva-leve': () => nuvem(10, -14, 1, ESC, ESC2) + gota(46, 102) + gota(72, 108) + gota(98, 102),
  tempestade: () =>
    nuvem(10, -18, 1, '#B3C4B8', '#93A89A') +
    gota(34, 98) +
    gota(122, 98) +
    `<polygon points="88,58 66,90 82,90 74,114 108,74 91,74 100,58" fill="${ORG}"/>`,
  neblina: () => nuvem(14, -16, 0.95, ESC, ESC2) + barra(8, 82, 112) + barra(36, 96, 112) + barra(6, 110, 90),
  'vento-forte': () =>
    traco('M8 70H92a12 12 0 1 0-12-12', SAL) +
    traco('M20 92H116a13 13 0 1 1-13 13', SAL) +
    traco('M4 48H40a9 9 0 1 0-9-9', SAL) +
    nuvem(50, -8, 0.75, ESC, ESC2),
  geada: () =>
    '<g transform="translate(80 60)">' +
    [0, 60, 120]
      .map(
        (a) =>
          `<path transform="rotate(${a})" d="${BRACO}" fill="none" stroke="${ESC}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>`
      )
      .join('') +
    `<circle r="6" fill="${ESC}"/></g>` +
    [
      [18, 24],
      [144, 28],
      [146, 98],
      [16, 94],
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="${ESC}" opacity=".8"/>`)
      .join(''),
};

export function svgInternoClima(tipo: TipoClima): string {
  return (ICONES[tipo] ?? ICONES.ensolarado)();
}
