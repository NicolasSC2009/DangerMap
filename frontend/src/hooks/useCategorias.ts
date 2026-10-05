import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Categoria } from '@shared/types';

// Categorias ativas, com a gravidade típica de cada uma. A lista é pública,
// então funciona também para quem ainda não entrou na conta.
export function useCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(function () {
    let ativo = true;
    api
      .get<Categoria[]>('/categorias')
      .then(function (resposta) {
        if (ativo) setCategorias(resposta.data);
      })
      .catch(function (e) {
        console.error('[ERRO AO BUSCAR CATEGORIAS]:', e);
        if (ativo) setErro(true);
      })
      .finally(function () {
        if (ativo) setCarregando(false);
      });
    return function () {
      ativo = false;
    };
  }, []);

  return { categorias, carregando, erro };
}