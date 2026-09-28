import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiCheck, FiHeart, FiShare2, FiAlertTriangle, FiImage } from 'react-icons/fi';
import './ocorrencia.css';
import { Modal } from '../comum/Modal';
import { api } from '../../services/api';
import { ROTULO_GRAVIDADE, ROTULO_STATUS } from '../../theme/rotulos';
import { obterIconeCategoria } from '../../theme/iconesCategorias';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import type { Ocorrencia } from '@shared/types';

interface ModalOcorrenciaProps {
  ocorrenciaId: number;
  aoFechar: () => void;
  aoMudar?: () => void; // avisa o mapa pra recarregar os clusters depois de uma ação
}

function formatarDataHora(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '—';
  return `${data.toLocaleDateString('pt-BR')} · ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

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

  // ESC, clique fora e trava de scroll ficam a cargo do <Modal>.

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
      try {
        await navigator.clipboard.writeText(url);
        toast.info('Link copiado para a área de transferência!');
      } catch {
        toast.info(`Copie o link: ${url}`);
      }
    }
  }

  if (carregando || !ocorrencia) {
    return (
      <Modal aoFechar={props.aoFechar} largura={440} ariaLabel="Carregando ocorrência" className="dm-ocorrencia-modal">
        <div className="dm-ocorrencia__carregando" role="status">
          <span className="dm-ocorrencia__spinner" aria-hidden="true" />
          Carregando…
        </div>
      </Modal>
    );
  }

  const nomeCategoria = ocorrencia.categorias?.nome || 'Ocorrência';
  const latitude = Number(ocorrencia.latitude);
  const longitude = Number(ocorrencia.longitude);

  return (
    <Modal
      aoFechar={props.aoFechar}
      largura={440}
      ariaLabel={`Ocorrência: ${nomeCategoria}`}
      className="dm-ocorrencia-modal"
    >
      {ocorrencia.imagem_url ? (
        <a
          href={ocorrencia.imagem_url}
          target="_blank"
          rel="noreferrer"
          className="dm-ocorrencia__imagem"
          title="Abrir imagem em tamanho real"
        >
          <img src={ocorrencia.imagem_url} alt={`Foto da ocorrência: ${nomeCategoria}`} />
        </a>
      ) : (
        <div className="dm-ocorrencia__imagem dm-ocorrencia__imagem--vazia">
          <FiImage size={30} aria-hidden="true" />
          <span>Sem imagem</span>
        </div>
      )}

      <div className="dm-ocorrencia__tags">
        <span className="dm-tag dm-ocorrencia__tag-categoria">{nomeCategoria}</span>
        <span className={`dm-tag dm-tag--${ocorrencia.status}`}>{ROTULO_STATUS[ocorrencia.status]}</span>
      </div>

      <div className="dm-ocorrencia__titulo-linha">
        <img src={obterIconeCategoria(ocorrencia.categorias?.nome)} alt="" className="dm-ocorrencia__icone" />
        <h2 className="dm-ocorrencia__titulo">{nomeCategoria}</h2>
      </div>

      <dl className="dm-ocorrencia__detalhes">
        <div className="dm-ocorrencia__linha">
          <dt>Data</dt>
          <dd className="dm-mono">{formatarDataHora(ocorrencia.data_registro)}</dd>
        </div>
        <div className="dm-ocorrencia__linha">
          <dt>Gravidade</dt>
          <dd>
            <span className={`dm-severidade dm-severidade--${ocorrencia.gravidade}`}>
              <span className="dm-severidade__ponto" aria-hidden="true" />
              {ROTULO_GRAVIDADE[ocorrencia.gravidade]}
            </span>
          </dd>
        </div>
        {Number.isFinite(latitude) && Number.isFinite(longitude) && (
          <div className="dm-ocorrencia__linha">
            <dt>Local</dt>
            <dd className="dm-mono">
              {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </dd>
          </div>
        )}
        <div className="dm-ocorrencia__linha">
          <dt>Reportado por</dt>
          <dd>
            {!ocorrencia.anonimo && ocorrencia.usuario ? (
              <Link to={`/usuarios/${ocorrencia.usuario.id}`} className="dm-ocorrencia__autor">
                {ocorrencia.usuario.nome}
              </Link>
            ) : (
              'Anônimo'
            )}
          </dd>
        </div>
        <div className="dm-ocorrencia__linha">
          <dt>Confirmações</dt>
          <dd className="dm-mono">{ocorrencia.qtd_confirmacoes}</dd>
        </div>
      </dl>

      <p className={`dm-ocorrencia__descricao${ocorrencia.descricao ? '' : ' dm-ocorrencia__descricao--vazia'}`}>
        {ocorrencia.descricao || 'Sem descrição informada.'}
      </p>

      <div className="dm-ocorrencia__acoes">
        <button
          type="button"
          onClick={alternarConfirmacao}
          disabled={ehCriador}
          aria-pressed={confirmado}
          title={ehCriador ? 'Você não pode confirmar sua própria ocorrência.' : undefined}
          className={`dm-btn dm-ocorrencia__confirmar ${confirmado ? 'dm-btn--ghost dm-ocorrencia__confirmar--feito' : 'dm-btn--primario'}`}
        >
          {confirmado ? (
            <>
              <FiCheck size={15} aria-hidden="true" /> Confirmado
            </>
          ) : (
            <span>Confirmar ({ocorrencia.qtd_confirmacoes})</span>
          )}
        </button>
        <button
          type="button"
          onClick={alternarCurtida}
          disabled={ehCriador}
          aria-pressed={curtido}
          aria-label={`${curtido ? 'Remover curtida' : 'Curtir'} (${totalCurtidas})`}
          title={ehCriador ? 'Você não pode curtir sua própria ocorrência.' : curtido ? 'Remover curtida' : 'Curtir'}
          className={`dm-btn dm-btn--ghost dm-ocorrencia__icone-btn${curtido ? ' dm-ocorrencia__curtir--ativo' : ''}`}
        >
          <FiHeart size={15} aria-hidden="true" fill={curtido ? 'currentColor' : 'none'} />
          <span className="dm-mono">{totalCurtidas}</span>
        </button>
        <button
          type="button"
          onClick={compartilhar}
          aria-label="Compartilhar"
          title="Compartilhar"
          className="dm-btn dm-btn--ghost dm-ocorrencia__icone-btn"
        >
          <FiShare2 size={15} aria-hidden="true" />
        </button>
      </div>

      {ehCriador && (
        <p className="dm-dica dm-ocorrencia__aviso-criador">
          Você registrou esta ocorrência, por isso não pode confirmá-la nem curtir - peça pra outra pessoa validar.
        </p>
      )}

      {!mostrarFormDenuncia ? (
        <button type="button" className="dm-ocorrencia__denunciar" onClick={() => setMostrarFormDenuncia(true)}>
          <FiAlertTriangle size={13} aria-hidden="true" /> Denunciar esta ocorrência
        </button>
      ) : (
        <div className="dm-caixa-perigo dm-ocorrencia__denuncia">
          <label className="dm-campo-grupo">
            <span className="dm-rotulo">Motivo da denúncia</span>
            <textarea
              className="dm-campo"
              value={motivoDenuncia}
              onChange={(e) => setMotivoDenuncia(e.target.value)}
              placeholder="Por que você acha que essa ocorrência é falsa ou inadequada?"
              rows={3}
              autoFocus
            />
          </label>
          <div className="dm-ocorrencia__denuncia-acoes">
            <button
              type="button"
              className="dm-btn dm-btn--ghost dm-btn--pequeno"
              onClick={() => setMostrarFormDenuncia(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="dm-btn dm-btn--perigo-solido dm-btn--pequeno"
              onClick={enviarDenuncia}
              disabled={enviando}
            >
              {enviando ? 'Enviando…' : 'Enviar denúncia'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
