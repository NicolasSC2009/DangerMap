import { describe, it, expect } from 'vitest';
import { agruparPorProximidade, PontoAgrupavel } from './ClusterizacaoService.js';

function ponto(id: number, latitude: number, longitude: number, gravidade: string | null = 'medio'): PontoAgrupavel {
  return { id, latitude, longitude, gravidade };
}

describe('agruparPorProximidade (RF14/RN16)', function () {
  it('retorna lista vazia para entrada vazia', function () {
    expect(agruparPorProximidade([], 300)).toEqual([]);
  });

  it('um único ponto forma seu próprio cluster com quantidade 1', function () {
    const resultado = agruparPorProximidade([ponto(1, -27.5954, -48.548)], 300);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].quantidade).toBe(1);
    expect(resultado[0].ocorrenciaIds).toEqual([1]);
  });

  it('agrupa pontos bem próximos (dentro do raio) em um único cluster', function () {
    const pontos = [
      ponto(1, -27.5954, -48.548),
      ponto(2, -27.59545, -48.54805), // a poucos metros de distância
    ];

    const resultado = agruparPorProximidade(pontos, 300);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].quantidade).toBe(2);
    expect(resultado[0].ocorrenciaIds.sort()).toEqual([1, 2]);
  });

  it('NÃO agrupa pontos distantes entre si (fora do raio)', function () {
    const pontos = [
      ponto(1, -27.5954, -48.548),
      ponto(2, -27.7, -48.6), // vários km de distância
    ];

    const resultado = agruparPorProximidade(pontos, 300);

    expect(resultado).toHaveLength(2);
    expect(resultado.every(function (c) { return c.quantidade === 1; })).toBe(true);
  });

  it('o cluster herda a gravidade mais alta entre seus membros', function () {
    const pontos = [
      ponto(1, -27.5954, -48.548, 'baixo'),
      ponto(2, -27.59545, -48.54805, 'alto'),
      ponto(3, -27.59548, -48.54808, 'medio'),
    ];

    const resultado = agruparPorProximidade(pontos, 300);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].gravidadeMaisAlta).toBe('alto');
  });

  it('calcula o centróide (média) das coordenadas dos membros', function () {
    const pontos = [ponto(1, 0, 0), ponto(2, 0.0001, 0)];
    const resultado = agruparPorProximidade(pontos, 300);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].latitude).toBeCloseTo(0.00005, 6);
    expect(resultado[0].longitude).toBeCloseTo(0, 6);
  });

  it('respeita o raio mínimo/máximo mesmo se um valor absurdo for passado', function () {
    // raio negativo ou zero não deve travar nem agrupar tudo indevidamente
    const pontos = [ponto(1, -27.5954, -48.548), ponto(2, -27.7, -48.6)];
    const resultado = agruparPorProximidade(pontos, -50);
    expect(resultado).toHaveLength(2);
  });
});
