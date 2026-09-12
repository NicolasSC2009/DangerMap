import { describe, it, expect } from 'vitest';
import { criarOcorrenciaSchema, listarOcorrenciasQuerySchema } from './OcorrenciaSchema.js';

const dadosValidos = {
  categoriaId: 1,
  latitude: -27.5954,
  longitude: -48.548,
};

describe('criarOcorrenciaSchema', function () {
  it('aceita dados mínimos válidos e aplica os defaults', function () {
    const resultado = criarOcorrenciaSchema.parse(dadosValidos);
    expect(resultado.anonimo).toBe(false); // default
    expect(resultado.categoriaId).toBe(1);
  });

  it('RN09.1 - descrição é opcional (pode ser omitida)', function () {
    const resultado = criarOcorrenciaSchema.parse(dadosValidos);
    expect(resultado.descricao).toBeUndefined();
  });

  it('rejeita descrição maior que 1000 caracteres', function () {
    const descricaoGigante = 'a'.repeat(1001);
    expect(function () {
      criarOcorrenciaSchema.parse({ ...dadosValidos, descricao: descricaoGigante });
    }).toThrow();
  });

  it('RN05 - rejeita latitude fora do intervalo [-90, 90]', function () {
    expect(function () {
      criarOcorrenciaSchema.parse({ ...dadosValidos, latitude: 91 });
    }).toThrow();

    expect(function () {
      criarOcorrenciaSchema.parse({ ...dadosValidos, latitude: -91 });
    }).toThrow();
  });

  it('RN05 - rejeita longitude fora do intervalo [-180, 180]', function () {
    expect(function () {
      criarOcorrenciaSchema.parse({ ...dadosValidos, longitude: 181 });
    }).toThrow();

    expect(function () {
      criarOcorrenciaSchema.parse({ ...dadosValidos, longitude: -181 });
    }).toThrow();
  });

  it('aceita os limites exatos de latitude/longitude', function () {
    expect(function () {
      criarOcorrenciaSchema.parse({ ...dadosValidos, latitude: 90, longitude: 180 });
    }).not.toThrow();
  });

  it('aceita gravidade dentro do enum e rejeita valor fora dele', function () {
    expect(function () {
      criarOcorrenciaSchema.parse({ ...dadosValidos, gravidade: 'alto' });
    }).not.toThrow();

    expect(function () {
      criarOcorrenciaSchema.parse({ ...dadosValidos, gravidade: 'catastrofico' });
    }).toThrow();
  });

  it('exige categoriaId', function () {
    const { categoriaId, ...semCategoria } = dadosValidos as any;
    expect(function () {
      criarOcorrenciaSchema.parse(semCategoria);
    }).toThrow();
  });
});

describe('listarOcorrenciasQuerySchema (RF13 - filtros)', function () {
  it('aceita objeto vazio (nenhum filtro aplicado)', function () {
    expect(function () {
      listarOcorrenciasQuerySchema.parse({});
    }).not.toThrow();
  });

  it('converte categoriaId de string (query param) para número', function () {
    const resultado = listarOcorrenciasQuerySchema.parse({ categoriaId: '3' });
    expect(resultado.categoriaId).toBe(3);
  });

  it('rejeita categoriaId inválido (não numérico ou não positivo)', function () {
    expect(function () {
      listarOcorrenciasQuerySchema.parse({ categoriaId: 'abc' });
    }).toThrow();

    expect(function () {
      listarOcorrenciasQuerySchema.parse({ categoriaId: '-1' });
    }).toThrow();
  });

  it('rejeita gravidade fora do enum', function () {
    expect(function () {
      listarOcorrenciasQuerySchema.parse({ gravidade: 'catastrofico' });
    }).toThrow();
  });

  it('rejeita status "arquivado" (nunca deve voltar a aparecer publicamente)', function () {
    expect(function () {
      listarOcorrenciasQuerySchema.parse({ status: 'arquivado' });
    }).toThrow();
  });

  it('aceita status dentro do conjunto permitido', function () {
    expect(function () {
      listarOcorrenciasQuerySchema.parse({ status: 'resolvido' });
    }).not.toThrow();
  });

  it('rejeita quando dataInicio é depois de dataFim', function () {
    expect(function () {
      listarOcorrenciasQuerySchema.parse({ dataInicio: '2026-02-01', dataFim: '2026-01-01' });
    }).toThrow();
  });

  it('aceita um período válido', function () {
    const resultado = listarOcorrenciasQuerySchema.parse({ dataInicio: '2026-01-01', dataFim: '2026-01-31' });
    expect(resultado.dataInicio).toBeInstanceOf(Date);
    expect(resultado.dataFim).toBeInstanceOf(Date);
  });
});
