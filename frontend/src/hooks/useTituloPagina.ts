import { useEffect } from 'react';

/** Define o título da aba do navegador enquanto a tela está aberta. */
export function useTituloPagina(titulo: string | null | undefined) {
  useEffect(
    function () {
      if (titulo) document.title = titulo;
    },
    [titulo]
  );
}