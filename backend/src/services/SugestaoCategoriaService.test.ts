import { describe, it, expect } from 'vitest';
import { calcularSugestaoPorTexto, CategoriaConsultavel } from './SugestaoCategoriaService.js';

const categorias: CategoriaConsultavel[] = [
  { id: 1, nome: 'Buraco na Via', descricao: 'Rachaduras, crateras ou asfalto danificado' },
  { id: 2, nome: 'Iluminação Pública', descricao: 'Postes com lâmpadas apagadas' },
  { id: 3, nome: 'Alagamento', descricao: 'Pontos de acúmulo de água após chuvas fortes' },
  { id: 5, nome: 'Foco de Incêndio', descricao: 'Queimadas em terrenos baldios ou matagais' },
];

describe('calcularSugestaoPorTexto (RN09 - sugestão de IA é consultiva)', function () {
  it('sugere a categoria com mais palavras em comum com a descrição', function () {
    const resultado = calcularSugestaoPorTexto(
      'Tem um buraco enorme no asfalto da rua, cheio de rachaduras',
      categorias
    );

    expect(resultado.categoriaId).toBe(1);
    expect(resultado.categoriaNome).toBe('Buraco na Via');
    expect(resultado.confianca).toBeGreaterThan(0);
  });

  it('reconhece um problema de outra categoria (incêndio)', function () {
    const resultado = calcularSugestaoPorTexto('Foco de incêndio grande no matagal atrás de casa', categorias);
    expect(resultado.categoriaId).toBe(5);
  });

  it('retorna null quando a descrição não bate com nenhuma categoria', function () {
    const resultado = calcularSugestaoPorTexto('blablabla xyz nada a ver com nada', categorias);
    expect(resultado.categoriaId).toBeNull();
    expect(resultado.confianca).toBe(0);
  });

  it('retorna null para descrição vazia', function () {
    const resultado = calcularSugestaoPorTexto('', categorias);
    expect(resultado.categoriaId).toBeNull();
  });

  it('retorna null quando não há categorias cadastradas', function () {
    const resultado = calcularSugestaoPorTexto('buraco na via', []);
    expect(resultado.categoriaId).toBeNull();
  });

  it('a confiança nunca ultrapassa 1', function () {
    const resultado = calcularSugestaoPorTexto('buraco via', categorias);
    expect(resultado.confianca).toBeLessThanOrEqual(1);
  });
});
