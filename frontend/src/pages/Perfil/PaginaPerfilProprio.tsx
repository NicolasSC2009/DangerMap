import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSettings } from 'react-icons/fi';
import { LayoutPadrao } from '../../components/comum/LayoutPadrao';
import { CartaoContribuicoes } from '../../components/perfil/CartaoContribuicoes';
import { ModalOcorrencia } from '../../components/ocorrencia/ModalOcorrencia';
import { CORES, FONTES } from '../../theme/cores';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { PerfilPublico, Usuario } from '@shared/types';

export function PaginaPerfilProprio() {
  const { usuario } = useAuth();
  const navegar = useNavigate();
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);
  const [dadosConta, setDadosConta] = useState<Usuario | null>(null);
  const [ocorrenciaAbertaId, setOcorrenciaAbertaId] = useState<number | null>(null);

  function carregarTudo() {
    if (!usuario) return;
    api.get<Usuario>('/usuarios/me').then((r) => setDadosConta(r.data));
    api.get<PerfilPublico>(`/usuarios/${usuario.id}/perfil`).then((r) => setPerfil(r.data));
  }

  useEffect(carregarTudo, [usuario]);

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
      <div className="dm-container-pagina">
        <div className="dm-grid-perfil">
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

            <div style={{ marginTop: 22 }}>
              <button
                onClick={() => navegar('/configuracoes')}
                className="dm-botao-primario dm-botao-seta"
                style={{ padding: '11px 18px', borderRadius: 10, backgroundColor: CORES.laranjaEscuro, color: '#fff', fontWeight: 700, fontSize: 12.5, textTransform: 'uppercase', letterSpacing: 0.6, display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <FiSettings size={14} aria-hidden="true" />
                <span>Ir para configurações</span>
              </button>
            </div>
          </div>
        </div>

        <CartaoContribuicoes perfil={perfil} aoAbrirOcorrencia={setOcorrenciaAbertaId} />
      </div>

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
