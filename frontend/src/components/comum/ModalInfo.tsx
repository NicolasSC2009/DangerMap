import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { CORES, FONTES } from '../../theme/cores';

interface ModalInfoProps {
  titulo: string;
  aoFechar: () => void;
  children: React.ReactNode;
  largura?: number;
}

export function ModalInfo(props: ModalInfoProps) {
  useEffect(function () {
    function aoPressionarEsc(evento: KeyboardEvent) {
      if (evento.key === 'Escape') props.aoFechar();
    }
    document.addEventListener('keydown', aoPressionarEsc);
    return function () {
      document.removeEventListener('keydown', aoPressionarEsc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      onClick={props.aoFechar}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 27, 18, 0.55)',
        backdropFilter: 'blur(2px)',
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        className="dm-cantos-decorativos"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: props.largura || 420,
          maxHeight: '80vh',
          overflowY: 'auto',
          backgroundColor: CORES.canvas,
          borderRadius: 20,
          boxShadow: '0 40px 90px rgba(0,0,0,0.45)',
          fontFamily: FONTES.corpo,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '22px 24px 0',
          }}
        >
          <h2 style={{ fontFamily: FONTES.titulo, fontSize: 20, color: CORES.verdeGarrafa, fontWeight: 800, margin: 0 }}>
            {props.titulo}
          </h2>
          <button
            onClick={props.aoFechar}
            aria-label="Fechar"
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              border: `1.5px solid ${CORES.linha}`,
              backgroundColor: '#fff',
              color: CORES.tintaSuave,
              cursor: 'pointer',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FiX size={15} aria-hidden="true" />
          </button>
        </div>
        <div style={{ padding: '16px 24px 24px', fontSize: 13.5, lineHeight: 1.55, color: CORES.tinta }}>
          {props.children}
        </div>
      </div>
    </div>
  );
}
