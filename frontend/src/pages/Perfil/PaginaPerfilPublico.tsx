import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiAlertTriangle } from 'react-icons/fi';
import { LayoutPadrao } from '../../components/comum/LayoutPadrao';
import { ModalInfo } from '../../components/comum/ModalInfo';
import { CartaoContribuicoes } from '../../components/perfil/CartaoContribuicoes';
import { ModalOcorrencia } from '../../components/ocorrencia/ModalOcorrencia';
import { CORES, FONTES } from '../../theme/cores';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { PerfilPublico } from '@shared/types';

export function PaginaPerfilPublico() {
  const { id } = useParams<{ id: string }>();
  const { autenticado, usuario } = useAuth();
  const navegar = useNavigate();
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocorrenciaAbertaId, setOcorrenciaAbertaId] = useState<number | null>(null);
  const [modalDenunciaAberto, setModalDenunciaAberto] = useState(false);
  const [motivoDenuncia, setMotivoDenuncia] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(
    function () {
      // Perfil próprio tem sua própria página completa (com edição/exclusão)
      if (usuario && String(usuario.id) === id) {
        navegar('/perfil', { replace: true });
        return;
      }

      api
        .get<PerfilPublico>(`/usuarios/${id}/perfil`)
        .then((r) => setPerfil(r.data))
        .catch(() => setErro('Perfil não encontrado ou inativo.'));
    },
    [id, usuario, navegar]
  );

  function enviarDenuncia() {
    if (!autenticado) {
      toast.info('Entre na sua conta para denunciar um perfil.');
      navegar('/entrar');
      return;
    }
    if (!motivoDenuncia.trim()) {
      toast.warn('Descreva o motivo da denúncia.');
      return;
    }
    setEnviando(true);
    api
      .post(`/usuarios/${id}/denunciar`, { motivo: motivoDenuncia })
      .then(() => {
        toast.success('Denúncia enviada. Nossa moderação vai analisar.');
        setModalDenunciaAberto(false);
        setMotivoDenuncia('');
      })
      .catch((erro) => toast.error(erro?.response?.data?.error || 'Não foi possível enviar a denúncia.'))
      .finally(() => setEnviando(false));
  }

  if (erro) {
    return (
      <LayoutPadrao>
        <div style={{ textAlign: 'center', padding: 60, color: CORES.tintaSuave }}>{erro}</div>
      </LayoutPadrao>
    );
  }

  if (!perfil) {
    return (
      <LayoutPadrao>
        <div style={{ textAlign: 'center', padding: 60, color: CORES.tintaSuave }}>Carregando perfil…</div>
      </LayoutPadrao>
    );
  }

  const iniciais = perfil.nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

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
                width: 84, height: 84, borderRadius: '50%', backgroundColor: CORES.laranja,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800,
                marginBottom: 16, border: '3px solid rgba(255,255,255,0.25)',
              }}
            >
              {iniciais}
            </div>
            <h2 style={{ fontFamily: FONTES.titulo, fontSize: 20, margin: 0 }}>{perfil.nome}</h2>
            <p style={{ fontSize: 12, opacity: 0.65, margin: '10px 0 0', fontFamily: FONTES.mono }}>
              Membro desde {new Date(perfil.data_cadastro).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
            </p>
          </div>

          <div style={{ backgroundColor: CORES.card, border: `1px solid ${CORES.linha}`, borderRadius: 20, padding: 28 }}>
            <span style={{ fontFamily: FONTES.mono, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: CORES.laranjaEscuro }}>
              Estatísticas de contribuição
            </span>
            <div style={{ display: 'flex', gap: 20, margin: '16px 0 26px' }}>
              <EstatCaixa valor={perfil._count.ocorrencias} rotulo="Ocorrências" />
              <EstatCaixa valor={perfil._count.confirmacoes} rotulo="Confirmações" />
            </div>

            <button
              onClick={() => setModalDenunciaAberto(true)}
              style={{
                padding: '11px 18px', borderRadius: 10, border: `1.5px solid ${CORES.vermelhoAlerta}`,
                backgroundColor: '#fff', color: CORES.vermelhoAlerta, fontWeight: 700, fontSize: 12.5,
                textTransform: 'uppercase', letterSpacing: 0.6, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <FiAlertTriangle size={13} aria-hidden="true" /> Denunciar perfil
            </button>
          </div>
        </div>

        <CartaoContribuicoes perfil={perfil} aoAbrirOcorrencia={setOcorrenciaAbertaId} />
      </div>

      {modalDenunciaAberto && (
        <ModalInfo titulo="Denunciar perfil" aoFechar={() => setModalDenunciaAberto(false)}>
          <textarea
            value={motivoDenuncia}
            onChange={(e) => setMotivoDenuncia(e.target.value)}
            placeholder="Descreva o comportamento inadequado…"
            rows={4}
            style={{ width: '100%', borderRadius: 10, border: `1.5px solid ${CORES.linha}`, padding: 12, fontSize: 13, fontFamily: FONTES.corpo, resize: 'vertical', marginBottom: 14 }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={() => setModalDenunciaAberto(false)} style={{ padding: '10px 16px', border: 'none', background: 'none', color: CORES.tintaSuave, fontSize: 12.5, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button
              onClick={enviarDenuncia}
              disabled={enviando}
              style={{ padding: '10px 20px', borderRadius: 10, border: 'none', backgroundColor: CORES.vermelhoAlerta, color: '#fff', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
            >
              Enviar denúncia
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
