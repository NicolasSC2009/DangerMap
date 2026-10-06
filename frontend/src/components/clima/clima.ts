// Tipos e textos da previsão do tempo (resposta de GET /clima/previsao).

export type TipoClima =
  | 'ensolarado'
  | 'parcialmente-nublado'
  | 'nublado'
  | 'chuva-leve'
  | 'tempestade'
  | 'neblina'
  | 'vento-forte'
  | 'geada';

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

export const NOME_CLIMA: Record<TipoClima, string> = {
  ensolarado: 'Ensolarado',
  'parcialmente-nublado': 'Parcialmente nublado',
  nublado: 'Nublado',
  'chuva-leve': 'Chuva',
  tempestade: 'Tempestade',
  neblina: 'Neblina',
  'vento-forte': 'Vento forte',
  geada: 'Frio extremo',
};

// Cor de destaque do cartão "Agora" para cada situação.
export const TOM_CLIMA: Record<TipoClima, string> = {
  ensolarado: '#FF8A1F',
  'parcialmente-nublado': '#D9A441',
  nublado: '#6F8A9A',
  'chuva-leve': '#3E7FB5',
  tempestade: '#6B4FB0',
  neblina: '#9AA6A0',
  'vento-forte': '#2FB5A8',
  geada: '#5FB4E8',
};

export type NivelAlerta = 'ok' | 'atencao' | 'perigo';

export const ALERTA_CLIMA: Record<TipoClima, { nivel: NivelAlerta; texto: string }> = {
  ensolarado: { nivel: 'ok', texto: 'Tempo firme, sem alertas para a região' },
  'parcialmente-nublado': { nivel: 'ok', texto: 'Tempo firme, sem alertas para a região' },
  nublado: { nivel: 'ok', texto: 'Sem alertas para a região' },
  'chuva-leve': { nivel: 'atencao', texto: 'Pista escorregadia: reduza a velocidade' },
  tempestade: { nivel: 'perigo', texto: 'Risco de alagamento e queda de energia' },
  neblina: { nivel: 'atencao', texto: 'Visibilidade reduzida nas rodovias' },
  'vento-forte': { nivel: 'atencao', texto: 'Rajadas fortes: cuidado com árvores' },
  geada: { nivel: 'atencao', texto: 'Frio intenso: pista pode ter gelo pela manhã' },
};

export function nomeDoDia(data: string, indice: number): string {
  if (indice === 0) return 'Hoje';
  const abreviado = new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  return abreviado.charAt(0).toUpperCase() + abreviado.slice(1);
}
