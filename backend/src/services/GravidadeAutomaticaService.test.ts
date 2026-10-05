import { describe, it, expect } from 'vitest';
import { calcularGravidadeAutomatica } from './GravidadeAutomaticaService.js';

describe('calcularGravidadeAutomatica', function () {
  it('usa a gravidade-base da categoria quando não há descrição', function () {
    expect(calcularGravidadeAutomatica('Foco de Incêndio')).toBe('alto');
    expect(calcularGravidadeAutomatica('Buraco na Via')).toBe('medio');
    expect(calcularGravidadeAutomatica('Sinalização Danificada')).toBe('baixo');
  });

  it('sobe um nível com palavras agravantes', function () {
    expect(calcularGravidadeAutomatica('Buraco na Via', 'Buraco enorme e profundo no meio da pista')).toBe('alto');
    expect(calcularGravidadeAutomatica('Iluminação Pública', 'Poste caído, risco de vida pra criança')).toBe('medio');
  });

  it('desce um nível com palavras atenuantes', function () {
    expect(calcularGravidadeAutomatica('Buraco na Via', 'Buraco pequeno e raso')).toBe('baixo');
  });

  it('não passa de alto nem de baixo', function () {
    expect(calcularGravidadeAutomatica('Vazamento de Gás', 'explosão grave com feridos')).toBe('alto');
    expect(calcularGravidadeAutomatica('Obra na Via', 'obra pequena')).toBe('baixo');
  });

  it('agravante e atenuante juntos se anulam', function () {
    expect(calcularGravidadeAutomatica('Buraco na Via', 'buraco pequeno mas perigoso')).toBe('medio');
  });

  it('categoria nova estima pelo nome e cai em médio por padrão', function () {
    expect(calcularGravidadeAutomatica('Queimada na Mata')).toBe('medio');
    expect(calcularGravidadeAutomatica('Fiação exposta', null, 'risco elétrico')).toBe('alto');
    expect(calcularGravidadeAutomatica('Lixo acumulado')).toBe('baixo');
  });
});
