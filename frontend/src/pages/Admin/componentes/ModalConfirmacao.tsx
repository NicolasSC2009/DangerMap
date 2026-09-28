import React from 'react';
import { Modal } from '../../../components/comum/Modal';

interface ModalConfirmacaoProps {
  titulo: string;
  mensagem: React.ReactNode;
  rotuloConfirmar: string;
  perigo?: boolean;
  processando?: boolean;
  aoConfirmar: () => void;
  aoFechar: () => void;
}

// Confirmação para ações de moderação irreversíveis ou sensíveis.
export function ModalConfirmacao(props: ModalConfirmacaoProps) {
  return (
    <Modal
      variante="claro"
      largura={440}
      eyebrow="Confirmar ação"
      titulo={props.titulo}
      aoFechar={props.aoFechar}
      bloquearFechamento={props.processando}
      acoes={
        <>
          <button type="button" className="dm-btn dm-btn--ghost" onClick={props.aoFechar} disabled={props.processando}>
            Cancelar
          </button>
          <button
            type="button"
            className={`dm-btn ${props.perigo ? 'dm-btn--perigo-solido' : 'dm-btn--primario'}`}
            onClick={props.aoConfirmar}
            disabled={props.processando}
          >
            {props.processando ? 'Processando…' : props.rotuloConfirmar}
          </button>
        </>
      }
    >
      <div className={props.perigo ? 'dm-caixa-perigo' : 'dm-modal-corpo'}>{props.mensagem}</div>
    </Modal>
  );
}
