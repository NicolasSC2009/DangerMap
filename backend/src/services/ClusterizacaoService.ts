import { distanciaHaversineMetros } from '../utils/geo.js';

export interface PontoAgrupavel {
  id: number;
  latitude: number;
  longitude: number;
  gravidade?: string | null;
}

export interface ClusterResultado<T extends PontoAgrupavel> {
  latitude: number;
  longitude: number;
  quantidade: number;
  gravidadeMaisAlta: string | null;
  ocorrenciaIds: number[];
  itens: T[];
}

const ORDEM_GRAVIDADE: Record<string, number> = { baixo: 1, medio: 2, alto: 3 };

export const RAIO_CLUSTER_MINIMO_METROS = 10;
export const RAIO_CLUSTER_MAXIMO_METROS = 5000;
export const RAIO_CLUSTER_PADRAO_METROS = 300;

function gravidadeMaisAlta(a: string | null, b: string | null | undefined): string | null {
  const valorB = b ? ORDEM_GRAVIDADE[b] || 0 : 0;
  const valorA = a ? ORDEM_GRAVIDADE[a] || 0 : 0;
  return valorB > valorA ? (b as string) : a;
}

function construirCluster<T extends PontoAgrupavel>(membros: T[]): ClusterResultado<T> {
  let somaLat = 0;
  let somaLon = 0;
  let gravidade: string | null = null;

  for (const membro of membros) {
    somaLat += membro.latitude;
    somaLon += membro.longitude;
    gravidade = gravidadeMaisAlta(gravidade, membro.gravidade);
  }

  return {
    latitude: somaLat / membros.length,
    longitude: somaLon / membros.length,
    quantidade: membros.length,
    gravidadeMaisAlta: gravidade,
    ocorrenciaIds: membros.map(function (m) { return m.id; }),
    itens: membros,
  };
}

// Agrupamento guloso por proximidade: cada ponto ainda não visitado abre um
// novo cluster e "absorve" todo ponto restante dentro do raio (RF14/RN16).
// O(n²), o que é perfeitamente aceitável para a escala de dados deste
// projeto (centenas/poucos milhares de ocorrências ativas por vez).
export function agruparPorProximidade<T extends PontoAgrupavel>(
  pontos: T[],
  raioMetros: number
): ClusterResultado<T>[] {
  const raio = Math.max(RAIO_CLUSTER_MINIMO_METROS, Math.min(RAIO_CLUSTER_MAXIMO_METROS, raioMetros));
  const visitado = new Array(pontos.length).fill(false);
  const clusters: ClusterResultado<T>[] = [];

  for (let i = 0; i < pontos.length; i++) {
    if (visitado[i]) continue;
    visitado[i] = true;
    const membros: T[] = [pontos[i]];

    for (let j = i + 1; j < pontos.length; j++) {
      if (visitado[j]) continue;

      const distancia = distanciaHaversineMetros(
        pontos[i].latitude,
        pontos[i].longitude,
        pontos[j].latitude,
        pontos[j].longitude
      );

      if (distancia <= raio) {
        visitado[j] = true;
        membros.push(pontos[j]);
      }
    }

    clusters.push(construirCluster(membros));
  }

  return clusters;
}
