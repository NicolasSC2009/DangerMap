import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Categoria } from '@shared/types';

// Categorias ativas (para formulários/filtros). GET /categorias exige
// autenticação no backend - então só busca quando há sessão, evitando um
// 401 desnecessário (e ruidoso no console) toda vez que um visitante não
// logado carrega uma página com a Navbar.
export function useCategorias(autenticado: boolean) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregando, setCarregando] = useState(autenticado);

  useEffect(
    function () {
      if (!autenticado) {
        setCategorias([]);
        setCarregando(false);
        return;
      }

      setCarregando(true);
      api
        .get<Categoria[]>('/categorias')
        .then(function (resposta) {
          setCategorias(resposta.data);
        })
        .catch(function (erro) {
          console.error('[ERRO AO BUSCAR CATEGORIAS]:', erro);
        })
        .finally(function () {
          setCarregando(false);
        });
    },
    [autenticado]
  );

  return { categorias, carregando };
}
