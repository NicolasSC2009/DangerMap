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

const todasCategorias: CategoriaConsultavel[] = [
  'Acidente de Trânsito', 'Alagamento', 'Animal Morto na Via', 'Animal na Pista',
  'Assalto ou Roubo', 'Buraco na Via', 'Foco de Incêndio', 'Iluminação Pública',
  'Obra na Via', 'Pista Escorregadia', 'Risco de Queda', 'Sinalização Danificada',
  'Vazamento de Gás', 'Via Interditada',
].map(function (nome, i) { return { id: i + 1, nome, descricao: null }; });

function sugerir(texto: string): string | null {
  return calcularSugestaoPorTexto(texto, todasCategorias).categoriaNome;
}

describe('calcularSugestaoPorTexto com as 14 categorias reais', function () {
  const casos: Array<[string, string]> = [
    ['Cachorro partido ao meio no chão', 'Animal Morto na Via'],
    ['Tem um cachorro morto na avenida', 'Animal Morto na Via'],
    ['Vaca solta atravessando a rodovia', 'Animal na Pista'],
    ['Cavalos na pista perto do trevo', 'Animal na Pista'],
    ['Água acumulada na rua depois da chuva, não dá pra passar', 'Alagamento'],
    ['Enchente no bairro inteiro', 'Alagamento'],
    ['Buraco enorme aberto no meio da pista', 'Buraco na Via'],
    ['Cratera no asfalto', 'Buraco na Via'],
    ['Colisão entre dois carros na esquina', 'Acidente de Trânsito'],
    ['Moto atropelou um pedestre', 'Acidente de Trânsito'],
    ['Cheiro forte de gás na rua', 'Vazamento de Gás'],
    ['Pegando fogo no mato, muita fumaça', 'Foco de Incêndio'],
    ['Poste sem luz, rua completamente escura', 'Iluminação Pública'],
    ['Semáforo quebrado no cruzamento', 'Sinalização Danificada'],
    ['Faixa de pedestre apagada em frente à escola', 'Sinalização Danificada'],
    ['Calçada quebrada, já tropecei aqui', 'Risco de Queda'],
    ['Óleo na pista, carros derrapando', 'Pista Escorregadia'],
    ['Árvore caída bloqueando toda a rua', 'Via Interditada'],
    ['Vala aberta e entulho da obra na rua', 'Obra na Via'],
    ['Fui assaltado aqui, ladrões armados', 'Assalto ou Roubo'],
  ];

  for (const [texto, esperado] of casos) {
    it(`"${texto}" → ${esperado}`, function () {
      expect(sugerir(texto)).toBe(esperado);
    });
  }

  it('gasolina não é confundida com gás', function () {
    expect(sugerir('Posto de gasolina com fila enorme')).not.toBe('Vazamento de Gás');
  });

  it('ladrilho não é confundido com ladrão', function () {
    expect(sugerir('Ladrilho solto na calçada')).toBe('Risco de Queda');
  });
});
