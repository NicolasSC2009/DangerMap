import { describe, it, expect } from 'vitest';
import { classificarCodigoWmo, classificarSimboloMet } from './clima.js';

describe('classificarCodigoWmo', function () {
  it('céu limpo vira ensolarado', function () {
    expect(classificarCodigoWmo(0, 10, 25)).toBe('ensolarado');
  });

  it('trovoada e chuva forte viram tempestade', function () {
    expect(classificarCodigoWmo(95, 10, 25)).toBe('tempestade');
    expect(classificarCodigoWmo(65, 10, 25)).toBe('tempestade');
  });

  it('vento forte tem prioridade sobre nuvens', function () {
    expect(classificarCodigoWmo(3, 60, 25)).toBe('vento-forte');
  });

  it('frio extremo com céu aberto vira geada', function () {
    expect(classificarCodigoWmo(1, 5, 2)).toBe('geada');
  });

  it('garoa e chuva fraca viram chuva-leve; neblina e nublado são distintos', function () {
    expect(classificarCodigoWmo(53, 5, 20)).toBe('chuva-leve');
    expect(classificarCodigoWmo(45, 5, 20)).toBe('neblina');
    expect(classificarCodigoWmo(3, 5, 20)).toBe('nublado');
    expect(classificarCodigoWmo(2, 5, 20)).toBe('parcialmente-nublado');
  });
});

describe('classificarSimboloMet', function () {
  it('converte os símbolos mais comuns', function () {
    expect(classificarSimboloMet('clearsky_day', 5, 25)).toBe('ensolarado');
    expect(classificarSimboloMet('partlycloudy_night', 5, 25)).toBe('parcialmente-nublado');
    expect(classificarSimboloMet('cloudy', 5, 25)).toBe('nublado');
    expect(classificarSimboloMet('lightrainshowers_day', 5, 25)).toBe('chuva-leve');
    expect(classificarSimboloMet('rainandthunder', 5, 25)).toBe('tempestade');
    expect(classificarSimboloMet('fog', 5, 25)).toBe('neblina');
    expect(classificarSimboloMet('snow', 5, 25)).toBe('geada');
  });

  it('sem símbolo assume ensolarado', function () {
    expect(classificarSimboloMet(undefined, 5, 25)).toBe('ensolarado');
  });
});
