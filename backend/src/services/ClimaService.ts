import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CACHE_MINUTOS = 30;
const TIMEOUT_MS = 5000;

const DESCRICOES_WMO: Record<number, string> = {
  0: 'Céu limpo', 1: 'Predomínio de sol', 2: 'Parcialmente nublado', 3: 'Nublado',
  45: 'Neblina', 48: 'Neblina com geada',
  51: 'Garoa fraca', 53: 'Garoa moderada', 55: 'Garoa forte',
  56: 'Garoa congelante fraca', 57: 'Garoa congelante forte',
  61: 'Chuva fraca', 63: 'Chuva moderada', 65: 'Chuva forte',
  66: 'Chuva congelante fraca', 67: 'Chuva congelante forte',
  71: 'Neve fraca', 73: 'Neve moderada', 75: 'Neve forte', 77: 'Grãos de neve',
  80: 'Pancadas de chuva fracas', 81: 'Pancadas de chuva moderadas', 82: 'Pancadas de chuva fortes',
  85: 'Pancadas de neve fracas', 86: 'Pancadas de neve fortes',
  95: 'Trovoadas', 96: 'Trovoadas com granizo leve', 99: 'Trovoadas com granizo forte',
};

interface ClimaAtual {
  temperatura: number | null;
  umidade: number | null;
  condicao_tempo: string;
}

function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

function chaveRegiao(latitude: number, longitude: number): string {
  return `${arredondar(latitude)},${arredondar(longitude)}`;
}

export class ClimaService {
  static async obterClimaAtual(latitude: number, longitude: number) {
    const regiao = chaveRegiao(latitude, longitude);
    const desde = new Date(Date.now() - CACHE_MINUTOS * 60 * 1000);

    const emCache = await prisma.dadoClimatico
      .findFirst({
        where: { regiao, data_leitura: { gte: desde } },
        orderBy: { data_leitura: 'desc' },
      })
      .catch(function () {
        return null;
      });

    if (emCache) {
      return {
        regiao: emCache.regiao,
        temperatura: emCache.temperatura !== null ? Number(emCache.temperatura) : null,
        condicao_tempo: emCache.condicao_tempo,
        umidade: emCache.umidade,
        data_leitura: emCache.data_leitura,
        origem: 'cache' as const,
      };
    }

    const dados = await ClimaService.buscarDaApi(latitude, longitude);
    const agora = new Date();

    prisma.dadoClimatico
      .create({
        data: {
          regiao,
          temperatura: dados.temperatura,
          condicao_tempo: dados.condicao_tempo,
          umidade: dados.umidade,
          data_leitura: agora,
        },
      })
      .catch(function (error) {
        console.error('[ERRO AO SALVAR CACHE DE CLIMA]:', error);
      });

    return { regiao, ...dados, data_leitura: agora, origem: 'api' as const };
  }

  private static async buscarDaApi(latitude: number, longitude: number): Promise<ClimaAtual> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`;

    const controle = new AbortController();
    const timeout = setTimeout(function () {
      controle.abort();
    }, TIMEOUT_MS);

    try {
      const resposta = await fetch(url, { signal: controle.signal });

      if (!resposta.ok) {
        throw new Error(`API de clima respondeu com status ${resposta.status}`);
      }

      const json = (await resposta.json()) as any;
      const atual = json?.current;

      return {
        temperatura: typeof atual?.temperature_2m === 'number' ? atual.temperature_2m : null,
        umidade: typeof atual?.relative_humidity_2m === 'number' ? Math.round(atual.relative_humidity_2m) : null,
        condicao_tempo: DESCRICOES_WMO[atual?.weather_code] || 'Condição desconhecida',
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
