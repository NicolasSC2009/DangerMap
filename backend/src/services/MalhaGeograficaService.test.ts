import { describe, it, expect } from 'vitest';
import { pontoDentroDaGeometria } from './MalhaGeograficaService.js';

// Quadrado de 2x2 graus com um "buraco" no meio, só pra testar a lógica.
const geometria = {
  type: 'Polygon',
  coordinates: [
    [[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]],
    [[0.8, 0.8], [1.2, 0.8], [1.2, 1.2], [0.8, 1.2], [0.8, 0.8]],
  ],
};

describe('pontoDentroDaGeometria', function () {
  it('aceita ponto dentro do polígono', function () {
    expect(pontoDentroDaGeometria(0.3, 0.3, geometria, 0)).toBe(true);
  });

  it('rejeita ponto fora do polígono', function () {
    expect(pontoDentroDaGeometria(5, 5, geometria, 0)).toBe(false);
  });

  it('rejeita ponto dentro do buraco', function () {
    expect(pontoDentroDaGeometria(1, 1, geometria, 0)).toBe(false);
  });

  it('aceita ponto logo fora da borda quando há tolerância', function () {
    expect(pontoDentroDaGeometria(1, 2.01, geometria, 2500)).toBe(true);
    expect(pontoDentroDaGeometria(1, 2.5, geometria, 2500)).toBe(false);
  });

  it('funciona com MultiPolygon', function () {
    const multi = { type: 'MultiPolygon', coordinates: [geometria.coordinates, [[[10, 10], [11, 10], [11, 11], [10, 11], [10, 10]]]] };
    expect(pontoDentroDaGeometria(10.5, 10.5, multi, 0)).toBe(true);
    expect(pontoDentroDaGeometria(5, 5, multi, 0)).toBe(false);
  });
});
