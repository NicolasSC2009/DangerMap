import React, { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import type { UseFormRegisterReturn } from 'react-hook-form';

interface CampoSenhaProps {
  registro: UseFormRegisterReturn;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

export function CampoSenha(props: CampoSenhaProps) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <input
        {...props.registro}
        id={props.id}
        type={visivel ? 'text' : 'password'}
        placeholder={props.placeholder}
        className={props.className}
        style={{ ...props.style, paddingRight: 42, width: '100%' }}
      />
      <button
        type="button"
        onClick={() => setVisivel((v) => !v)}
        aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        tabIndex={-1}
        style={{
          position: 'absolute',
          right: 4,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#8a938d',
          padding: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {visivel ? <FiEyeOff size={16} aria-hidden="true" /> : <FiEye size={16} aria-hidden="true" />}
      </button>
    </div>
  );
}
