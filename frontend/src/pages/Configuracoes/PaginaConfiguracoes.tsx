import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { FiMapPin, FiBell, FiUser, FiAlertTriangle, FiShield } from 'react-icons/fi';
import { LayoutPadrao } from '../../components/comum/LayoutPadrao';
import { CampoSenha } from '../../components/comum/CampoSenha';
import { CORES, FONTES } from '../../theme/cores';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  statusPermissaoNotificacao,
  solicitarPermissaoNotificacao,
  notificacoesAtivadasPeloUsuario,
  definirNotificacoesAtivadas,
} from '../../services/notificacoesBrowser';
import type { Usuario } from '@shared/types';

interface CamposEdicao {
  nome: string;
  senhaAtual: string;
  novaSenha: string;
}

const CHAVE_ESCOLHA_LOCALIZACAO = '@DangerMap:escolhaLocalizacao';

type Aba = 'conta' | 'privacidade';

const ABAS: Array<{ chave: Aba; rotulo: string; Icone: React.ComponentType<{ size?: number }> }> = [
  { chave: 'conta', rotulo: 'Conta', Icone: FiUser },
  { chave: 'privacidade', rotulo: 'Privacidade e permissões', Icone: FiShield },
];

export function PaginaConfiguracoes() {
  const { usuario, sair, recarregar } = useAuth();
  const navegar = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState<Aba>('conta');
  const [dadosConta, setDadosConta] = useState<Usuario | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [textoConfirmaExclusao, setTextoConfirmaExclusao] = useState('');
  const [excluindo, setExcluindo] = useState(false);

  const [escolhaLocalizacao, setEscolhaLocalizacao] = useState(() => localStorage.getItem(CHAVE_ESCOLHA_LOCALIZACAO));
  const [permissaoNotificacao, setPermissaoNotificacao] = useState(statusPermissaoNotificacao());
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(notificacoesAtivadasPeloUsuario());

  const formEdicao = useForm<CamposEdicao>();

  useEffect(function () {
    api.get<Usuario>('/usuarios/me').then(function (resposta) {
      setDadosConta(resposta.data);
      formEdicao.reset({ nome: resposta.data.nome, senhaAtual: '', novaSenha: '' });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function salvarEdicao(campos: CamposEdicao) {
    setSalvando(true);
    try {
      await api.put('/usuarios/me', {
        nome: campos.nome,
        senhaAtual: campos.senhaAtual || undefined,
        novaSenha: campos.novaSenha || undefined,
      });
      toast.success('Dados atualizados!');
      formEdicao.setValue('senhaAtual', '');
      formEdicao.setValue('novaSenha', '');
      recarregar();
    } catch (erro: any) {
      toast.error(erro?.response?.data?.error || 'Não foi possível salvar as alterações.');
    } finally {
      setSalvando(false);
    }
  }

  async function excluirConta() {
    setExcluindo(true);
    try {
      await api.delete('/auth/usuarios/excluir');
      toast.success('Conta desativada. Sentiremos sua falta!');
      sair();
      navegar('/');
    } catch {
      toast.error('Não foi possível excluir a conta agora.');
    } finally {
      setExcluindo(false);
    }
  }

  function permitirLocalizacaoNovamente() {
    localStorage.removeItem(CHAVE_ESCOLHA_LOCALIZACAO);
    setEscolhaLocalizacao(null);
    toast.success('Pronto! Na próxima vez que você abrir o mapa, ele vai perguntar sua localização de novo.');
  }

  async function alternarNotificacoes() {
    if (!notificacoesAtivas) {
      const resultado = await solicitarPermissaoNotificacao();
      setPermissaoNotificacao(resultado);
      if (resultado === 'granted') {
        setNotificacoesAtivas(true);
        toast.success('Notificações ativadas!');
      } else if (resultado === 'denied') {
        toast.error('Você bloqueou notificações para este site no navegador. Permita nas configurações do navegador para ativar.');
      }
    } else {
      definirNotificacoesAtivadas(false);
      setNotificacoesAtivas(false);
      toast.info('Notificações desativadas.');
    }
  }

  if (!usuario || !dadosConta) {
    return (
      <LayoutPadrao>
        <div style={{ textAlign: 'center', padding: 60, color: CORES.tintaSuave }}>Carregando…</div>
      </LayoutPadrao>
    );
  }

  return (
    <LayoutPadrao>
      <div className="dm-container-pagina" style={{ maxWidth: 900 }}>
        <span style={{ fontFamily: FONTES.mono, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: CORES.laranjaEscuro }}>
          Configurações
        </span>
        <h1 style={{ fontFamily: FONTES.titulo, fontSize: 28, color: CORES.tinta, margin: '8px 0 30px' }}>
          Preferências e conta
        </h1>

        <div className="dm-config-layout">
          <nav className="dm-config-nav">
            {ABAS.map((aba) => (
              <button
                key={aba.chave}
                onClick={() => setAbaAtiva(aba.chave)}
                className="dm-config-nav-item"
                style={{
                  backgroundColor: abaAtiva === aba.chave ? CORES.eggshellMuted : 'transparent',
                  color: abaAtiva === aba.chave ? CORES.tinta : CORES.tintaSuave,
                  fontWeight: abaAtiva === aba.chave ? 700 : 500,
                }}
              >
                <aba.Icone size={16} />
                <span>{aba.rotulo}</span>
              </button>
            ))}
          </nav>

          <div>
            {abaAtiva === 'conta' && (
              <Secao icone={FiUser} titulo="Conta" descricao="Seu nome e senha de acesso.">
                <form onSubmit={formEdicao.handleSubmit(salvarEdicao)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Campo rotulo="Nome completo">
                    <input style={estiloCampo} {...formEdicao.register('nome', { required: true, minLength: 3 })} />
                  </Campo>
                  <Campo rotulo="E-mail">
                    <input style={{ ...estiloCampo, color: CORES.tintaSuave }} value={dadosConta.email} disabled />
                  </Campo>
                  <div style={{ borderTop: `1px solid ${CORES.linha}`, paddingTop: 16, fontSize: 11, fontWeight: 700, color: CORES.tintaSuave, textTransform: 'uppercase' }}>
                    Redefinir senha (opcional)
                  </div>
                  <Campo rotulo="Senha atual">
                    <CampoSenha style={estiloCampo} placeholder="Só se for trocar a senha" registro={formEdicao.register('senhaAtual')} />
                  </Campo>
                  <Campo rotulo="Nova senha">
                    <CampoSenha style={estiloCampo} placeholder="Nova senha" registro={formEdicao.register('novaSenha')} />
                  </Campo>
                  <div>
                    <button type="submit" disabled={salvando} className="dm-botao-primario dm-botao-seta" style={estiloBotaoPrimario}>
                      <span>{salvando ? 'Salvando…' : 'Salvar alterações'}</span>
                    </button>
                  </div>
                </form>
              </Secao>
            )}

            {abaAtiva === 'privacidade' && (
              <>
                <Secao icone={FiMapPin} titulo="Localização" descricao="Controla se o mapa pode usar sua posição atual.">
                  <LinhaInterruptor
                    ativo={escolhaLocalizacao === 'concedida'}
                    rotulo={escolhaLocalizacao === 'concedida' ? 'Permissão concedida' : escolhaLocalizacao === 'negada' ? 'Você recusou anteriormente' : 'Ainda não perguntado'}
                    somenteLeitura
                  />
                  <button onClick={permitirLocalizacaoNovamente} className="dm-botao-primario dm-botao-seta" style={{ ...estiloBotaoPrimario, marginTop: 14 }}>
                    <span>Perguntar minha localização novamente</span>
                  </button>
                </Secao>

                <Secao icone={FiBell} titulo="Notificações" descricao="Avisos do navegador quando algo novo acontecer na sua conta.">
                  {permissaoNotificacao === 'indisponivel' ? (
                    <p style={{ fontSize: 13, color: CORES.tintaSuave }}>Seu navegador não suporta notificações.</p>
                  ) : (
                    <LinhaInterruptor
                      ativo={notificacoesAtivas}
                      rotulo={notificacoesAtivas ? 'Ativadas' : permissaoNotificacao === 'denied' ? 'Bloqueadas nas configurações do navegador' : 'Desativadas'}
                      onAlternar={alternarNotificacoes}
                      desabilitado={permissaoNotificacao === 'denied' && !notificacoesAtivas}
                    />
                  )}
                </Secao>

                <Secao icone={FiAlertTriangle} titulo="Zona de risco" descricao="Ações permanentes na sua conta." perigo>
                  <p style={{ fontSize: 12.5, color: CORES.tintaSuave, marginBottom: 14, lineHeight: 1.5 }}>
                    Sua conta será marcada como inativa e você perderá o acesso imediatamente. Suas ocorrências reportadas
                    permanecem no mapa para a comunidade.
                  </p>
                  <button
                    onClick={() => setModalExcluirAberto(true)}
                    style={{ padding: '11px 18px', borderRadius: 10, border: `1.5px solid ${CORES.vermelhoAlerta}`, backgroundColor: '#fff', color: CORES.vermelhoAlerta, fontWeight: 700, fontSize: 12.5, textTransform: 'uppercase', letterSpacing: 0.6, cursor: 'pointer' }}
                  >
                    Excluir conta
                  </button>
                </Secao>
              </>
            )}
          </div>
        </div>
      </div>

      {modalExcluirAberto && (
        <div
          onClick={() => setModalExcluirAberto(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="dm-cantos-decorativos"
            style={{ width: '100%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 20, padding: 26, boxShadow: '0 40px 90px rgba(0,0,0,0.45)' }}
          >
            <h2 style={{ fontSize: 20, color: CORES.tinta, fontWeight: 800, marginBottom: 14 }}>Excluir conta</h2>
            <label style={{ fontSize: 11, fontWeight: 700, color: CORES.tintaSuave, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              Digite EXCLUIR para confirmar
            </label>
            <input
              value={textoConfirmaExclusao}
              onChange={(e) => setTextoConfirmaExclusao(e.target.value)}
              placeholder="EXCLUIR"
              style={estiloCampo}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button onClick={() => setModalExcluirAberto(false)} style={{ padding: '10px 16px', border: 'none', background: 'none', color: CORES.tintaSuave, fontSize: 12.5, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button
                onClick={excluirConta}
                disabled={textoConfirmaExclusao !== 'EXCLUIR' || excluindo}
                style={{
                  padding: '10px 20px', borderRadius: 10, border: 'none',
                  backgroundColor: textoConfirmaExclusao === 'EXCLUIR' ? CORES.vermelhoAlerta : `${CORES.vermelhoAlerta}55`,
                  color: '#fff', fontWeight: 700, fontSize: 12.5,
                  cursor: textoConfirmaExclusao === 'EXCLUIR' ? 'pointer' : 'default',
                }}
              >
                Excluir minha conta
              </button>
            </div>
          </div>
        </div>
      )}
    </LayoutPadrao>
  );
}

function Secao(props: { icone: React.ComponentType<{ size?: number }>; titulo: string; descricao: string; perigo?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: CORES.card, border: `1px solid ${props.perigo ? CORES.vermelhoAlerta + '55' : CORES.linha}`, borderRadius: 18, padding: 24, marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <props.icone size={17} />
        <h2 style={{ fontFamily: FONTES.titulo, fontSize: 16, fontWeight: 700, color: CORES.tinta, margin: 0 }}>{props.titulo}</h2>
      </div>
      <p style={{ fontSize: 12.5, color: CORES.tintaSuave, margin: '0 0 18px' }}>{props.descricao}</p>
      {props.children}
    </div>
  );
}

function LinhaInterruptor(props: { ativo: boolean; rotulo: string; onAlternar?: () => void; desabilitado?: boolean; somenteLeitura?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: CORES.tinta }}>{props.rotulo}</span>
      {!props.somenteLeitura && (
        <button
          onClick={props.onAlternar}
          disabled={props.desabilitado}
          aria-label={props.ativo ? 'Desativar' : 'Ativar'}
          aria-pressed={props.ativo}
          style={{
            width: 44,
            height: 26,
            borderRadius: 999,
            border: 'none',
            padding: 3,
            backgroundColor: props.ativo ? CORES.laranjaEscuro : CORES.linha,
            cursor: props.desabilitado ? 'default' : 'pointer',
            opacity: props.desabilitado ? 0.5 : 1,
            display: 'flex',
            justifyContent: props.ativo ? 'flex-end' : 'flex-start',
            transition: 'background-color 0.2s ease',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>
      )}
    </div>
  );
}

function Campo(props: { rotulo: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontFamily: FONTES.mono, fontSize: 10.5, fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase', color: CORES.tintaSuave, display: 'block', marginBottom: 7 }}>
        {props.rotulo}
      </label>
      {props.children}
    </div>
  );
}

const estiloCampo: React.CSSProperties = {
  width: '100%', padding: '11px 13px', backgroundColor: '#fff', border: `1.5px solid ${CORES.linha}`,
  borderLeft: `3px solid ${CORES.linha}`, borderRadius: 10, color: CORES.tinta, fontSize: 13.5, outline: 'none',
};

const estiloBotaoPrimario: React.CSSProperties = {
  padding: '11px 18px', borderRadius: 10, backgroundColor: CORES.laranjaEscuro, color: '#fff',
  fontWeight: 700, fontSize: 12.5, textTransform: 'uppercase', letterSpacing: 0.6,
};
