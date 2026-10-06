// Traduz os códigos das fontes de clima para os 8 "estados" que o app mostra
// (ícone, cor e aviso no modal de clima).

export type TipoClima =
  | 'ensolarado'
  | 'parcialmente-nublado'
  | 'nublado'
  | 'chuva-leve'
  | 'tempestade'
  | 'neblina'
  | 'vento-forte'
  | 'geada';

// Código WMO (Open-Meteo) → estado do clima.
export function classificarCodigoWmo(codigo: number, ventoKmh: number, temperatura: number): TipoClima {
  if (codigo >= 95 || [65, 67, 82].includes(codigo)) return 'tempestade';
  if (ventoKmh >= 50) return 'vento-forte';
  if ((codigo >= 71 && codigo <= 77) || codigo === 85 || codigo === 86) return 'geada';
  if (temperatura <= 3 && codigo <= 3) return 'geada';
  if (codigo === 45 || codigo === 48) return 'neblina';
  if ((codigo >= 51 && codigo <= 63) || codigo === 66 || codigo === 80 || codigo === 81) return 'chuva-leve';
  if (codigo === 3) return 'nublado';
  if (codigo === 1 || codigo === 2) return 'parcialmente-nublado';
  return 'ensolarado';
}

// Símbolo do MET Norway (ex.: "partlycloudy_day") → estado do clima.
export function classificarSimboloMet(simbolo: string | undefined, ventoKmh: number, temperatura: number): TipoClima {
  const base = (simbolo ?? '').replace(/_(day|night|polartwilight)$/, '');
  if (base.includes('thunder') || base === 'heavyrain' || base === 'heavyrainshowers') return 'tempestade';
  if (ventoKmh >= 50) return 'vento-forte';
  if (base.includes('snow') || base.includes('sleet')) return 'geada';
  if (temperatura <= 3 && (base === 'clearsky' || base === 'fair' || base === 'partlycloudy' || base === 'cloudy')) return 'geada';
  if (base === 'fog') return 'neblina';
  if (base.includes('rain')) return 'chuva-leve';
  if (base === 'cloudy') return 'nublado';
  if (base === 'partlycloudy') return 'parcialmente-nublado';
  return 'ensolarado';
}
