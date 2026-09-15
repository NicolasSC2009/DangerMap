import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Navbar } from '../navbar/Navbar';
import { LogoCanto } from './LogoCanto';
import { CORES, FONTES } from '../../theme/cores';

interface LayoutPadraoProps {
  children: React.ReactNode;
}

export function LayoutPadrao(props: LayoutPadraoProps) {
  const navegar = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: CORES.canvas,
        fontFamily: FONTES.corpo,
        paddingTop: 84,
      }}
    >
      <Navbar />
      <LogoCanto />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px' }}>
        <button
          onClick={() => navegar('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            marginBottom: 18,
            padding: '8px 4px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: CORES.tintaSuave,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <FiArrowLeft size={14} aria-hidden="true" /> Voltar para o mapa
        </button>
      </div>

      {props.children}
    </div>
  );
}
