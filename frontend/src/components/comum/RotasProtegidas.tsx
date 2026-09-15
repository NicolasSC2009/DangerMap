import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Exige login; sem token válido, manda para a tela de entrada.
export function RotaProtegida(props: { children: React.ReactElement }) {
  const { autenticado, carregando } = useAuth();

  if (carregando) return null;
  if (!autenticado) return <Navigate to="/entrar" replace />;
  return props.children;
}

// Exige login E tipo_usuario === 'admin'; usuário comum é mandado pro mapa.
export function RotaAdmin(props: { children: React.ReactElement }) {
  const { autenticado, ehAdmin, carregando } = useAuth();

  if (carregando) return null;
  if (!autenticado) return <Navigate to="/entrar" replace />;
  if (!ehAdmin) return <Navigate to="/" replace />;
  return props.children;
}
