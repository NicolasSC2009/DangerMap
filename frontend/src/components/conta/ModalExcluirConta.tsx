import React, { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Modal } from '../comum/Modal';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './conta.css';

const PALAVRA_CONFIRMACAO = 'EXCLUIR';

// Exclusão (inativação) da conta: DELETE /auth/usuarios/excluir → sair() → mapa.
export function ModalExcluirConta(props: { aoFechar: () => void }) {
  const { sair } = useAuth();
  const navegar = useNavigate();
  const [texto, setTexto] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const idCampo = useId();
  const campoRef = useRef<HTMLInputElement>(null);

  useEffect(function () {
    if (!window.matchMedia?.('(pointer: fine)').matches) return;
    const t = window.setTimeout(() => campoRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, []);

  const confirmado = texto.trim().toUpperCase() === PALAVRA_CONFIRMACAO;

  async function excluir(evento: React.FormEvent) {
    evento.preventDefault();
    if (!confirmado || excluindo) return;
    setExcluindo(true);
    try {
      await api.delete('/auth/usuarios/excluir');
      toast.success('Conta desativada. Sentiremos sua falta no mapa!');
      sair();
      navegar('/');
    } catch (erro: any) {
      toast.error(erro?.response?.data?.error || 'Não foi possível excluir a conta agora.');
      setExcluindo(false);
    }
  }

  return (
    <Modal
      eyebrow="Zona de risco"
      titulo="Excluir conta"
      subtitulo="Essa ação inativa sua conta no DangerMap."
      aoFechar={props.aoFechar}
      bloquearFechamento={excluindo}
    >
      <div className="dm-caixa-perigo dm-conta-perigo">
        <strong>Atenção:</strong> sua conta será marcada como inativa e você perderá o acesso imediatamente. Suas
        ocorrências reportadas permanecem no mapa para a comunidade.
      </div>

      <form className="dm-conta-form" onSubmit={excluir}>
        <div className="dm-campo-grupo">
          <label className="dm-rotulo" htmlFor={idCampo}>
            Digite {PALAVRA_CONFIRMACAO} para confirmar
          </label>
          <input
            ref={campoRef}
            id={idCampo}
            className="dm-campo"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={PALAVRA_CONFIRMACAO}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
          />
        </div>

        <div className="dm-modal-acoes">
          <button type="button" className="dm-btn dm-btn--ghost" onClick={props.aoFechar} disabled={excluindo}>
            <span>Cancelar</span>
          </button>
          <button type="submit" className="dm-btn dm-btn--perigo-solido" disabled={!confirmado || excluindo}>
            <span>{excluindo ? 'Excluindo…' : 'Excluir minha conta'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
