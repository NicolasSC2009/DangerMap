import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { LayoutPadrao } from '../../components/comum/LayoutPadrao';
import { ModalInfo } from '../../components/comum/ModalInfo';
import { CartaoContribuicoes } from '../../components/perfil/CartaoContribuicoes';
import { ModalOcorrencia } from '../../components/ocorrencia/ModalOcorrencia';
import { CampoSenha } from '../../components/comum/CampoSenha';
import { CORES, FONTES } from '../../theme/cores';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { PerfilPublico, Usuario } from '@shared/types';

interface CamposEdicao {
  nome: string;
  senhaAtual: string;
  novaSenha: string;
}

export function PaginaPerfilProprio() {
  const { usuario, sair, recarregar } = useAuth();
  const navegar = useNavigate();
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);
  const [dadosConta, setDadosConta] = useState<Usuario | null>(null);
  const [ocorrenciaAbertaId, setOcorrenciaAbertaId] = useState<number | null>(null);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [textoConfirmaExclusao, setTextoConfirmaExclusao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const formEdicao = useForm<CamposEdicao>();

  function carregarTudo() {
    if (!usuario) return;
    api.get<Usuario>('/usuarios/me').then((r) => setDadosConta(r.data));
    api.get<PerfilPublico>(`/usuarios/${usuario.id}/perfil`).then((r) => setPerfil(r.data));
  }

  useEffect(carregarTudo, [usuario]);

  async function salvarEdicao(campos: CamposEdicao) {
    setSalvando(true);
    try {
      await api.put('/usuarios/me', {
        nome: campos.nome,
        senhaAtual: campos.senhaAtual || undefined,
        novaSenha: campos.novaSenha || undefined,
      });
      toast.success('Dados atualizados!');
      setModalEditarAberto(false);
      formEdicao.reset();
      recarregar();
      carregarTudo();
    } catch (erro: any) {
      toast.error(erro?.response?.data?.error || 'Não foi possível salvar as alterações.');
    } finally {
      setSalvando(false);
    }
  }

  async function excluirConta() {
    setSalvando(true);
    try {
      await api.delete('/auth/usuarios/excluir');
      toast.success('Conta desativada. Sentiremos sua falta!');
      sair();
      navegar('/');
    } catch {
      toast.error('Não foi possível excluir a conta agora.');
    } finally {
      setSalvando(false);
    }
  }

  if (!usuario || !perfil || !dadosConta) {
    return (
      <LayoutPadrao>
        <div style={{ textAlign: 'center', padding: 60, color: CORES.tintaSuave }}>Carregando perfil…</div>
      </LayoutPadrao>
    );
  }

  const iniciais = usuario.nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

  return (
    <LayoutPadrao>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, marginBottom: 36 }}>
          <div
            style={{
              backgroundColor: CORES.verdeGarrafa,
              borderRadius: 20,
              padding: '36px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              color: '#fff',
            }}
          >
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: '50%',
                backgroundColor: CORES.laranja,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 800,
                marginBottom: 16,
                border: '3px solid rgba(255,255,255,0.25)',
              }}
            >
              {iniciais}
            </div>
            <h2 style={{ fontFamily: FONTES.titulo, fontSize: 20, margin: 0 }}>{usuario.nome}</h2>
            <p style={{ fontSize: 12, opacity: 0.65, margin: '10px 0 0', fontFamily: FONTES.mono }}>
              Membro desde {new Date(perfil.data_cadastro).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
            </p>
          </div>

          <div style={{ backgroundColor: CORES.card, border: `1px solid ${CORES.linha}`, borderRadius: 20, padding: 28 }}>
            <span style={{ fontFamily: FONTES.mono, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: CORES.laranjaEscuro }}>
              Resumo da conta
            </span>

            <div style={{ display: 'flex', gap: 20, margin: '16px 0 26px' }}>
              <EstatCaixa valor={perfil._count.ocorrencias} rotulo="Ocorrências" />
              <EstatCaixa valor={perfil._count.confirmacoes} rotulo="Confirmações" />
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: CORES.tintaSuave, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>
              Dados da conta
            </div>
            <LinhaInfo rotulo="Nome completo" valor={usuario.nome} />
            <LinhaInfo rotulo="E-mail" valor={dadosConta.email} />
            <LinhaInfo rotulo="Tipo de conta" valor={dadosConta.tipo_usuario === 'admin' ? 'Administrador' : 'Cidadão'} />

            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button
                onClick={() => setModalEditarAberto(true)}
                className="dm-botao-primario dm-botao-seta"
                style={{ padding: '11px 18px', borderRadius: 10, backgroundColor: CORES.laranjaEscuro, color: '#fff', fontWeight: 700, fontSize: 12.5, textTransform: 'uppercase', letterSpacing: 0.6 }}
              >
                <span>Editar dados</span>
              </button>
              <button
                onClick={() => setModalExcluirAberto(true)}
                style={{ padding: '11px 18px', borderRadius: 10, border: `1.5px solid ${CORES.vermelhoAlerta}`, backgroundColor: '#fff', color: CORES.vermelhoAlerta, fontWeight: 700, fontSize: 12.5, textTransform: 'uppercase', letterSpacing: 0.6, cursor: 'pointer' }}
              >
                Excluir conta
              </button>
            </div>
          </div>
        </div>

        <CartaoContribuicoes perfil={perfil} aoAbrirOcorrencia={setOcorrenciaAbertaId} />
      </div>

      {modalEditarAberto && (
        <ModalInfo titulo="Editar dados" aoFechar={() => setModalEditarAberto(false)}>
          <form onSubmit={formEdicao.handleSubmit(salvarEdicao)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <CampoForm rotulo="Nome completo">
              <input defaultValue={usuario.nome} style={estiloCampo} {...formEdicao.register('nome', { required: true, minLength: 3 })} />
            </CampoForm>
            <div style={{ borderTop: `1px solid ${CORES.linha}`, paddingTop: 14, fontSize: 11, fontWeight: 700, color: CORES.tintaSuave, textTransform: 'uppercase' }}>
              Redefinir senha (opcional)
            </div>
            <CampoForm rotulo="Senha atual">
              <CampoSenha style={estiloCampo} placeholder="Necessária apenas se for trocar a senha" registro={formEdicao.register('senhaAtual')} />
            </CampoForm>
            <CampoForm rotulo="Nova senha">
              <CampoSenha style={estiloCampo} placeholder="Mín. 8 caracteres, com maiúscula/minúscula/número/especial" registro={formEdicao.register('novaSenha')} />
            </CampoForm>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button type="button" onClick={() => setModalEditarAberto(false)} style={{ padding: '10px 16px', border: 'none', background: 'none', color: CORES.tintaSuave, fontSize: 12.5, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" disabled={salvando} className="dm-botao-primario dm-botao-seta" style={{ padding: '10px 20px', borderRadius: 10, backgroundColor: CORES.laranjaEscuro, color: '#fff', fontWeight: 700, fontSize: 12.5 }}>
                <span>{salvando ? 'Salvando…' : 'Salvar alterações'}</span>
              </button>
            </div>
          </form>
        </ModalInfo>
      )}

      {modalExcluirAberto && (
        <ModalInfo titulo="Excluir conta" aoFechar={() => setModalExcluirAberto(false)}>
          <div style={{ backgroundColor: CORES.vermelhoAlertaFundo, borderRadius: 10, padding: 14, fontSize: 12.5, marginBottom: 16 }}>
            <strong>Atenção:</strong> sua conta será marcada como inativa e você perderá o acesso imediatamente. Suas
            ocorrências reportadas permanecem no mapa para a comunidade.
          </div>
          <label style={{ fontSize: 11, fontWeight: 700, color: CORES.tintaSuave, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Digite EXCLUIR para confirmar
          </label>
          <input
            value={textoConfirmaExclusao}
            onChange={(e) => setTextoConfirmaExclusao(e.target.value)}
            placeholder="EXCLUIR"
            style={estiloCampo}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button onClick={() => setModalExcluirAberto(false)} style={{ padding: '10px 16px', border: 'none', background: 'none', color: CORES.tintaSuave, fontSize: 12.5, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button
              onClick={excluirConta}
              disabled={textoConfirmaExclusao !== 'EXCLUIR' || salvando}
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
        </ModalInfo>
      )}

      {ocorrenciaAbertaId !== null && (
        <ModalOcorrencia ocorrenciaId={ocorrenciaAbertaId} aoFechar={() => setOcorrenciaAbertaId(null)} />
      )}
    </LayoutPadrao>
  );
}

function EstatCaixa(props: { valor: number; rotulo: string }) {
  return (
    <div>
      <div style={{ fontFamily: FONTES.titulo, fontSize: 30, fontWeight: 800, color: CORES.verdeGarrafa, lineHeight: 1 }}>{props.valor}</div>
      <div style={{ fontSize: 11.5, color: CORES.tintaSuave, fontWeight: 600, textTransform: 'uppercase', marginTop: 4 }}>{props.rotulo}</div>
    </div>
  );
}

function LinhaInfo(props: { rotulo: string; valor: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${CORES.linha}`, fontSize: 13 }}>
      <span style={{ color: CORES.tintaSuave }}>{props.rotulo}</span>
      <span style={{ color: CORES.tinta, fontWeight: 600 }}>{props.valor}</span>
    </div>
  );
}

function CampoForm(props: { rotulo: string; children: React.ReactNode }) {
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
  borderLeft: `3px solid ${CORES.linha}`, borderRadius: 10, color: CORES.verdeGarrafa, fontSize: 13.5, outline: 'none',
};
