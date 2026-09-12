import { describe, it, expect } from 'vitest';
import { distanciaHaversineMetros } from './geo.js';

describe('distanciaHaversineMetros', function () {
  it('retorna 0 para o mesmo ponto', function () {
    expect(distanciaHaversineMetros(-27.5954, -48.5480, -27.5954, -48.5480)).toBe(0);
  });

  it('calcula corretamente ~111km para 1 grau de latitude', function () {
    const distancia = distanciaHaversineMetros(0, 0, 1, 0);
    expect(distancia).toBeGreaterThan(110000);
    expect(distancia).toBeLessThan(112000);
  });

  it('calcula uma distância pequena e realista entre pontos próximos', function () {
    // ~0.001 grau de latitude equivale a aproximadamente 111 metros
    const distancia = distanciaHaversineMetros(-27.5954, -48.5480, -27.5964, -48.5480);
    expect(distancia).toBeGreaterThan(100);
    expect(distancia).toBeLessThan(120);
  });
});
