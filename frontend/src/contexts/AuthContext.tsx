import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, CHAVE_TOKEN } from '../services/api';
import type { Usuario } from '@shared/types';

export interface UsuarioLogado {
  id: number;
  nome: string;
  email: string;
  tipoUsuario: 'usuario' | 'admin';
}

interface AuthContextValor {
  usuario: UsuarioLogado | null;
  autenticado: boolean;
  ehAdmin: boolean;
  carregando: boolean;
  entrar: (token: string) => void;
  sair: () => void;
  recarregar: () => void;
}

const AuthContext = createContext<AuthContextValor | null>(null);

// Contexto único de autenticação - sem isso, cada componente que precisasse
// saber "quem está logado" (Navbar, páginas de perfil, rotas protegidas...)
// chamaria seu próprio GET /usuarios/me de forma independente, duplicando
// requisições sempre que mais de um aparece na mesma tela.
export function AuthProvider(props: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [carregando, setCarregando] = useState<boolean>(true);

  const carregarUsuario = useCallback(function () {
    const token = localStorage.getItem(CHAVE_TOKEN);

    if (!token) {
      setUsuario(null);
      setCarregando(false);
      return;
    }

    setCarregando(true);
    api
      .get<Usuario>('/usuarios/me')
      .then(function (resposta) {
        const dados = resposta.data;
        setUsuario({ id: dados.id, nome: dados.nome, email: dados.email, tipoUsuario: dados.tipo_usuario });
      })
      .catch(function () {
        localStorage.removeItem(CHAVE_TOKEN);
        setUsuario(null);
      })
      .finally(function () {
        setCarregando(false);
      });
  }, []);

  useEffect(
    function () {
      carregarUsuario();
    },
    [carregarUsuario]
  );

  function entrar(token: string) {
    localStorage.setItem(CHAVE_TOKEN, token);
    carregarUsuario();
  }

  function sair() {
    api.post('/auth/logout').catch(function () {});
    localStorage.removeItem(CHAVE_TOKEN);
    setUsuario(null);
  }

  const valor: AuthContextValor = {
    usuario,
    autenticado: !!usuario,
    ehAdmin: usuario?.tipoUsuario === 'admin',
    carregando,
    entrar,
    sair,
    recarregar: carregarUsuario,
  };

  return <AuthContext.Provider value={valor}>{props.children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValor {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth precisa ser usado dentro de um <AuthProvider>.');
  }
  return contexto;
}
