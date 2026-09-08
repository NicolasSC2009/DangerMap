import { useCallback, useEffect, useState } from 'react';

// Mesma chave usada em `services/api.ts` para o interceptor de autenticação.
// (O componente antigo `SininhoNotificacoes` usava a chave 'token' — foi
// padronizado para '@DangerMap:token' para não haver dessincronia entre
// "estar logado" e "o token que é realmente enviado nas requisições").
const CHAVE_TOKEN = '@DangerMap:token';

export interface UsuarioLogado {
  nome: string;
  fotoUrl?: string;
}

interface RespostaPerfil {
  nome?: string;
  foto_url?: string;
}

export function useAuth() {
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
    fetch('/api/usuarios/perfil', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Falha ao buscar perfil');
        return res.json();
      })
      .then(function (data: RespostaPerfil) {
        setUsuario({
          nome: data.nome || 'Usuário',
          fotoUrl: data.foto_url,
        });
      })
      .catch(function () {
        // Token presente mas não foi possível carregar o perfil completo:
        // ainda assim tratamos como logado, com um nome genérico.
        setUsuario({ nome: 'Usuário' });
      })
      .finally(function () {
        setCarregando(false);
      });
  }, []);

  useEffect(function () {
    carregarUsuario();
  }, [carregarUsuario]);

  function entrar(token: string) {
    localStorage.setItem(CHAVE_TOKEN, token);
    carregarUsuario();
  }

  function sair() {
    localStorage.removeItem(CHAVE_TOKEN);
    setUsuario(null);
  }

  return {
    usuario,
    autenticado: !!usuario,
    carregando,
    entrar,
    sair,
    recarregar: carregarUsuario,
  };
}
