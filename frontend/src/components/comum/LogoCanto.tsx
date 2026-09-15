import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo-preto.png';

export function LogoCanto() {
  const navegar = useNavigate();

  return (
    <button
      onClick={() => navegar('/')}
      title="Voltar para o mapa"
      aria-label="Voltar para o mapa"
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 16px',
        borderRadius: 12,
        border: '1px solid rgba(0,0,0,0.07)',
        backgroundColor: '#fff',
        boxShadow: '0 4px 14px rgba(0,0,0,0.16)',
        userSelect: 'none',
        cursor: 'pointer',
      }}
    >
      <img
        src={logo}
        alt="DangerMap"
        style={{ height: 18, width: 'auto', display: 'block' }}
      />
    </button>
  );
}
