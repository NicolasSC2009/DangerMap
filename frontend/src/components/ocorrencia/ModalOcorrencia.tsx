import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiHeart, FiShare2, FiAlertTriangle, FiX } from 'react-icons/fi';
import { CORES, FONTES } from '../../theme/cores';
import { api } from '../../services/api';
import { obterIconeCategoria } from '../../theme/iconesCategorias';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import type { Ocorrencia } from '@shared/types';

interface ModalOcorrenciaProps {
  ocorrenciaId: number;
  aoFechar: () => void;
  aoMudar?: () => void; // avisa o mapa pra recarregar os clusters depois de uma ação
}

const ROTULO_GRAVIDADE: Record<string, string> = { baixo: 'Baixa', medio: 'Média', alto: 'Alta' };
const ROTULO_STATUS: Record<string, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  resolvido: 'Resolvido',
  arquivado: 'Arquivado',
};

export function ModalOcorrencia(props: ModalOcorrenciaProps) {
  const { autenticado, usuario } = useAuth();
  const navegar = useNavigate();
  const [ocorrencia, setOcorrencia] = useState<Ocorrencia | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [curtido, setCurtido] = useState(false);
  const [totalCurtidas, setTotalCurtidas] = useState(0);
  const [confirmado, setConfirmado] = useState(false);
  const [mostrarFormDenuncia, setMostrarFormDenuncia] = useState(false);
  const [motivoDenuncia, setMotivoDenuncia] = useState('');
  const [enviando, setEnviando] = useState(false);

  function carregar() {
    setCarregando(true);
    api
      .get<Ocorrencia>(`/ocorrencias/${props.ocorrenciaId}`)
      .then(function (resposta) {
        setOcorrencia(resposta.data);
        setTotalCurtidas(resposta.data._count?.interacoes || 0);
      })
      .catch(function () {
        toast.error('Não foi possível carregar esta ocorrência.');
        props.aoFechar();
      })
      .finally(function () {
        setCarregando(false);
      });
  }

  useEffect(
    function () {
      carregar();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [props.ocorrenciaId]
  );

  useEffect(function () {
    function aoPressionarEsc(evento: KeyboardEvent) {
      if (evento.key === 'Escape') props.aoFechar();
    }
    document.addEventListener('keydown', aoPressionarEsc);
    return function () {
      document.removeEventListener('keydown', aoPressionarEsc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ehCriador = Boolean(autenticado && usuario && ocorrencia?.usuario?.id === usuario.id);

  function exigirLogin() {
    toast.info('Você precisa entrar para fazer isso.');
    navegar('/entrar');
  }

  function alternarCurtida() {
    if (!autenticado) return exigirLogin();
    if (ehCriador) return;

    if (curtido) {
      api
        .delete(`/ocorrencias/${props.ocorrenciaId}/curtir`)
        .then(function () {
          setCurtido(false);
          setTotalCurtidas(function (n) { return Math.max(0, n - 1); });
        })
        .catch(function () { toast.error('Não foi possível remover a curtida.'); });
    } else {
      api
        .post(`/ocorrencias/${props.ocorrenciaId}/curtir`)
        .then(function () {
          setCurtido(true);
          setTotalCurtidas(function (n) { return n + 1; });
        })
        .catch(function (erro) {
          if (erro?.response?.data?.error?.includes('já curtiu')) {
            setCurtido(true);
          } else {
            toast.error('Não foi possível curtir agora.');
          }
        });
    }
  }

  function alternarConfirmacao() {
    if (!autenticado) return exigirLogin();
    if (ehCriador) return;

    const chamada = confirmado
      ? api.delete(`/ocorrencias/${props.ocorrenciaId}/confirmar`)
      : api.post(`/ocorrencias/${props.ocorrenciaId}/confirmar`);

    chamada
      .then(function () {
        setConfirmado(!confirmado);
        toast.success(confirmado ? 'Confirmação retirada.' : 'Ocorrência confirmada, obrigado por validar!');
        carregar();
        if (props.aoMudar) props.aoMudar();
      })
      .catch(function (erro) {
        const mensagem: string | undefined = erro?.response?.data?.error;
        if (mensagem?.includes('já confirmou')) {
          setConfirmado(true);
        } else if (mensagem?.includes('não possui uma confirmação')) {
          setConfirmado(false);
        } else {
          toast.error(mensagem || 'Não foi possível confirmar agora.');
        }
      });
  }

  function enviarDenuncia() {
    if (!autenticado) return exigirLogin();
    if (!motivoDenuncia.trim()) {
      toast.warn('Descreva o motivo da denúncia.');
      return;
    }

    setEnviando(true);
    api
      .post(`/ocorrencias/${props.ocorrenciaId}/denunciar`, { motivo: motivoDenuncia })
      .then(function () {
        toast.success('Denúncia enviada. Nossa moderação vai analisar.');
        setMostrarFormDenuncia(false);
        setMotivoDenuncia('');
      })
      .catch(function (erro) {
        toast.error(erro?.response?.data?.error || 'Não foi possível enviar a denúncia.');
      })
      .finally(function () {
        setEnviando(false);
      });
  }

  async function compartilhar() {
    const url = `${window.location.origin}/?ocorrencia=${props.ocorrenciaId}`;
    const dadosCompartilhamento = {
      title: 'DangerMap',
      text: `Veja essa ocorrência reportada no DangerMap: ${ocorrencia?.categorias?.nome || 'Perigo'}`,
      url,
    };

    if (autenticado) {
      api.post(`/ocorrencias/${props.ocorrenciaId}/compartilhar`).catch(function () {});
    }

    if (navigator.share) {
      try {
        await navigator.share(dadosCompartilhamento);
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.info('Link copiado para a área de transferência!');
    }
  }

  return (
    <div
      onClick={props.aoFechar}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 27, 18, 0.55)',
        backdropFilter: 'blur(2px)',
        zIndex: 1400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        className="dm-cantos-decorativos"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          maxHeight: '85vh',
          overflowY: 'auto',
          backgroundColor: CORES.canvas,
          borderRadius: 20,
          boxShadow: '0 40px 90px rgba(0,0,0,0.45)',
          fontFamily: FONTES.corpo,
        }}
      >
        {carregando || !ocorrencia ? (
          <div style={{ padding: 40, textAlign: 'center', color: CORES.tintaSuave }}>Carregando…</div>
        ) : (
          <>
            {ocorrencia.imagem_url && (
              <img
                src={ocorrencia.imagem_url}
                alt=""
                style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: '20px 20px 0 0' }}
              />
            )}

            <div style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img
                    src={obterIconeCategoria(ocorrencia.categorias?.nome)}
                    alt=""
                    style={{ width: 34, height: 34, objectFit: 'contain', flexShrink: 0 }}
                  />
                  <div>
                    <span
                      className="mono"
                      style={{
                        fontFamily: FONTES.mono,
                        fontSize: 10.5,
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                        color: CORES.laranjaEscuro,
                      }}
                    >
                      {ocorrencia.categorias?.nome || 'Ocorrência'}
                    </span>
                    <h2 style={{ fontFamily: FONTES.titulo, fontSize: 21, color: CORES.verdeGarrafa, margin: '4px 0 0' }}>
                      {ROTULO_STATUS[ocorrencia.status]}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={props.aoFechar}
                  aria-label="Fechar"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    border: `1.5px solid ${CORES.linha}`,
                    backgroundColor: '#fff',
                    color: CORES.tintaSuave,
                    cursor: 'pointer',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FiX size={15} aria-hidden="true" />
                </button>
              </div>

              <p style={{ fontSize: 13.5, color: CORES.tinta, lineHeight: 1.5, margin: '14px 0' }}>
                {ocorrencia.descricao || 'Sem descrição informada.'}
              </p>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 20,
                    backgroundColor:
                      ocorrencia.gravidade === 'alto'
                        ? CORES.vermelhoAlertaFundo
                        : ocorrencia.gravidade === 'medio'
                        ? `${CORES.laranja}22`
                        : `${CORES.verdeSalada}26`,
                    color: ocorrencia.gravidade === 'alto' ? CORES.vermelhoAlerta : CORES.laranjaEscuro,
                  }}
                >
                  Gravidade {ROTULO_GRAVIDADE[ocorrencia.gravidade]}
                </span>
                <span style={{ fontSize: 12, color: CORES.tintaSuave, alignSelf: 'center' }}>
                  {new Date(ocorrencia.data_registro).toLocaleDateString('pt-BR')}
                </span>
                {!ocorrencia.anonimo && ocorrencia.usuario && (
                  <span style={{ fontSize: 12, color: CORES.tintaSuave, alignSelf: 'center' }}>
                    por {ocorrencia.usuario.nome}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: ehCriador ? 6 : 14 }}>
                <button
                  onClick={alternarConfirmacao}
                  disabled={ehCriador}
                  title={ehCriador ? 'Você não pode confirmar sua própria ocorrência.' : undefined}
                  style={{
                    flex: 1,
                    padding: '11px 12px',
                    borderRadius: 10,
                    border: 'none',
                    backgroundColor: ehCriador ? CORES.linha : confirmado ? CORES.verdeSalada : CORES.verdeGarrafa,
                    color: ehCriador ? CORES.tintaSuave : '#fff',
                    fontWeight: 700,
                    fontSize: 12.5,
                    cursor: ehCriador ? 'not-allowed' : 'pointer',
                  }}
                >
                  {confirmado ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <FiCheck size={14} aria-hidden="true" /> Confirmado
                    </span>
                  ) : (
                    `Confirmar (${ocorrencia.qtd_confirmacoes})`
                  )}
                </button>
                <button
                  onClick={alternarCurtida}
                  aria-label="Curtir"
                  disabled={ehCriador}
                  title={ehCriador ? 'Você não pode curtir sua própria ocorrência.' : undefined}
                  style={{
                    padding: '11px 16px',
                    borderRadius: 10,
                    border: `1.5px solid ${CORES.linha}`,
                    backgroundColor: ehCriador ? CORES.linha : curtido ? `${CORES.laranja}1a` : '#fff',
                    color: ehCriador ? CORES.tintaSuave : curtido ? CORES.laranjaEscuro : CORES.tinta,
                    fontWeight: 700,
                    fontSize: 12.5,
                    cursor: ehCriador ? 'not-allowed' : 'pointer',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <FiHeart size={14} aria-hidden="true" fill={curtido ? 'currentColor' : 'none'} /> {totalCurtidas}
                  </span>
                </button>
                <button
                  onClick={compartilhar}
                  aria-label="Compartilhar"
                  style={{
                    padding: '11px 16px',
                    borderRadius: 10,
                    border: `1.5px solid ${CORES.linha}`,
                    backgroundColor: '#fff',
                    color: CORES.tinta,
                    fontWeight: 700,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <FiShare2 size={14} aria-hidden="true" />
                </button>
              </div>

              {ehCriador && (
                <p style={{ fontSize: 11.5, color: CORES.tintaSuave, margin: '0 0 14px' }}>
                  Você registrou esta ocorrência, por isso não pode confirmá-la nem curtir - peça pra outra pessoa validar.
                </p>
              )}

              {!mostrarFormDenuncia ? (
                <button
                  onClick={() => setMostrarFormDenuncia(true)}
                  style={{
                    width: '100%',
                    padding: '9px',
                    background: 'none',
                    border: 'none',
                    color: CORES.vermelhoAlerta,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <FiAlertTriangle size={13} aria-hidden="true" /> Denunciar esta ocorrência
                </button>
              ) : (
                <div style={{ backgroundColor: CORES.vermelhoAlertaFundo, borderRadius: 12, padding: 14, marginTop: 4 }}>
                  <textarea
                    value={motivoDenuncia}
                    onChange={(e) => setMotivoDenuncia(e.target.value)}
                    placeholder="Por que você acha que essa ocorrência é falsa ou inadequada?"
                    rows={3}
                    style={{
                      width: '100%',
                      borderRadius: 8,
                      border: `1px solid ${CORES.vermelhoAlerta}55`,
                      padding: 10,
                      fontSize: 13,
                      fontFamily: FONTES.corpo,
                      resize: 'vertical',
                      marginBottom: 8,
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setMostrarFormDenuncia(false)}
                      style={{ padding: '8px 14px', border: 'none', background: 'none', color: CORES.tintaSuave, fontSize: 12.5, cursor: 'pointer' }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={enviarDenuncia}
                      disabled={enviando}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: 'none',
                        backgroundColor: CORES.vermelhoAlerta,
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 12.5,
                        cursor: enviando ? 'default' : 'pointer',
                        opacity: enviando ? 0.7 : 1,
                      }}
                    >
                      Enviar denúncia
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
