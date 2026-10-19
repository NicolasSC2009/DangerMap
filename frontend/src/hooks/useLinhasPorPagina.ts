import { useEffect, useState } from 'react';

/**
 * Quantas linhas de tabela cabem na tela sem criar rolagem na página.
 * `reservado` é a altura (px) ocupada por tudo que não é linha de tabela.
 */
export function useLinhasPorPagina(reservado: number, alturaLinha = 52, minimo = 5, maximo = 14): number {
  const calcular = () => {
    const disponivel = (typeof window === 'undefined' ? 900 : window.innerHeight) - reservado;
    return Math.max(minimo, Math.min(maximo, Math.floor(disponivel / alturaLinha)));
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