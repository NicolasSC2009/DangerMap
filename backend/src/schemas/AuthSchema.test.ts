import { describe, it, expect } from 'vitest';
import { cadastroSchema } from './AuthSchema.js';

const dadosValidos = {
  nome: 'Fulano de Tal',
  email: 'fulano@exemplo.com',
  senha: 'SenhaForte@123',
};

describe('cadastroSchema', function () {
  it('aceita dados válidos', function () {
    expect(function () {
      cadastroSchema.parse(dadosValidos);
    }).not.toThrow();
  });

  it('rejeita nome com menos de 3 caracteres', function () {
    expect(function () {
      cadastroSchema.parse({ ...dadosValidos, nome: 'Ab' });
    }).toThrow();
  });

  it('rejeita e-mail com formato inválido', function () {
    expect(function () {
      cadastroSchema.parse({ ...dadosValidos, email: 'nao-e-um-email' });
    }).toThrow();
  });

  it('RNF-04 - rejeita senha sem letra maiúscula', function () {
    expect(function () {
      cadastroSchema.parse({ ...dadosValidos, senha: 'senhafraca@123' });
    }).toThrow();
  });

  it('rejeita senha sem caractere especial', function () {
    expect(function () {
      cadastroSchema.parse({ ...dadosValidos, senha: 'SenhaForte123' });
    }).toThrow();
  });

  it('rejeita senha sem número', function () {
    expect(function () {
      cadastroSchema.parse({ ...dadosValidos, senha: 'SenhaForte@abc' });
    }).toThrow();
  });

  it('rejeita senha com menos de 8 caracteres', function () {
    expect(function () {
      cadastroSchema.parse({ ...dadosValidos, senha: 'Sf@1' });
    }).toThrow();
  });
});
