import { api } from './api';

export interface Endereco {
  rua: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  uf: string | null;
  pais: string | null;
  /** "Rua X, Bairro Y, Cidade - UF" com o que existir. */
  texto: string;
}

// Mesmo retângulo aproximado do backend: só vale como plano B se a API de
// fronteiras estiver fora do ar — a checagem de verdade é no servidor.
const LIMITES_BRASIL = { latMin: -34, latMax: 6, lngMin: -74, lngMax: -28 };

function retanguloBrasil(lat: number, lng: number): boolean {
  return lat >= LIMITES_BRASIL.latMin && lat <= LIMITES_BRASIL.latMax && lng >= LIMITES_BRASIL.lngMin && lng <= LIMITES_BRASIL.lngMax;
}

// Confere com a fronteira real do Brasil (vizinhos como Paraguai/Uruguai
// ficam de fora, o que o retângulo sozinho não consegue).
export async function pontoDentroDoBrasil(lat: number, lng: number): Promise<boolean> {
  if (!retanguloBrasil(lat, lng)) return false;
  try {
    const resposta = await api.get<{ dentroDoBrasil: boolean }>('/geo/dentro-do-brasil', { params: { lat, lng } });
    return resposta.data.dentroDoBrasil;
  } catch {
    return true;
  }
}

const cacheEnderecos = new Map<string, Promise<Endereco | null>>();

function chave(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

// Rua, bairro e cidade de uma coordenada (cache por ~11 m durante a sessão).
export function buscarEndereco(lat: number, lng: number): Promise<Endereco | null> {
  const k = chave(lat, lng);
  const existente = cacheEnderecos.get(k);
  if (existente) return existente;

  const promessa = api
    .get<{ endereco: Endereco | null }>('/geo/endereco', { params: { lat, lng } })
    .then((r) => r.data.endereco)
    .catch(() => null);

  // Não guarda falha: da próxima vez tenta de novo.
  promessa.then((e) => {
    if (!e) cacheEnderecos.delete(k);
  });
  cacheEnderecos.set(k, promessa);
  return promessa;
}
