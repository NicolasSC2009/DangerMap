import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiRefreshCw } from 'react-icons/fi';
import { api } from '../../services/api';
import { ModalOcorrencia } from '../../components/ocorrencia/ModalOcorrencia';
import { ROTULO_GRAVIDADE, ROTULO_STATUS, ORDEM_STATUS } from '../../theme/rotulos';
import type { FilaModeracaoOcorrencias, Ocorrencia, StatusOcorrencia } from '@shared/types';
import { CabecalhoAba } from './componentes/CabecalhoAba';
import { ModalConfirmacao } from './componentes/ModalConfirmacao';
import { CLASSE_PILL_STATUS, aoTeclarLinha, formatarDataCurta } from './componentes/TabelaOcorrenciasRecentes';

type Acao = 'rejeitar' | 'manter' | 'resolver';

const DICA_ACAO: Record<Acao, string> = {
  manter: 'Mantém a ocorrência publicada (status: confirmada)',
  resolver: 'Marca a ocorrência como resolvida',
  rejeitar: 'Arquiva a ocorrência e a remove do mapa',
};

export function AbaModeracao() {
  const [dados, setDados] = useState<FilaModeracaoOcorrencias | null>(null);
  const [erro, setErro] = useState(false);
  const [processandoId, setProcessandoId] = useState<number | null>(null);
  const [filtro, setFiltro] = useState<StatusOcorrencia | 'todas'>('todas');
  const [abertaId, setAbertaId] = useState<number | null>(null);
  const [confirmarRejeicao, setConfirmarRejeicao] = useState<Ocorrencia | null>(null);

  function carregar() {
    api
      .get<FilaModeracaoOcorrencias>('/admin/ocorrencias/fila-moderacao')
      .then(function (r) {
        setDados(r.data);
        setErro(false);
      })
      .catch(function () {
        setErro(true);
        toast.error('Não foi possível carregar a fila de moderação.');
      });
  }

  useEffect(carregar, []);

  function moderar(id: number, acao: Acao) {
    setProcessandoId(id);
    api
      .patch(`/admin/ocorrencias/${id}/moderar`, { acao })
      .then((r) => {
        toast.success(r.data?.mensagem || 'Ocorrência moderada.');
        carregar();
      })
      .catch((erro) => toast.error(erro?.response?.data?.error || 'Não foi possível moderar agora.'))
      .finally(function () {
        setProcessandoId(null);
        setConfirmarRejeicao(null);
      });
  }

  const subtitulo = dados?.limite
    ? `Ocultas do mapa a partir de ${dados.limite} denúncias.`
    : 'Ocorrências com denúncias acumuladas aguardando revisão.';

  const ocorrencias = dados?.ocorrencias ?? [];
  const contagem = new Map<StatusOcorrencia, number>();
  for (const oc of ocorrencias) contagem.set(oc.status, (contagem.get(oc.status) ?? 0) + 1);
  const visiveis = filtro === 'todas' ? ocorrencias : ocorrencias.filter((oc) => oc.status === filtro);

  return (
    <>
      <CabecalhoAba
        eyebrow="Moderação"
        titulo="Ocorrências denunciadas"
        subtitulo={subtitulo}
        acoes={
          <button type="button" className="dm-btn dm-btn--ghost dm-btn--pequeno" onClick={carregar}>
            <FiRefreshCw aria-hidden="true" /> Atualizar
          </button>
        }
      />

      <section className="dm-painel dm-admin-painel">
        <div className="dm-painel-cabecalho">
          <h3>Fila de moderação</h3>
          <span className="dm-painel-nota">{dados ? `${ocorrencias.length} na fila` : 'Carregando…'}</span>
        </div>

        {ocorrencias.length > 0 && (
          <div className="dm-chips dm-admin-filtros" role="group" aria-label="Filtrar por status">
            <button type="button" className="dm-chip dm-chip--claro" aria-pressed={filtro === 'todas'} onClick={() => setFiltro('todas')}>
              Todas · {ocorrencias.length}
            </button>
            {ORDEM_STATUS.filter((s) => contagem.get(s)).map((s) => (
              <button key={s} type="button" className="dm-chip dm-chip--claro" aria-pressed={filtro === s} onClick={() => setFiltro(s)}>
                {ROTULO_STATUS[s]} · {contagem.get(s)}
              </button>
            ))}
          </div>
        )}

        {erro && !dados ? (
          <p className="dm-admin-vazio">Não foi possível carregar a fila. Tente atualizar.</p>
        ) : !dados ? (
          <div className="dm-admin-esqueleto" aria-hidden="true" />
        ) : visiveis.length === 0 ? (
          <p className="dm-admin-vazio">Nenhuma ocorrência na fila de moderação no momento.</p>
        ) : (
          <div className="dm-tabela-wrap">
            <table className="dm-tabela dm-tabela--empilhada">
              <thead>
                <tr>
                  <th scope="col">Categoria</th>
                  <th scope="col">Descrição</th>
                  <th scope="col">Gravidade</th>
                  <th scope="col">Denúncias</th>
                  <th scope="col">Data</th>
                  <th scope="col">Status</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {visiveis.map((oc) => {
                  const ocupado = processandoId === oc.id;
                  return (
                    <tr
                      key={oc.id}
                      className="dm-tabela__clicavel"
                      tabIndex={0}
                      onClick={() => setAbertaId(oc.id)}
                      onKeyDown={aoTeclarLinha(() => setAbertaId(oc.id))}
                      aria-label={`Abrir ocorrência #${oc.id}`}
                    >
                      <td data-rotulo="Categoria">{oc.categorias?.nome || 'Sem categoria'}</td>
                      <td data-rotulo="Descrição" className="dm-admin-celula-texto">
                        {oc.descricao || <em className="dm-admin-apagado">sem descrição</em>}
                      </td>
                      <td data-rotulo="Gravidade">
                        <span className={`dm-severidade dm-severidade--${oc.gravidade}`}>
                          <span className="dm-severidade__ponto" aria-hidden="true" />
                          {ROTULO_GRAVIDADE[oc.gravidade]}
                        </span>
                      </td>
                      <td data-rotulo="Denúncias">
                        <strong className="dm-admin-contagem-risco dm-mono">{oc.qtd_denuncias}</strong>
                      </td>
                      <td data-rotulo="Data" className="dm-mono">
                        {formatarDataCurta(oc.data_registro)}
                      </td>
                      <td data-rotulo="Status">
                        <span className={CLASSE_PILL_STATUS[oc.status]}>{ROTULO_STATUS[oc.status]}</span>
                      </td>
                      <td data-rotulo="Ações" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                        <div className="dm-admin-acoes-linha">
                          <button type="button" className="dm-btn dm-btn--ghost dm-btn--pequeno" title={DICA_ACAO.manter} disabled={ocupado} onClick={() => moderar(oc.id, 'manter')}>
                            Manter
                          </button>
                          <button type="button" className="dm-btn dm-btn--ghost dm-btn--pequeno" title={DICA_ACAO.resolver} disabled={ocupado} onClick={() => moderar(oc.id, 'resolver')}>
                            Resolver
                          </button>
                          <button type="button" className="dm-btn dm-btn--perigo dm-btn--pequeno" title={DICA_ACAO.rejeitar} disabled={ocupado} onClick={() => setConfirmarRejeicao(oc)}>
                            Rejeitar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="dm-admin-legenda-acoes">
        <strong>Manter</strong> publica como confirmada · <strong>Resolver</strong> marca como resolvida · <strong>Rejeitar</strong> arquiva e remove do mapa.
      </p>

      {abertaId !== null && <ModalOcorrencia ocorrenciaId={abertaId} aoFechar={() => setAbertaId(null)} aoMudar={carregar} />}

      {confirmarRejeicao && (
        <ModalConfirmacao
          perigo
          titulo="Rejeitar ocorrência?"
          rotuloConfirmar="Rejeitar e arquivar"
          processando={processandoId === confirmarRejeicao.id}
          mensagem={
            <>
              A ocorrência <strong>#{confirmarRejeicao.id}</strong> ({confirmarRejeicao.categorias?.nome || 'sem categoria'}) será{' '}
              <strong>arquivada</strong> e deixará de aparecer no mapa público.
            </>
          }
          aoConfirmar={() => moderar(confirmarRejeicao.id, 'rejeitar')}
          aoFechar={() => setConfirmarRejeicao(null)}
        />
      )}
    </>
  );
}
