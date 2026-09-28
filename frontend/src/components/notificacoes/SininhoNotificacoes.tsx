import { useEffect, useRef, useState } from 'react';
import { FiBell, FiX, FiMapPin, FiCheckCircle, FiCheck, FiShield, FiInfo, FiEye } from 'react-icons/fi';
import type { IconType } from 'react-icons';
import './notificacoes.css';
import { api } from '../../services/api';
import { dispararNotificacaoNavegador } from '../../services/notificacoesBrowser';
import { ROTULO_TIPO_NOTIFICACAO } from '../../theme/rotulos';
import type { Notificacao, RespostaNotificacoes, TipoNotificacao } from '@shared/types';

interface SininhoProps {
  autenticado: boolean;
  aoSelecionarOcorrencia?: (ocorrenciaId: number) => void;
  /** Estado controlado pela Navbar (só um painel aberto por vez). */
  aberto: boolean;
  aoAlternar: () => void;
  aoFechar: () => void;
}

const ICONE_TIPO: Record<TipoNotificacao, IconType> = {
  proximidade: FiMapPin,
  validacao_campo: FiEye,
  confirmacao: FiCheck,
  resolucao: FiCheckCircle,
  sistema: FiInfo,
  moderacao: FiShield,
};

// "agora", "há 5 min", "há 3 h", "há 2 dias", ou a data.
function tempoRelativo(dataIso: string): string {
  const data = new Date(dataIso);
  const segundos = Math.round((Date.now() - data.getTime()) / 1000);
  if (Number.isNaN(segundos)) return '';
  if (segundos < 60) return 'agora';
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 7) return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
  return data.toLocaleDateString('pt-BR');
}

export function SininhoNotificacoes(props: SininhoProps) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const { aberto, aoFechar } = props;
  const idsConhecidos = useRef<Set<number> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  function carregarNotificacoes() {
    if (!props.autenticado) return;

    api
      .get<RespostaNotificacoes>('/notificacoes')
      .then(function (resposta) {
        const lista = resposta.data.notificacoes || [];

        if (idsConhecidos.current) {
          for (const item of lista) {
            if (!item.lida && !idsConhecidos.current.has(item.id)) {
              dispararNotificacaoNavegador(item.titulo, item.mensagem);
            }
          }
        }
        idsConhecidos.current = new Set(lista.map((item) => item.id));

        setNotificacoes(lista);
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
      const intervalo = setInterval(carregarNotificacoes, 15000);
      return function () {
        clearInterval(intervalo);
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.autenticado]
  );

  // Fecha ao clicar fora ou apertar ESC.
  useEffect(
    function () {
      if (!aberto) return;
      function aoClicarFora(evento: MouseEvent) {
        if (wrapperRef.current && !wrapperRef.current.contains(evento.target as Node)) aoFechar();
      }
      function aoPressionarEsc(evento: KeyboardEvent) {
        if (evento.key === 'Escape') aoFechar();
      }
      document.addEventListener('mousedown', aoClicarFora);
      document.addEventListener('keydown', aoPressionarEsc);
      return function () {
        document.removeEventListener('mousedown', aoClicarFora);
        document.removeEventListener('keydown', aoPressionarEsc);
      };
    },
    [aberto, aoFechar]
  );

  function marcarComoLida(id: number, ocorrenciaId?: number | null) {
    api.patch(`/notificacoes/${id}/ler`).then(function () {
      carregarNotificacoes();
      if (ocorrenciaId && props.aoSelecionarOcorrencia) {
        props.aoSelecionarOcorrencia(ocorrenciaId);
        aoFechar();
      }
    });
  }

  function marcarTodasLidas() {
    api.patch('/notificacoes/ler-todas').then(function () {
      carregarNotificacoes();
    });
  }

  function excluir(id: number) {
    setNotificacoes((lista) => lista.filter((n) => n.id !== id));
    api
      .delete(`/notificacoes/${id}`)
      .catch(function (err) {
        console.error('[ERRO AO EXCLUIR NOTIFICACAO]:', err);
      })
      .finally(carregarNotificacoes);
  }

  if (!props.autenticado) {
    return null;
  }

  const naoLidasCount = notificacoes.filter(function (n) {
    return !n.lida;
  }).length;

  return (
    <div ref={wrapperRef} className="dm-sininho">
      <button
        type="button"
        className={`dm-navbar-botao${aberto ? ' dm-navbar-botao--ativo' : ''}`}
        onClick={props.aoAlternar}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        aria-label={naoLidasCount > 0 ? `Notificações (${naoLidasCount} não lidas)` : 'Notificações'}
        title="Notificações"
      >
        <FiBell size={18} aria-hidden="true" />
        {naoLidasCount > 0 && (
          <span className="dm-sininho__contador" aria-hidden="true">
            {naoLidasCount > 99 ? '99+' : naoLidasCount}
          </span>
        )}
      </button>

      {aberto && (
        <div className="dm-sininho__painel" role="dialog" aria-label="Notificações">
          <div className="dm-sininho__cabecalho">
            <div>
              <h2 className="dm-sininho__titulo">Notificações</h2>
              <span className="dm-sininho__resumo">
                {naoLidasCount > 0 ? `${naoLidasCount} não ${naoLidasCount === 1 ? 'lida' : 'lidas'}` : 'Tudo em dia'}
              </span>
            </div>
            {naoLidasCount > 0 && (
              <button type="button" className="dm-sininho__limpar" onClick={marcarTodasLidas}>
                Limpar pendências
              </button>
            )}
          </div>

          {notificacoes.length === 0 ? (
            <p className="dm-sininho__vazio">
              <FiBell size={22} aria-hidden="true" />
              Nenhuma notificação no momento.
            </p>
          ) : (
            <ul className="dm-sininho__lista">
              {notificacoes.map(function (item) {
                const Icone = ICONE_TIPO[item.tipo_notificacao] || FiInfo;
                return (
                  <li key={item.id} className={`dm-sininho__item${item.lida ? '' : ' dm-sininho__item--nao-lida'}`}>
                    <button
                      type="button"
                      className="dm-sininho__item-corpo"
                      onClick={function () {
                        marcarComoLida(item.id, item.ocorrencia_id);
                      }}
                    >
                      <span className="dm-sininho__icone" aria-hidden="true">
                        <Icone size={15} />
                      </span>
                      <span className="dm-sininho__texto">
                        <span className="dm-sininho__meta">
                          {ROTULO_TIPO_NOTIFICACAO[item.tipo_notificacao] || 'Aviso'}
                          <span aria-hidden="true"> · </span>
                          <time dateTime={item.data_envio}>{tempoRelativo(item.data_envio)}</time>
                        </span>
                        <strong>{item.titulo}</strong>
                        <span className="dm-sininho__mensagem">{item.mensagem}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="dm-sininho__excluir"
                      onClick={() => excluir(item.id)}
                      aria-label={`Excluir notificação "${item.titulo}"`}
                      title="Excluir"
                    >
                      <FiX size={14} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
