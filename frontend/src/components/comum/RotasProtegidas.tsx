import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { EsqueletoPagina } from './Esqueleto';

function esqueletoDaRota(caminho: string) {
  if (caminho.startsWith('/perfil')) return <EsqueletoPagina variante="perfil" rotulo="Verificando sua sessão…" />;
  if (caminho.startsWith('/configuracoes')) return <EsqueletoPagina variante="configuracoes" rotulo="Verificando sua sessão…" />;
  return <EsqueletoPagina rotulo="Verificando sua sessão…" />;
}

// Exige login; sem token válido, manda para a tela de entrada.
export function RotaProtegida(props: { children: React.ReactElement }) {
  const { autenticado, carregando } = useAuth();
  const local = useLocation();

  if (carregando) return esqueletoDaRota(local.pathname);
  if (!autenticado) return <Navigate to="/entrar" replace />;
  return props.children;
}

// Exige login E tipo_usuario === 'admin'; usuário comum é mandado pro mapa.
export function RotaAdmin(props: { children: React.ReactElement }) {
  const { autenticado, ehAdmin, carregando } = useAuth();

  if (carregando) return <EsqueletoPagina rotulo="Verificando sua sessão…" />;
  if (!autenticado) return <Navigate to="/entrar" replace />;
  if (!ehAdmin) return <Navigate to="/" replace />;
  return props.children;
}
