// Previsão completa (agora, próximas horas e próximos dias) para o modal de clima.
// Fonte principal: Open-Meteo. Se estiver fora do ar, usa o MET Norway (yr.no),
// que traz menos detalhes (sem visibilidade, nascer/pôr do sol nem chance de chuva).
import { classificarCodigoWmo, classificarSimboloMet, type TipoClima } from '../utils/clima.js';

const CACHE_MINUTOS = 30;
const TIMEOUT_MS = 6000;
const USER_AGENT = 'DangerMap/1.0 (projeto academico; mapa colaborativo de perigos urbanos)';
const FUSO_BRASIL = 'America/Sao_Paulo';

export interface PrevisaoClima {
  fonte: 'open-meteo' | 'met-norway';
  atualizadoEm: string;
  atual: {
    clima: TipoClima;
    temperatura: number;
    sensacao: number;
    max: number;
    min: number;
    umidade: number | null;
    chuva: number | null;
    vento: number | null;
    uv: number | null;
    visibilidadeKm: number | null;
    pressao: number | null;
    nascer: string | null;
    por: string | null;
  };
  horas: Array<{ hora: string; temperatura: number; chuva: number | null; clima: TipoClima }>;
  dias: Array<{ data: string; min: number; max: number; chuva: number | null; clima: TipoClima }>;
}

const cache = new Map<string, { valor: PrevisaoClima; expiraEm: number }>();
const emAndamento = new Map<string, Promise<PrevisaoClima>>();

// ~5 km: pontos próximos dividem a mesma previsão.
function chaveRegiao(lat: number, lng: number): string {
  return `${(Math.round(lat * 20) / 20).toFixed(2)},${(Math.round(lng * 20) / 20).toFixed(2)}`;
}

function numeroOuNulo(valor: unknown, arredondar = true): number | null {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return null;
  return arredondar ? Math.round(valor) : valor;
}

