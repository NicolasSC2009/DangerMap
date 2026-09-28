import React from 'react';
import { Modal } from './Modal';

interface ModalInfoProps {
  titulo: string;
  aoFechar: () => void;
  children: React.ReactNode;
  largura?: number;
}

// Wrapper fino de <Modal> mantido para compatibilidade (Navbar, perfil público).
export function ModalInfo(props: ModalInfoProps) {
  return (
    <Modal titulo={props.titulo} aoFechar={props.aoFechar} largura={props.largura || 420}>
      <div className="dm-modal-corpo">{props.children}</div>
    </Modal>
  );
}
