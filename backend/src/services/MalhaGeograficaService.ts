// Busca e cacheia em memória a malha geográfica (fronteira) de um estado ou do
// país, usando a API pública do IBGE. A malha não muda com o tempo, então
// cachear evita bater na API do IBGE a cada relatório/ocorrência.

interface GeometriaGeoJSON {
  type: string;
  coordinates: unknown;
}

const TEMPO_FALHA_MS = 60 * 1000;

const cacheMalhas = new Map<string, GeometriaGeoJSON>();
const falhasRecentes = new Map<string, number>();

async function buscarMalha(chave: string, caminho: string, qualidade: string): Promise<GeometriaGeoJSON | null> {
  const emCache = cacheMalhas.get(chave);
  if (emCache) return emCache;

  // Se o IBGE acabou de falhar, não insiste a cada requisição (mas tenta de novo depois).
  const falhouEm = falhasRecentes.get(chave);
  if (falhouEm && Date.now() - falhouEm < TEMPO_FALHA_MS) return null;

  try {
    const resposta = await fetch(
      `https://servicodados.ibge.gov.br/api/v3/malhas/${caminho}?formato=application/vnd.geo+json&qualidade=${qualidade}`
    );
    if (!resposta.ok) throw new Error(`IBGE respondeu ${resposta.status}`);
    const dados = JSON.parse(await resposta.text()) as { features?: Array<{ geometry: GeometriaGeoJSON }> };
    const geometria = dados.features?.[0]?.geometry;
    if (!geometria) throw new Error('Malha vazia.');
    cacheMalhas.set(chave, geometria);
    falhasRecentes.delete(chave);
    return geometria;
  } catch {
    falhasRecentes.set(chave, Date.now());
    return null;
  }
}

export async function obterMalhaEstado(uf: string): Promise<GeometriaGeoJSON | null> {
  return buscarMalha(`estado:${uf}`, `estados/${uf}`, 'intermediaria');
}

/* ---------------------------------------------------------------------------
   Ponto dentro do Brasil (fronteira real, não um retângulo)
   ------------------------------------------------------------------------ */

type Anel = number[][];

const LIMITES_BRASIL = { latMin: -34, latMax: 6, lngMin: -74, lngMax: -28 };

// Pontos na praia/orla podem cair um pouco fora do polígono simplificado. Fica
// pequena de propósito: cidades de fronteira (Ciudad del Este, Rivera,
// Letícia...) estão a poucos km do limite e não podem passar.
const TOLERANCIA_COSTA_METROS = 300;

function retanguloBrasil(lat: number, lng: number): boolean {
  return lat >= LIMITES_BRASIL.latMin && lat <= LIMITES_BRASIL.latMax && lng >= LIMITES_BRASIL.lngMin && lng <= LIMITES_BRASIL.lngMax;
}

function dentroDoAnel(lat: number, lng: number, anel: Anel): boolean {
  let dentro = false;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [xi, yi] = anel[i];
    const [xj, yj] = anel[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      dentro = !dentro;
    }
  }
  return dentro;
}

function poligonosDe(geometria: GeometriaGeoJSON): Anel[][] {
  if (geometria.type === 'Polygon') return [geometria.coordinates as Anel[]];
  if (geometria.type === 'MultiPolygon') return geometria.coordinates as Anel[][];
  return [];
}

function distanciaAoAnelMetros(lat: number, lng: number, anel: Anel): number {
  const metrosPorGrauLat = 111320;
  const metrosPorGrauLng = 111320 * Math.cos((lat * Math.PI) / 180);
  let menor = Infinity;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const ax = (anel[j][0] - lng) * metrosPorGrauLng;
    const ay = (anel[j][1] - lat) * metrosPorGrauLat;
    const bx = (anel[i][0] - lng) * metrosPorGrauLng;
    const by = (anel[i][1] - lat) * metrosPorGrauLat;
    const dx = bx - ax;
    const dy = by - ay;
    const comprimento2 = dx * dx + dy * dy;
    const t = comprimento2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / comprimento2));
    const px = ax + t * dx;
    const py = ay + t * dy;
    menor = Math.min(menor, Math.hypot(px, py));
  }
  return menor;
}

// Função pura (testável): decide com base na geometria já carregada.
export function pontoDentroDaGeometria(lat: number, lng: number, geometria: GeometriaGeoJSON, tolerancia = TOLERANCIA_COSTA_METROS): boolean {
  const poligonos = poligonosDe(geometria);
  for (const [externo, ...buracos] of poligonos) {
    if (dentroDoAnel(lat, lng, externo) && !buracos.some((buraco) => dentroDoAnel(lat, lng, buraco))) {
      return true;
    }
  }
  if (tolerancia > 0) {
    for (const [externo] of poligonos) {
      if (distanciaAoAnelMetros(lat, lng, externo) <= tolerancia) return true;
    }
  }
  return false;
}

// Valida se uma coordenada está dentro do território brasileiro. Se o IBGE
// estiver fora do ar, cai no retângulo aproximado em vez de bloquear tudo.
export async function pontoDentroDoBrasil(lat: number, lng: number): Promise<boolean> {
  if (!retanguloBrasil(lat, lng)) return false;
  const malha = await buscarMalha('pais:BR', 'paises/BR', 'maxima');
  if (!malha) return true;
  return pontoDentroDaGeometria(lat, lng, malha);
}