async function buscarJson(url: string, cabecalhos: Record<string, string> = {}): Promise<any> {
  const controle = new AbortController();
  const timeout = setTimeout(function () { controle.abort(); }, TIMEOUT_MS);
  try {
    const resposta = await fetch(url, { signal: controle.signal, headers: cabecalhos });
    if (!resposta.ok) throw new Error(`Serviço de clima respondeu ${resposta.status}`);
    return await resposta.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function buscarNoOpenMeteo(lat: number, lng: number): Promise<PrevisaoClima> {
  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${lat}&longitude=${lng}&timezone=auto&forecast_days=7` +
    '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,surface_pressure,wind_speed_10m' +
    '&hourly=temperature_2m,precipitation_probability,visibility,uv_index,weather_code,wind_speed_10m' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset';
  const j = await buscarJson(url);
  if (!j?.current || !j?.hourly || !j?.daily) throw new Error('Resposta do Open-Meteo incompleta');

  const h = j.hourly;
  const d = j.daily;
  const horaAtual = String(j.current.time).slice(0, 13) + ':00';
  const i = Math.max(0, (h.time as string[]).indexOf(horaAtual));

  const horas = Array.from({ length: 12 }, function (_, passo) {
    const k = i + passo;
    if (h.time[k] === undefined) return null;
    return {
      hora: passo === 0 ? 'Agora' : String(h.time[k]).slice(11, 13) + 'h',
      temperatura: Math.round(h.temperature_2m[k]),
      chuva: numeroOuNulo(h.precipitation_probability[k]),
      clima: classificarCodigoWmo(h.weather_code[k], h.wind_speed_10m[k], h.temperature_2m[k]),
    };
  }).filter(function (x): x is NonNullable<typeof x> { return x !== null; });

  const dias = (d.time as string[]).map(function (data, k) {
    return {
      data,
      min: Math.round(d.temperature_2m_min[k]),
      max: Math.round(d.temperature_2m_max[k]),
      chuva: numeroOuNulo(d.precipitation_probability_max[k]),
      clima: classificarCodigoWmo(d.weather_code[k], d.wind_speed_10m_max[k], d.temperature_2m_min[k]),
    };
  });

  const visibilidade = numeroOuNulo(h.visibility[i], false);
  return {
    fonte: 'open-meteo',
    atualizadoEm: new Date().toISOString(),
    atual: {
      clima: classificarCodigoWmo(j.current.weather_code, j.current.wind_speed_10m, j.current.temperature_2m),
      temperatura: Math.round(j.current.temperature_2m),
      sensacao: Math.round(j.current.apparent_temperature),
      max: dias[0].max,
      min: dias[0].min,
      umidade: numeroOuNulo(j.current.relative_humidity_2m),
      chuva: numeroOuNulo(h.precipitation_probability[i]),
      vento: numeroOuNulo(j.current.wind_speed_10m),
      uv: numeroOuNulo(h.uv_index[i]),
      visibilidadeKm: visibilidade === null ? null : Math.round((visibilidade / 1000) * 10) / 10,
      pressao: numeroOuNulo(j.current.surface_pressure),
      nascer: typeof d.sunrise?.[0] === 'string' ? d.sunrise[0].slice(11, 16) : null,
      por: typeof d.sunset?.[0] === 'string' ? d.sunset[0].slice(11, 16) : null,
    },
    horas,
    dias,
  };
}

function dataNoBrasil(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: FUSO_BRASIL });
}

function horaNoBrasil(iso: string): number {
  return Number(new Date(iso).toLocaleString('en-GB', { timeZone: FUSO_BRASIL, hour: '2-digit', hour12: false })) % 24;
}

async function buscarNoMetNorway(lat: number, lng: number): Promise<PrevisaoClima> {
  const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat.toFixed(4)}&lon=${lng.toFixed(4)}`;
  const j = await buscarJson(url, { 'User-Agent': USER_AGENT });
  const serie: any[] = j?.properties?.timeseries ?? [];
  if (serie.length === 0) throw new Error('Resposta do MET Norway vazia');

  const detalhes = (p: any) => p?.data?.instant?.details ?? {};
  const simbolo = (p: any): string | undefined =>
    p?.data?.next_1_hours?.summary?.symbol_code ?? p?.data?.next_6_hours?.summary?.symbol_code;
  const vento = (p: any) => (typeof detalhes(p).wind_speed === 'number' ? detalhes(p).wind_speed * 3.6 : 0);

  const agora = serie[0];
  const dAgora = detalhes(agora);
  const tempAgora = typeof dAgora.air_temperature === 'number' ? dAgora.air_temperature : 0;

  const horas = serie.slice(0, 12).map(function (p, passo) {
    const t = detalhes(p).air_temperature;
    const temp = typeof t === 'number' ? t : tempAgora;
    return {
      hora: passo === 0 ? 'Agora' : String(horaNoBrasil(p.time)).padStart(2, '0') + 'h',
      temperatura: Math.round(temp),
      chuva: null,
      clima: classificarSimboloMet(simbolo(p), vento(p), temp),
    };
  });

  // Agrupa por dia (fuso do Brasil): mínima, máxima e o símbolo do horário mais perto do meio-dia.
  const porDia = new Map<string, any[]>();
  for (const p of serie) {
    const dia = dataNoBrasil(p.time);
    if (!porDia.has(dia)) porDia.set(dia, []);
    porDia.get(dia)!.push(p);
  }
  const dias = [...porDia.entries()].slice(0, 7).map(function ([data, pontos]) {
    const temps = pontos.map((p) => detalhes(p).air_temperature).filter((t) => typeof t === 'number') as number[];
    const centro = pontos.reduce((melhor, p) =>
      Math.abs(horaNoBrasil(p.time) - 12) < Math.abs(horaNoBrasil(melhor.time) - 12) ? p : melhor
    );
    const min = temps.length ? Math.min(...temps) : tempAgora;
    const max = temps.length ? Math.max(...temps) : tempAgora;
    return {
      data,
      min: Math.round(min),
      max: Math.round(max),
      chuva: null,
      clima: classificarSimboloMet(simbolo(centro), vento(centro), min),
    };
  });

  return {
    fonte: 'met-norway',
    atualizadoEm: new Date().toISOString(),
    atual: {
      clima: classificarSimboloMet(simbolo(agora), vento(agora), tempAgora),
      temperatura: Math.round(tempAgora),
      sensacao: Math.round(tempAgora),
      max: dias[0]?.max ?? Math.round(tempAgora),
      min: dias[0]?.min ?? Math.round(tempAgora),
      umidade: numeroOuNulo(dAgora.relative_humidity),
      chuva: null,
      vento: numeroOuNulo(vento(agora)),
      uv: numeroOuNulo(dAgora.ultraviolet_index_clear_sky),
      visibilidadeKm: null,
      pressao: numeroOuNulo(dAgora.air_pressure_at_sea_level),
      nascer: null,
      por: null,
    },
    horas,
    dias,
  };
}

export class PrevisaoClimaService {
  static async obter(lat: number, lng: number): Promise<PrevisaoClima> {
    const chave = chaveRegiao(lat, lng);
    const guardado = cache.get(chave);
    if (guardado && guardado.expiraEm > Date.now()) return guardado.valor;

    const pendente = emAndamento.get(chave);
    if (pendente) return pendente;

    const promessa = (async function () {
      let valor: PrevisaoClima;
      try {
        valor = await buscarNoOpenMeteo(lat, lng);
      } catch (erro) {
        console.warn('[CLIMA] Open-Meteo indisponível, usando MET Norway:', (erro as Error).message);
        valor = await buscarNoMetNorway(lat, lng);
      }
      if (cache.size >= 500) {
        const maisAntiga = cache.keys().next().value;
        if (maisAntiga) cache.delete(maisAntiga);
      }
      cache.set(chave, { valor, expiraEm: Date.now() + CACHE_MINUTOS * 60 * 1000 });
      return valor;
    })().finally(function () {
      emAndamento.delete(chave);
    });

    emAndamento.set(chave, promessa);
    return promessa;
  }
}
