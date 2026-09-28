import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import type { PerfilPublico, Usuario } from '@shared/types';

export type ErroPerfil = 'nao-autenticado' | 'nao-encontrado' | 'falha';

interface OpcoesPerfil {
  /** Busca GET /usuarios/me (dados privados da conta: e-mail, tipo…). Só para o próprio usuário. */
  conta?: boolean;
  /** Busca GET /usuarios/:id/perfil (estatísticas + histórico). Default true. */
  perfil?: boolean;
}

interface ResultadoPerfil {
  perfil: PerfilPublico | null;
  conta: Usuario | null;
  carregando: boolean;
  erro: ErroPerfil | null;
  recarregar: () => void;
}

function classificarErro(erro: unknown): ErroPerfil {
  const status = (erro as { response?: { status?: number } })?.response?.status;
  if (status === 401 || status === 403) return 'nao-autenticado';
  if (status === 404 || status === 400) return 'nao-encontrado';
  return 'falha';
}

// Carrega juntos o perfil público (GET /usuarios/:id/perfil) e, se pedido,
// os dados privados da conta (GET /usuarios/me). `recarregar` refaz as duas.
export function usePerfil(usuarioId: number | string | null | undefined, opcoes: OpcoesPerfil = {}): ResultadoPerfil {
  const querConta = !!opcoes.conta;
  const querPerfil = opcoes.perfil !== false;
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);
  const [conta, setConta] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<ErroPerfil | null>(null);
  const requisicaoAtual = useRef(0);

  const recarregar = useCallback(
    function () {
      if (usuarioId === null || usuarioId === undefined || usuarioId === '') {
        setCarregando(false);
        return;
      }
      const id = ++requisicaoAtual.current;
      setCarregando(true);
      setErro(null);

      Promise.all([
        querPerfil ? api.get<PerfilPublico>(`/usuarios/${usuarioId}/perfil`).then((r) => r.data) : Promise.resolve(null),
        querConta ? api.get<Usuario>('/usuarios/me').then((r) => r.data) : Promise.resolve(null),
      ])
        .then(function ([dadosPerfil, dadosConta]) {
          if (id !== requisicaoAtual.current) return;
          setPerfil(dadosPerfil);
          setConta(dadosConta);
        })
        .catch(function (e) {
          if (id !== requisicaoAtual.current) return;
          setErro(classificarErro(e));
        })
        .finally(function () {
          if (id === requisicaoAtual.current) setCarregando(false);
        });
    },
    [usuarioId, querConta, querPerfil]
  );

  useEffect(
    function () {
      recarregar();
    },
    [recarregar]
  );

  return { perfil, conta, carregando, erro, recarregar };
}
