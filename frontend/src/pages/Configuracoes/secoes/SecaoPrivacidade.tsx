import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiDownload, FiEye, FiEyeOff, FiShield } from 'react-icons/fi';
import { api } from '../../../services/api';
import { lerPreferencias } from '../../../theme/preferencias';
import type { PerfilPublico, RespostaNotificacoes, Usuario } from '@shared/types';
import { LinhaConfig, SecaoConfig } from './SecaoConfig';

// Escolha feita no cartão de permissão do mapa (components/mapa/Mapa.tsx).
const CHAVE_ESCOLHA_LOCALIZACAO = '@DangerMap:escolhaLocalizacao';
const EVENTO_ESCOLHA_LOCALIZACAO = 'dm:escolha-localizacao';

function lerEscolha(): string | null {
  try {
    return localStorage.getItem(CHAVE_ESCOLHA_LOCALIZACAO);
  } catch {
    return null;
  }
}

/** [escolha atual ('concedida' | 'negada' | null), função que apaga a escolha]. */
export function useEscolhaLocalizacao(): [string | null, () => void] {
  const [escolha, setEscolha] = useState<string | null>(lerEscolha);

  useEffect(function () {
    const atualizar = () => setEscolha(lerEscolha());
    window.addEventListener(EVENTO_ESCOLHA_LOCALIZACAO, atualizar);
    window.addEventListener('storage', atualizar);
    return () => {
      window.removeEventListener(EVENTO_ESCOLHA_LOCALIZACAO, atualizar);
      window.removeEventListener('storage', atualizar);
    };
  }, []);

  function esquecer() {
    try {
      localStorage.removeItem(CHAVE_ESCOLHA_LOCALIZACAO);
    } catch {
      // ignora
    }
    window.dispatchEvent(new Event(EVENTO_ESCOLHA_LOCALIZACAO));
  }

  return [escolha, esquecer];
}

type PermissaoNavegador = 'granted' | 'denied' | 'prompt' | 'desconhecida';

function usePermissaoGeolocalizacao(): PermissaoNavegador {
  const [estado, setEstado] = useState<PermissaoNavegador>('desconhecida');
  useEffect(function () {
    let status: PermissionStatus | null = null;
    let ativo = true;
    const atualizar = () => status && ativo && setEstado(status.state as PermissaoNavegador);
    navigator.permissions
      ?.query({ name: 'geolocation' as PermissionName })
      .then((s) => {
        status = s;
        atualizar();
        s.addEventListener('change', atualizar);
      })
      .catch(() => {});
    return () => {
      ativo = false;
      status?.removeEventListener('change', atualizar);
    };
  }, []);
  return estado;
}

const TEXTO_ESCOLHA: Record<string, string> = {
  concedida: 'Você permitiu que o mapa use sua posição.',
  negada: 'Você recusou o uso da sua posição.',
};

export function SecaoPrivacidade(props: { usuarioId: number }) {
  const [escolha, esquecerEscolha] = useEscolhaLocalizacao();
  const permissaoNavegador = usePermissaoGeolocalizacao();
  const [baixando, setBaixando] = useState(false);

  function perguntarNovamente() {
    esquecerEscolha();
    toast.success('Pronto! Na próxima vez que você abrir o mapa, ele vai perguntar sua localização de novo.');
  }

  async function baixarDados() {
    setBaixando(true);
    try {
      const [conta, perfil, notificacoes] = await Promise.all([
        api.get<Usuario>('/usuarios/me').then((r) => r.data),
        api.get<PerfilPublico>(`/usuarios/${props.usuarioId}/perfil`).then((r) => r.data),
        api
          .get<RespostaNotificacoes>('/notificacoes')
          .then((r) => r.data)
          .catch(() => null),
      ]);
      const exportacao = {
        geradoEm: new Date().toISOString(),
        origem: 'DangerMap',
        conta,
        perfil,
        notificacoes: notificacoes?.notificacoes ?? [],
        preferenciasNesteNavegador: lerPreferencias(),
      };
      const blob = new Blob([JSON.stringify(exportacao, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dangermap-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success('Download iniciado.');
    } catch (erro: any) {
      toast.error(erro?.response?.data?.error || 'Não foi possível reunir seus dados agora.');
    } finally {
      setBaixando(false);
    }
  }

  const descricaoLocalizacao =
    permissaoNavegador === 'denied'
      ? 'O navegador está bloqueando a localização deste site. Libere no ícone de cadeado da barra de endereço.'
      : TEXTO_ESCOLHA[escolha || ''] || 'O mapa ainda vai perguntar se pode usar sua posição.';

  return (
    <SecaoConfig
      id="privacidade"
      icone={FiShield}
      titulo="Privacidade"
      descricao="O que os outros veem, permissões e uma cópia dos seus dados."
    >
      <div className="dm-config-visibilidade">
        <div className="dm-config-visibilidade__coluna">
          <div className="dm-config-visibilidade__titulo">
            <FiEye size={14} aria-hidden="true" /> Público
          </div>
          <ul>
            <li>Seu nome e data de cadastro</li>
            <li>Ocorrências que você não marcou como anônimas</li>
            <li>Suas estatísticas de contribuição</li>
          </ul>
        </div>
        <div className="dm-config-visibilidade__coluna">
          <div className="dm-config-visibilidade__titulo">
            <FiEyeOff size={14} aria-hidden="true" /> Privado
          </div>
          <ul>
            <li>Seu e-mail</li>
            <li>A autoria das ocorrências anônimas</li>
            <li>Sua posição no mapa e a foto de perfil (ficam neste navegador)</li>
          </ul>
        </div>
      </div>

      <LinhaConfig
        titulo="Localização"
        descricao={descricaoLocalizacao}
        controle={
          <button
            type="button"
            className="dm-btn dm-btn--ghost dm-btn--pequeno"
            onClick={perguntarNovamente}
            disabled={!escolha}
          >
            Perguntar novamente
          </button>
        }
      />

      <LinhaConfig
        titulo="Baixar meus dados"
        descricao="Um arquivo JSON com sua conta, suas ocorrências, notificações e preferências."
        controle={
          <button
            type="button"
            className="dm-btn dm-btn--ghost dm-btn--pequeno"
            onClick={baixarDados}
            disabled={baixando}
          >
            <FiDownload size={13} aria-hidden="true" />
            {baixando ? 'Preparando…' : 'Baixar JSON'}
          </button>
        }
      />
    </SecaoConfig>
  );
}
