import React, { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import type { UseFormRegisterReturn } from 'react-hook-form';
import './campoSenha.css';

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
    <div className="dm-campo-senha">
      <input
        {...props.registro}
        id={props.id}
        type={visivel ? 'text' : 'password'}
        placeholder={props.placeholder}
        className={props.className}
        // estilo legado vindo de quem chama: garante espaço para o botão do olho
        style={props.style ? { ...props.style, paddingRight: 46, width: '100%' } : undefined}
      />
      <button
        type="button"
        className="dm-campo-senha__alternar"
        onClick={() => setVisivel((v) => !v)}
        aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visivel}
        tabIndex={-1}
      >
        {visivel ? <FiEyeOff size={16} aria-hidden="true" /> : <FiEye size={16} aria-hidden="true" />}
      </button>
    </div>
  );
}
