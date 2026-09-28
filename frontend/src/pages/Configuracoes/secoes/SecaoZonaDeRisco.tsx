import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiAlertTriangle } from 'react-icons/fi';
import { ModalExcluirConta } from '../../../components/conta/ModalExcluirConta';
import { useAuth } from '../../../contexts/AuthContext';
import { LinhaConfig, SecaoConfig } from './SecaoConfig';

export function SecaoZonaDeRisco() {
  const { sair } = useAuth();
  const navegar = useNavigate();
  const [modalExcluir, setModalExcluir] = useState(false);

  function sairDaSessao() {
    sair();
    toast.info('Você saiu da sua conta.');
    navegar('/');
  }

  return (
    <SecaoConfig
      id="zona-de-risco"
      icone={FiAlertTriangle}
      titulo="Zona de risco"
      descricao="Ações que encerram seu acesso."
      perigo
    >
      <LinhaConfig
        titulo="Sair desta sessão"
        descricao="Encerra o login neste navegador. Outros dispositivos continuam conectados."
        controle={
          <button type="button" className="dm-btn dm-btn--ghost dm-btn--pequeno" onClick={sairDaSessao}>
            Sair
          </button>
        }
      />

      <div className="dm-caixa-perigo dm-config-perigo">
        <div>
          <strong>Excluir conta.</strong> Sua conta será marcada como inativa e você perderá o acesso imediatamente.
          Suas ocorrências reportadas permanecem no mapa para a comunidade.
        </div>
        <button type="button" className="dm-btn dm-btn--perigo dm-btn--pequeno" onClick={() => setModalExcluir(true)}>
          Excluir conta
        </button>
      </div>

      {modalExcluir && <ModalExcluirConta aoFechar={() => setModalExcluir(false)} />}
    </SecaoConfig>
  );
}
