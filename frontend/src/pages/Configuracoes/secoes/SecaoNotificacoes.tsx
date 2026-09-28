import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiBell } from 'react-icons/fi';
import {
  definirNotificacoesAtivadas,
  dispararNotificacaoNavegador,
  notificacoesAtivadasPeloUsuario,
  solicitarPermissaoNotificacao,
  statusPermissaoNotificacao,
} from '../../../services/notificacoesBrowser';
import { Interruptor, LinhaConfig, SecaoConfig } from './SecaoConfig';

export function SecaoNotificacoes() {
  const [permissao, setPermissao] = useState(statusPermissaoNotificacao());
  const [ativas, setAtivas] = useState(notificacoesAtivadasPeloUsuario());
  const [pedindo, setPedindo] = useState(false);

  // Se o usuário mudar a permissão nas configurações do navegador e voltar à aba.
  useEffect(function () {
    function atualizar() {
      setPermissao(statusPermissaoNotificacao());
      setAtivas(notificacoesAtivadasPeloUsuario());
    }
    window.addEventListener('focus', atualizar);
    return () => window.removeEventListener('focus', atualizar);
  }, []);

  const ligadas = ativas && permissao === 'granted';
  const bloqueadas = permissao === 'denied';

  async function alternar(ligar: boolean) {
    if (ligar) {
      setPedindo(true);
      try {
        const resultado = await solicitarPermissaoNotificacao();
        setPermissao(resultado);
        if (resultado === 'granted') {
          definirNotificacoesAtivadas(true);
          setAtivas(true);
          toast.success('Notificações ativadas!');
        } else if (resultado === 'denied') {
          toast.error(
            'Você bloqueou notificações para este site no navegador. Permita nas configurações do navegador para ativar.'
          );
        }
      } finally {
        setPedindo(false);
      }
    } else {
      definirNotificacoesAtivadas(false);
      setAtivas(false);
      toast.info('Notificações desativadas.');
    }
  }

  function testar() {
    dispararNotificacaoNavegador('DangerMap', 'Tudo certo! É assim que os avisos vão aparecer.');
    toast.info('Notificação de teste enviada. Se não apareceu, confira o modo "Não perturbe" do sistema.');
  }

  let descricao: string;
  if (permissao === 'indisponivel') descricao = 'Seu navegador não suporta notificações.';
  else if (bloqueadas) descricao = 'Bloqueadas nas configurações do navegador.';
  else if (ligadas) descricao = 'Ativadas — avisamos quando algo acontecer com suas ocorrências ou perto de você.';
  else descricao = 'Desativadas. Os avisos continuam no sininho do site.';

  return (
    <SecaoConfig
      id="notificacoes"
      icone={FiBell}
      titulo="Notificações"
      descricao="Avisos do navegador quando algo novo acontecer na sua conta."
    >
      <LinhaConfig
        titulo="Notificações do navegador"
        descricao={descricao}
        controle={
          permissao !== 'indisponivel' && (
            <Interruptor
              rotulo="Notificações do navegador"
              marcado={ligadas}
              desabilitado={pedindo || (bloqueadas && !ligadas)}
              aoMudar={alternar}
            />
          )
        }
      />

      {bloqueadas && (
        <div className="dm-config-aviso" role="note">
          <strong>Como desbloquear:</strong> clique no ícone de cadeado ao lado do endereço do site, procure
          “Notificações” e escolha “Permitir”. Depois volte a esta página.
        </div>
      )}

      {ligadas && (
        <LinhaConfig
          titulo="Testar"
          descricao="Envia uma notificação de exemplo para este dispositivo."
          controle={
            <button type="button" className="dm-btn dm-btn--ghost dm-btn--pequeno" onClick={testar}>
              Testar notificação
            </button>
          }
        />
      )}
    </SecaoConfig>
  );
}
