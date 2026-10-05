// Geocodificação reversa (coordenada → rua, bairro, cidade) usando o
// Nominatim do OpenStreetMap (gratuito, sem chave). A política de uso deles
// pede: identificar o app no User-Agent, no máximo 1 requisição por segundo e
// cache dos resultados — por isso tudo passa por uma fila e por um cache.

export interface EnderecoResolvido {
  rua: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  uf: string | null;
  pais: string | null;
  /** "Rua X, Bairro Y, Cidade - UF" com o que existir. */
  texto: string;
}

const URL_NOMINATIM = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = 'DangerMap/1.0 (projeto academico; mapa colaborativo de perigos urbanos)';
const INTERVALO_ENTRE_REQUISICOES_MS = 1100;
const TIMEOUT_MS = 8000;
const VALIDADE_CACHE_MS = 7 * 24 * 60 * 60 * 1000;
const TAMANHO_MAXIMO_CACHE = 5000;

const cache = new Map<string, { valor: EnderecoResolvido | null; expiraEm: number }>();
const emAndamento = new Map<string, Promise<EnderecoResolvido | null>>();
let filaAteAgora: Promise<unknown> = Promise.resolve();
let ultimaRequisicaoEm = 0;

// ~11 m de precisão: ocorrências "no mesmo lugar" compartilham a resposta.
function chaveDe(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

function esperar(ms: number): Promise<void> {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

function montarTexto(e: Omit<EnderecoResolvido, 'texto'>): string {
  const local = [e.rua, e.bairro].filter(Boolean).join(', ');
  const cidadeUf = [e.cidade, e.uf].filter(Boolean).join(' - ');
  return [local, cidadeUf].filter(Boolean).join(', ');
}

function interpretar(json: any): EnderecoResolvido | null {
  const a = json?.address;
  if (!a) return null;

  const iso: string | undefined = a['ISO3166-2-lvl4'];
  const base = {
    rua: a.road || a.pedestrian || a.footway || a.path || a.cycleway || null,
    bairro: a.suburb || a.neighbourhood || a.quarter || a.city_district || null,
    cidade: a.city || a.town || a.village || a.municipality || a.county || null,
    estado: a.state || null,
    uf: iso && iso.includes('-') ? iso.split('-')[1] : null,
    pais: a.country || null,
  };
  return { ...base, texto: montarTexto(base) };
}

async function consultar(lat: number, lng: number): Promise<EnderecoResolvido | null> {
  // Fila: garante o espaçamento mínimo mesmo com várias consultas ao mesmo tempo.
  const minhaVez = filaAteAgora.then(async function () {
    const espera = INTERVALO_ENTRE_REQUISICOES_MS - (Date.now() - ultimaRequisicaoEm);
    if (espera > 0) await esperar(espera);
    ultimaRequisicaoEm = Date.now();
  });
  filaAteAgora = minhaVez.catch(function () { /* a fila nunca quebra */ });
  await minhaVez;

  const controle = new AbortController();
  const timeout = setTimeout(function () { controle.abort(); }, TIMEOUT_MS);
  try {
    const url = `${URL_NOMINATIM}?format=jsonv2&addressdetails=1&zoom=18&accept-language=pt-BR&lat=${lat}&lon=${lng}`;
    const resposta = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: controle.signal });
    if (!resposta.ok) return null;
    return interpretar(await resposta.json());
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export class GeocodificacaoService {
  static async enderecoDe(lat: number, lng: number): Promise<EnderecoResolvido | null> {
    const chave = chaveDe(lat, lng);

    const guardado = cache.get(chave);
    if (guardado && guardado.expiraEm > Date.now()) return guardado.valor;

    const pendente = emAndamento.get(chave);
    if (pendente) return pendente;

    const promessa = consultar(lat, lng).then(function (valor) {
      // Falhas (null) ficam em cache só por pouco tempo, pra tentar de novo logo.
      const validade = valor ? VALIDADE_CACHE_MS : 30 * 1000;
      if (cache.size >= TAMANHO_MAXIMO_CACHE) {
        const maisAntiga = cache.keys().next().value;
        if (maisAntiga) cache.delete(maisAntiga);
      }
      cache.set(chave, { valor, expiraEm: Date.now() + validade });
      return valor;
    }).finally(function () {
      emAndamento.delete(chave);
    });

    emAndamento.set(chave, promessa);
    return promessa;
  }
}
