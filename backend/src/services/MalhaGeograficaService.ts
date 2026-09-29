// Busca e cacheia em memória a malha geográfica (fronteira) de um estado
// brasileiro, usando a API pública do IBGE. A malha não muda com o tempo,
// então cachear evita bater na API do IBGE a cada relatório.

interface GeometriaGeoJSON {
  type: string;
  coordinates: unknown;
}

const cacheMalhasPorUf = new Map<string, GeometriaGeoJSON | null>();

export async function obterMalhaEstado(uf: string): Promise<GeometriaGeoJSON | null> {
  if (cacheMalhasPorUf.has(uf)) {
    return cacheMalhasPorUf.get(uf) ?? null;
  }

  try {
    const resposta = await fetch(
      `https://servicodados.ibge.gov.br/api/v3/malhas/estados/${uf}?formato=application/vnd.geo+json&qualidade=intermediaria`
    );
    if (!resposta.ok) {
      cacheMalhasPorUf.set(uf, null);
      return null;
    }
    const dados = (await resposta.json()) as { features?: Array<{ geometry: GeometriaGeoJSON }> };
    const geometria = dados.features?.[0]?.geometry ?? null;
    cacheMalhasPorUf.set(uf, geometria);
    return geometria;
  } catch {
    cacheMalhasPorUf.set(uf, null);
    return null;
  }
}
