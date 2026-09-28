import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';

export interface ModalProps {
  aoFechar: () => void;
  children?: React.ReactNode;
  titulo?: React.ReactNode;
  eyebrow?: React.ReactNode;
  subtitulo?: React.ReactNode;
  /** Largura máxima em px (default 460). Em telas estreitas vira 100% - 32px / bottom-sheet. */
  largura?: number;
  /** Rodapé de ações (botões .dm-btn). Renderizado dentro de .dm-modal-acoes. */
  acoes?: React.ReactNode;
  /** 'eggshell' (padrão, telas PERFIL) ou 'claro' (fundo branco, telas Admin). */
  variante?: 'eggshell' | 'claro';
  /** Empilha acima de outro modal aberto (z-index maior). */
  sobreposto?: boolean;
  /** Desliga o fechamento por ESC/clique fora (ex.: enquanto envia um formulário). */
  bloquearFechamento?: boolean;
  /** Mostra os cantinhos decorativos (default true). */
  cantos?: boolean;
  className?: string;
  ariaLabel?: string;
}

// Pilha de modais abertos: só o do topo reage ao ESC, e o scroll do body só
// é destravado quando o último fechar.
const pilhaModais: symbol[] = [];
let overflowOriginal = '';

export function Modal(props: ModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const idTitulo = useId();
  const aoFecharRef = useRef(props.aoFechar);
  aoFecharRef.current = props.aoFechar;
  const bloquearRef = useRef(props.bloquearFechamento);
  bloquearRef.current = props.bloquearFechamento;

  useEffect(function () {
    const idModal = Symbol('modal');
    if (pilhaModais.length === 0) {
      overflowOriginal = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    pilhaModais.push(idModal);

    const focoAnterior = document.activeElement as HTMLElement | null;
    cardRef.current?.focus({ preventScroll: true });

    function aoPressionarTecla(evento: KeyboardEvent) {
      const estaNoTopo = pilhaModais[pilhaModais.length - 1] === idModal;
      if (evento.key === 'Escape' && estaNoTopo && !bloquearRef.current) {
        evento.stopPropagation();
        aoFecharRef.current();
      }
    }
    document.addEventListener('keydown', aoPressionarTecla);

    return function () {
      document.removeEventListener('keydown', aoPressionarTecla);
      const indice = pilhaModais.indexOf(idModal);
      if (indice >= 0) pilhaModais.splice(indice, 1);
      if (pilhaModais.length === 0) document.body.style.overflow = overflowOriginal;
      if (focoAnterior && typeof focoAnterior.focus === 'function') focoAnterior.focus({ preventScroll: true });
    };
  }, []);

  function aoClicarOverlay(evento: React.MouseEvent<HTMLDivElement>) {
    if (evento.target === evento.currentTarget && !props.bloquearFechamento) props.aoFechar();
  }

  const classesCard = [
    'dm-modal-card',
    props.cantos === false ? '' : 'dm-cantos',
    props.variante === 'claro' ? 'dm-modal-card--claro' : '',
    props.className || '',
  ]
    .filter(Boolean)
    .join(' ');

  const estiloCard = { '--largura': `${props.largura ?? 460}px` } as React.CSSProperties;

  const conteudo = (
    <div
      className={`dm-modal-overlay${props.sobreposto ? ' dm-modal-overlay--alto' : ''}`}
      onMouseDown={aoClicarOverlay}
    >
      <div
        ref={cardRef}
        className={classesCard}
        style={estiloCard}
        role="dialog"
        aria-modal="true"
        aria-labelledby={props.titulo ? idTitulo : undefined}
        aria-label={props.titulo ? undefined : props.ariaLabel}
        tabIndex={-1}
      >
        <button
          type="button"
          className="dm-modal-fechar"
          onClick={props.aoFechar}
          disabled={props.bloquearFechamento}
          aria-label="Fechar"
        >
          <FiX size={16} aria-hidden="true" />
        </button>

        {props.eyebrow && (
          <div className="dm-eyebrow">
            <span className="dm-eyebrow__marca" aria-hidden="true" />
            {props.eyebrow}
          </div>
        )}
        {props.titulo && (
          <h2 id={idTitulo} className="dm-modal-titulo">
            {props.titulo}
          </h2>
        )}
        {props.subtitulo && <p className="dm-modal-subtitulo">{props.subtitulo}</p>}

        {props.children}

        {props.acoes && <div className="dm-modal-acoes">{props.acoes}</div>}
      </div>
    </div>
  );

  return createPortal(conteudo, document.body);
}
