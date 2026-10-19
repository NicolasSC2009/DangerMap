import { useEffect, useState } from 'react';

/**
 * Quantas linhas de tabela cabem na tela sem criar rolagem na página.
 * `reservado` é a altura (px) ocupada por tudo que não é linha de tabela.
 */
export function useLinhasPorPagina(reservado: number, alturaLinha = 52, minimo = 5, maximo = 14): number {
  const calcular = () => {
    const disponivel = (typeof window === 'undefined' ? 900 : window.innerHeight) - reservado;
    const linhas = Math.max(minimo, Math.min(maximo, Math.floor(disponivel / alturaLinha)));
    // No celular cada linha vira um cartão alto: poucas por página.
    return typeof window !== 'undefined' && window.innerWidth <= 640 ? Math.min(linhas, 4) : linhas;
  };
  const [linhas, setLinhas] = useState(calcular);

  useEffect(function () {
    function aoRedimensionar() {
      setLinhas(calcular());
    }
    window.addEventListener('resize', aoRedimensionar);
    return () => window.removeEventListener('resize', aoRedimensionar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservado, alturaLinha, minimo, maximo]);

  return linhas;
}