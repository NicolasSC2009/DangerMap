import React, { useEffect, useState } from 'react';
import { FiBell } from 'react-icons/fi';
import { CORES } from '../../theme/cores';
import { api } from '../../services/api';
import type { Notificacao, RespostaNotificacoes } from '@shared/types';

interface SininhoProps {
  autenticado: boolean;
  aoSelecionarOcorrencia?: (ocorrenciaId: number) => void;
}

export function SininhoNotificacoes(props: SininhoProps) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [aberto, setAberto] = useState<boolean>(false);

  function carregarNotificacoes() {
    if (!props.autenticado) return;

    api
      .get<RespostaNotificacoes>('/notificacoes')
      .then(function (resposta) {
        setNotificacoes(resposta.data.notificacoes || []);
      })
      .catch(function (err) {
        console.error('[ERRO BUSCA NOTIFICACOES]:', err);
      });
  }

  useEffect(
    function () {
      if (!props.autenticado) {
        setNotificacoes([]);
        return;
      }

      carregarNotificacoes();
      // Consulta atualizações a cada 15 segundos (polling)
      const intervalo = setInterval(carregarNotificacoes, 15000);
      return function () {
        clearInterval(intervalo);
      };
    },
    [props.autenticado]
  );

  function alternarMenu() {
    setAberto(!aberto);
  }

  function marcarComoLida(id: number, ocorrenciaId?: number | null) {
    api.patch(`/notificacoes/${id}/ler`).then(function () {
      carregarNotificacoes();
      if (ocorrenciaId && props.aoSelecionarOcorrencia) {
        props.aoSelecionarOcorrencia(ocorrenciaId);
        setAberto(false);
      }
    });
  }

  function marcarTodasLidas() {
    api.patch('/notificacoes/ler-todas').then(function () {
      carregarNotificacoes();
    });
  }

  if (!props.autenticado) {
    return null;
  }

  const naoLidasCount = notificacoes.filter(function (n) {
    return !n.lida;
  }).length;

  return (
    <div style={{ position: 'relative', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <button
        onClick={alternarMenu}
        aria-label="Abrir notificações"
        style={{
          position: 'relative',
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: 'none',
          backgroundColor: `${CORES.verdeGarrafaProfundo}e6`,
          backdropFilter: 'blur(8px)',
          color: CORES.eggshell,
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
          fontSize: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FiBell size={18} aria-hidden="true" />
        {naoLidasCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              backgroundColor: CORES.laranja,
              color: CORES.eggshell,
              borderRadius: '50%',
              minWidth: 16,
              height: 16,
              padding: '0 3px',
              fontSize: 10,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1.5px solid ${CORES.verdeGarrafaProfundo}`,
            }}
          >
            {naoLidasCount}
          </span>
        )}
      </button>

      {aberto && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            marginTop: 10,
            width: 320,
            maxHeight: 400,
            overflowY: 'auto',
            backgroundColor: CORES.eggshell,
            borderRadius: 14,
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            padding: 12,
            color: CORES.verdeGarrafaProfundo,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <strong style={{ fontSize: 13 }}>Notificações</strong>
            {naoLidasCount > 0 && (
              <button
                onClick={marcarTodasLidas}
                style={{ fontSize: 12, background: 'none', border: 'none', color: CORES.laranja, fontWeight: 700, cursor: 'pointer' }}
              >
                Limpar pendências
              </button>
            )}
          </div>

          {notificacoes.length === 0 ? (
            <p style={{ fontSize: 13, color: `${CORES.verdeGarrafaProfundo}99`, textAlign: 'center', padding: '10px 0' }}>
              Nenhuma notificação no momento.
            </p>
          ) : (
            notificacoes.map(function (item) {
              return (
                <div
                  key={item.id}
                  onClick={function () {
                    marcarComoLida(item.id, item.ocorrencia_id);
                  }}
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: item.lida ? `${CORES.verdeGarrafa}0d` : `${CORES.verdeSalada}26`,
                    marginBottom: 8,
                    cursor: 'pointer',
                    borderLeft: item.lida ? '3px solid transparent' : `3px solid ${CORES.laranja}`,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{item.titulo}</div>
                  <div style={{ fontSize: 12, color: `${CORES.verdeGarrafaProfundo}b3`, marginTop: 2 }}>{item.mensagem}</div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
