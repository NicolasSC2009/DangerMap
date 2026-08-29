import React, { useEffect, useState } from 'react';

export interface NotificacaoItem {
  id: number;
  titulo: string;
  mensagem: string;
  tipo_notificacao: string;
  lida: boolean;
  data_criacao: string;
  ocorrencia_id?: number;
}

interface SininhoProps {
  aoSelecionarOcorrencia?: (ocorrenciaId: number) => void;
}

export function SininhoNotificacoes(props: SininhoProps) {
  const [notificacoes, setNotificacoes] = useState<NotificacaoItem[]>([]);
  const [aberto, setAberto] = useState<boolean>(false);

  function carregarNotificacoes() {
    const token = localStorage.getItem('token') || '';

    fetch('/api/notificacoes', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (Array.isArray(data)) {
          setNotificacoes(data);
        }
      })
      .catch(function(err) {
        console.error('[ERRO BUSCA NOTIFICACOES]:', err);
      });
  }

  useEffect(function() {
    carregarNotificacoes();
    // Consulta atualizações a cada 15 segundos (polling)
    const intervalo = setInterval(carregarNotificacoes, 15000);
    return function() { clearInterval(intervalo); };
  }, []);

  function alternarMenu() {
    setAberto(!aberto);
  }

  function marcarComoLida(id: number, ocorrenciaId?: number) {
    const token = localStorage.getItem('token') || '';

    fetch(`/api/notificacoes/${id}/ler`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(function() {
        carregarNotificacoes();
        if (ocorrenciaId && props.aoSelecionarOcorrencia) {
          props.aoSelecionarOcorrencia(ocorrenciaId);
          setAberto(false);
        }
      });
  }

  function marcarTodasLidas() {
    const token = localStorage.getItem('token') || '';

    fetch('/api/notificacoes/ler-todas', {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(function() {
        carregarNotificacoes();
      });
  }

  const naoLidasCount = notificacoes.filter(function(n) { return !n.lida; }).length;

  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000 }}>
      <button 
        onClick={alternarMenu} 
        style={{
          position: 'relative',
          padding: '12px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: '#1e293b',
          color: '#ffffff',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          fontSize: '18px'
        }}
      >
        {naoLidasCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -2,
            right: -2,
            backgroundColor: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            padding: '2px 6px',
            fontSize: '10px',
            fontWeight: 'bold'
          }}>
            {naoLidasCount}
          </span>
        )}
      </button>

      {aberto && (
        <div style={{
          position: 'absolute',
          right: 0,
          marginTop: 10,
          width: 320,
          maxHeight: 400,
          overflowY: 'auto',
          backgroundColor: '#ffffff',
          borderRadius: 8,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          padding: 12,
          color: '#333'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <strong>Notificações</strong>
            {naoLidasCount > 0 && (
              <button 
                onClick={marcarTodasLidas}
                style={{ fontSize: 12, background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}
              >
                Limpar pendências
              </button>
            )}
          </div>

          {notificacoes.length === 0 ? (
            <p style={{ fontSize: 13, color: '#666', textAlign: 'center', padding: '10px 0' }}>
              Nenhuma notificação no momento.
            </p>
          ) : (
            notificacoes.map(function(item) {
              return (
                <div 
                  key={item.id}
                  onClick={function() { marcarComoLida(item.id, item.ocorrencia_id); }}
                  style={{
                    padding: 10,
                    borderRadius: 6,
                    backgroundColor: item.lida ? '#f8fafc' : '#eff6ff',
                    marginBottom: 8,
                    cursor: 'pointer',
                    borderLeft: item.lida ? '3px solid transparent' : '3px solid #2563eb'
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 'bold' }}>{item.titulo}</div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{item.mensagem}</div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}