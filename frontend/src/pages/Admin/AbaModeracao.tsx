import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiCheck, FiCheckCircle, FiRefreshCw, FiX } from 'react-icons/fi';
import { api } from '../../services/api';
import { ModalOcorrencia } from '../../components/ocorrencia/ModalOcorrencia';
import { ROTULO_GRAVIDADE, ROTULO_STATUS, ORDEM_STATUS } from '../../theme/rotulos';
import type { FilaModeracaoOcorrencias, Ocorrencia, StatusOcorrencia } from '@shared/types';
import { CabecalhoAba } from './componentes/CabecalhoAba';
import { BarraFerramentas } from './componentes/BarraFerramentas';
import { Paginacao } from './componentes/Paginacao';
import { useLinhasPorPagina } from '../../hooks/useLinhasPorPagina';
import { carimboData } from './utils/csv';
import { relatorioLista } from './utils/relatorios';
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
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(0);
  const porPagina = useLinhasPorPagina(430, 60);
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
  useEffect(() => setPagina(0), [busca, filtro]);

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
  const termo = busca.trim().toLowerCase();
  const visiveis = ocorrencias.filter(
    (oc) =>
      (filtro === 'todas' || oc.status === filtro) &&
      (termo === '' || `${oc.id} ${oc.categorias?.nome ?? ''} ${oc.descricao ?? ''}`.toLowerCase().includes(termo))
  );

  const pagina_visiveis = visiveis.slice(pagina * porPagina, (pagina + 1) * porPagina);

  function gerarRelatorio() {
    return relatorioLista({
      titulo: 'DangerMap — Ocorrências denunciadas',
      nomeArquivo: `ocorrencias-denunciadas-${carimboData()}`,
      nomeAba: 'Denunciadas',
      cabecalho: ['Nº', 'Categoria', 'Descrição', 'Gravidade', 'Denúncias', 'Data', 'Situação'],
      linhas: visiveis.map((oc) => [
        oc.id,
        oc.categorias?.nome ?? 'Sem categoria',
        oc.descricao ?? '',
        ROTULO_GRAVIDADE[oc.gravidade] ?? oc.gravidade,
        oc.qtd_denuncias,
        formatarDataCurta(oc.data_registro),
        ROTULO_STATUS[oc.status] ?? oc.status,
      ]),
      larguras: [8, 24, 60, 12, 12, 12, 14],
    });
  }

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
        {ocorrencias.length > 0 && (
          <BarraFerramentas busca={busca} aoBuscar={setBusca} placeholder="Buscar por categoria, descrição ou número" gerarRelatorio={gerarRelatorio} semDados={visiveis.length === 0}>
            <div className="dm-chips" role="group" aria-label="Filtrar por situação">
              <button type="button" className="dm-chip dm-chip--claro" aria-pressed={filtro === 'todas'} onClick={() => setFiltro('todas')}>
                Todas · {ocorrencias.length}
              </button>
              {ORDEM_STATUS.filter((s) => contagem.get(s)).map((s) => (
                <button key={s} type="button" className="dm-chip dm-chip--claro" aria-pressed={filtro === s} onClick={() => setFiltro(s)}>
                  {ROTULO_STATUS[s]} · {contagem.get(s)}
                </button>
              ))}
            </div>
          </BarraFerramentas>
        )}
        {erro && !dados ? (
          <p className="dm-admin-vazio">Não foi possível carregar a fila. Tente atualizar.</p>
        ) : !dados ? (
          <div className="dm-admin-esqueleto" aria-hidden="true" />
        ) : visiveis.length === 0 ? (
          <p className="dm-admin-vazio">{ocorrencias.length === 0 ? 'Nenhuma ocorrência na fila de moderação no momento.' : 'Nada encontrado com essa busca ou filtro.'}</p>
        ) : (
          <>
            <div className="dm-tabela-wrap">
              <table className="dm-tabela dm-tabela--empilhada">
                <thead>
                  <tr>
                    <th scope="col">Ocorrência</th>
                    <th scope="col">Gravidade</th>
                    <th scope="col">Denúncias</th>
                    <th scope="col">Situação</th>
                    <th scope="col">
                      <span className="dm-visually-hidden">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagina_visiveis.map((oc) => {
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
                        <td data-rotulo="Ocorrência" className="dm-admin-celula-texto">
                          <strong className="dm-admin-celula-titulo">{oc.categorias?.nome || 'Sem categoria'}</strong>
                          <span className="dm-admin-celula-sub">
                            {oc.descricao || 'sem descrição'} · {formatarDataCurta(oc.data_registro)}
                          </span>
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
                        <td data-rotulo="Situação">
                          <span className={CLASSE_PILL_STATUS[oc.status]}>{ROTULO_STATUS[oc.status]}</span>
                        </td>
                        <td data-rotulo="Ações" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                          <div className="dm-admin-acoes-icones">
                            <button type="button" className="dm-admin-icone-acao" title={DICA_ACAO.manter} aria-label="Manter no mapa" disabled={ocupado} onClick={() => moderar(oc.id, 'manter')}>
                              <FiCheck aria-hidden="true" />
                              <span>Manter</span>
                            </button>
                            <button type="button" className="dm-admin-icone-acao" title={DICA_ACAO.resolver} aria-label="Marcar como resolvida" disabled={ocupado} onClick={() => moderar(oc.id, 'resolver')}>
                              <FiCheckCircle aria-hidden="true" />
                              <span>Resolver</span>
                            </button>
                            <button type="button" className="dm-admin-icone-acao dm-admin-icone-acao--perigo" title={DICA_ACAO.rejeitar} aria-label="Rejeitar e arquivar" disabled={ocupado} onClick={() => setConfirmarRejeicao(oc)}>
                              <FiX aria-hidden="true" />
                              <span>Rejeitar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Paginacao total={visiveis.length} pagina={pagina} porPagina={porPagina} aoMudar={setPagina} />
          </>        )}
      </section>

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
