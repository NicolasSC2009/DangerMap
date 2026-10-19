import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiDownload, FiRefreshCw, FiSearch, FiX } from 'react-icons/fi';
import { ModalOcorrencia } from '../../components/ocorrencia/ModalOcorrencia';
import { ROTULO_GRAVIDADE, ROTULO_STATUS, ORDEM_GRAVIDADE, ORDEM_STATUS, COR_GRAVIDADE } from '../../theme/rotulos';
import type { Gravidade, ResultadoRelatorioEstado, ResultadoRelatorioRegiao, StatusOcorrencia } from '@shared/types';
import { ESTADOS_BRASIL } from '../../theme/estadosBrasil';
import { CabecalhoAba } from './componentes/CabecalhoAba';
import {
  FerramentaRaio,
  RAIO_PADRAO_M,
  areaKm2,
  formatarRaio,
  limitarRaio,
  useBuscaRegiao,
  type Coordenada,
  type PontoResultado,
} from './componentes/FerramentaRaio';
import { FerramentaEstado, useBuscaEstado } from './componentes/FerramentaEstado';
import { ModalExportar } from './componentes/ModalExportar';
import { FiltroSuspenso } from './componentes/FiltroSuspenso';
import { Paginacao } from './componentes/Paginacao';
import { useLinhasPorPagina } from '../../hooks/useLinhasPorPagina';
import { CLASSE_PILL_STATUS, aoTeclarLinha } from './componentes/TabelaOcorrenciasRecentes';
import { carimboData } from './utils/csv';
import { relatorioOcorrencias } from './utils/relatorios';

type Modo = 'raio' | 'estado';
type Linha = ResultadoRelatorioRegiao | ResultadoRelatorioEstado;

const PERIODOS: Array<{ dias: number; rotulo: string }> = [
  { dias: 0, rotulo: 'Tudo' },
  { dias: 7, rotulo: '7 dias' },
  { dias: 30, rotulo: '30 dias' },
  { dias: 90, rotulo: '90 dias' },
];


function lerCentroDaUrl(params: URLSearchParams): Coordenada | null {
  const lat = Number(params.get('lat'));
  const lng = Number(params.get('lng'));
  if (!params.get('lat') || !params.get('lng') || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

function formatarDistancia(metros: number): string {
  if (metros < 1000) return `${Math.round(metros).toLocaleString('pt-BR')} m`;
  return `${(metros / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} km`;
}

function formatarAreaEstado(km2: number): string {
  return km2.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

function rotuloPonto(r: Linha): string {
  if (!r.descricao) return `Ocorrência #${r.id}`;
  return r.descricao.length > 40 ? `${r.descricao.slice(0, 40)}…` : r.descricao;
}

export function AbaRelatorioRegiao() {
  const [params, setParams] = useSearchParams();
  const [modo, setModo] = useState<Modo>(() => (params.get('uf') ? 'estado' : 'raio'));
  const [centro, setCentro] = useState<Coordenada | null>(() => lerCentroDaUrl(params));
  const [raio, setRaio] = useState<number>(() => (params.get('raio') ? limitarRaio(Number(params.get('raio'))) : RAIO_PADRAO_M));
  const [uf, setUf] = useState<string | null>(() => params.get('uf'));
  const [gravidades, setGravidades] = useState<Set<Gravidade>>(() => new Set(ORDEM_GRAVIDADE));
  const [statuses, setStatuses] = useState<Set<StatusOcorrencia>>(() => new Set(ORDEM_STATUS));
  const [categoriasSel, setCategoriasSel] = useState<Set<number>>(() => new Set());
  const [dias, setDias] = useState(0);
  const [vista, setVista] = useState<'mapa' | 'lista'>('mapa');
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(0);
  const porPagina = useLinhasPorPagina(470);
  const [abertaId, setAbertaId] = useState<number | null>(null);
  const [exportando, setExportando] = useState(false);
  const { resultados, buscando, recarregar } = useBuscaRegiao(centro, raio);
  const { dados: dadosEstado, buscando: buscandoEstado, recarregar: recarregarEstado } = useBuscaEstado(modo === 'estado' ? uf : null);

  // Mantém centro/raio na URL (deep link / recarregar a página) no modo raio.
  useEffect(
    function () {
      if (modo !== 'raio' || !centro) return;
      const t = window.setTimeout(function () {
        setParams({ lat: centro.lat.toFixed(6), lng: centro.lng.toFixed(6), raio: String(raio) }, { replace: true });
      }, 500);
      return () => window.clearTimeout(t);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modo, centro?.lat, centro?.lng, raio]
  );

  // Mantém a UF na URL (deep link) no modo estado.
  useEffect(
    function () {
      if (modo !== 'estado' || !uf) return;
      setParams({ uf }, { replace: true });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modo, uf]
  );

  const estadoAtual = ESTADOS_BRASIL.find((e) => e.uf === uf) ?? null;
  const todas: Linha[] | null = modo === 'raio' ? (centro ? resultados : null) : uf ? (dadosEstado?.ocorrencias ?? null) : null;
  const carregando = modo === 'raio' ? buscando && !resultados : buscandoEstado && !dadosEstado;

  // Categorias que aparecem nos resultados (com quantas ocorrências cada uma).
  const categoriasDisponiveis = useMemo(function () {
    const mapa = new Map<number, { id: number; nome: string; total: number }>();
    for (const l of todas ?? []) {
      if (l.categoria_id == null) continue;
      const atual = mapa.get(l.categoria_id) ?? { id: l.categoria_id, nome: l.categoria ?? `Categoria ${l.categoria_id}`, total: 0 };
      atual.total += 1;
      mapa.set(l.categoria_id, atual);
    }
    return [...mapa.values()].sort((a, b) => b.total - a.total);
  }, [todas]);

  const filtradas = useMemo(
    function () {
      const limite = dias > 0 ? Date.now() - dias * 24 * 3600 * 1000 : null;
      return (todas ?? []).filter(
        (l) =>
          gravidades.has(l.gravidade) &&
          statuses.has(l.status) &&
          (categoriasSel.size === 0 || (l.categoria_id != null && categoriasSel.has(l.categoria_id))) &&
          (limite === null || new Date(l.data_registro).getTime() >= limite)
      );
    },
    [todas, gravidades, statuses, categoriasSel, dias]
  );

  const pontos: PontoResultado[] = useMemo(
    () => filtradas.map((r) => ({ id: r.id, lat: Number(r.latitude), lng: Number(r.longitude), gravidade: r.gravidade, rotulo: rotuloPonto(r) })),
    [filtradas]
  );

  // Ao mudar de filtro ou de busca, volta para a primeira página da tabela.
  useEffect(
    function () {
      setPagina(0);
    },
    [filtradas, busca]
  );

  function alternar<T>(conjunto: Set<T>, valor: T, definir: (s: Set<T>) => void) {
    const novo = new Set(conjunto);
    if (novo.has(valor)) novo.delete(valor);
    else novo.add(valor);
    definir(novo);
  }

  const filtrosAtivos =
    gravidades.size < ORDEM_GRAVIDADE.length || statuses.size < ORDEM_STATUS.length || categoriasSel.size > 0 || dias > 0;

  function limparFiltros() {
    setGravidades(new Set(ORDEM_GRAVIDADE));
    setStatuses(new Set(ORDEM_STATUS));
    setCategoriasSel(new Set());
    setDias(0);
    setBusca('');
  }

  const total = todas?.length ?? 0;
  const altas = filtradas.filter((l) => l.gravidade === 'alto').length;
  const confirmadas = filtradas.filter((l) => l.status === 'confirmado').length;
  const resolvidas = filtradas.filter((l) => l.status === 'resolvido').length;
  const podeExportar = !!todas && !carregando;

  // O PDF é gerado no servidor com os mesmos filtros que estão na tela.
  const filtrosServidor: Record<string, string | number | undefined> = {
    gravidades: gravidades.size < ORDEM_GRAVIDADE.length ? [...gravidades].join(',') : undefined,
    status: statuses.size < ORDEM_STATUS.length ? [...statuses].join(',') : undefined,
    categorias: categoriasSel.size > 0 ? [...categoriasSel].join(',') : undefined,
    dias: dias > 0 ? dias : undefined,
  };

  function descricaoDosFiltros(): Array<[string, string]> {
    const linhas: Array<[string, string]> = [];
    if (gravidades.size < ORDEM_GRAVIDADE.length) linhas.push(['Gravidade', ORDEM_GRAVIDADE.filter((g) => gravidades.has(g)).map((g) => ROTULO_GRAVIDADE[g]).join(', ')]);
    if (statuses.size < ORDEM_STATUS.length) linhas.push(['Situação', ORDEM_STATUS.filter((s) => statuses.has(s)).map((s) => ROTULO_STATUS[s]).join(', ')]);
    if (dias > 0) linhas.push(['Período', `últimos ${dias} dias`]);
    if (categoriasSel.size > 0) linhas.push(['Categorias', categoriasDisponiveis.filter((c) => categoriasSel.has(c.id)).map((c) => c.nome).join(', ')]);
    return linhas;
  }

  function montarExportacao() {
    if (modo === 'raio' && centro) {
      return {
        titulo: 'Extração regional',
        subtitulo: `Centro ${centro.lat.toFixed(5)}, ${centro.lng.toFixed(5)} · raio de ${formatarRaio(raio)} km (${areaKm2(raio)} km²).`,
        relatorio: relatorioOcorrencias({
          titulo: 'DangerMap — Extração regional',
          nomeArquivo: `extracao-regional-${carimboData()}`,
          meta: [['Centro (lat, lng)', `${centro.lat.toFixed(6)}, ${centro.lng.toFixed(6)}`], ['Raio (m)', raio], ...descricaoDosFiltros()],
          linhas: filtradas,
          comDistancia: true,
        }),
        pdf: { url: '/admin/relatorio-regiao/relatorio.pdf', params: { lat: centro.lat, lng: centro.lng, raio, ...filtrosServidor } },
      };
    }
    if (modo === 'estado' && uf) {
      const nome = estadoAtual?.nome ?? uf;
      return {
        titulo: `Extração por estado — ${uf}`,
        subtitulo: `${nome}: todas as ocorrências dentro da fronteira do estado.`,
        relatorio: relatorioOcorrencias({
          titulo: `DangerMap — Extração por estado (${uf})`,
          nomeArquivo: `extracao-${uf.toLowerCase()}-${carimboData()}`,
          meta: [['Estado', `${nome} (${uf})`], ...descricaoDosFiltros()],
          linhas: filtradas,
        }),
        pdf: { url: '/admin/relatorio-estado/relatorio.pdf', params: { uf, nome, ...filtrosServidor } },
      };
    }
    return null;
  }

  const exportacao = exportando ? montarExportacao() : null;
  const termo = busca.trim().toLowerCase();
  const encontradas = termo ? filtradas.filter((l) => ` ${l.descricao ?? ''} ${l.categoria ?? ''}`.toLowerCase().includes(termo)) : filtradas;
  const exibidas = encontradas.slice(pagina * porPagina, (pagina + 1) * porPagina);

  const resumoLista = (conjunto: Set<string>, ordem: string[], rotulos: Record<string, string>) =>
    conjunto.size === ordem.length ? undefined : conjunto.size <= 2 ? ordem.filter((v) => conjunto.has(v)).map((v) => rotulos[v]).join(', ') || 'nenhuma' : `${conjunto.size} de ${ordem.length}`;

  const barraFiltros = (
    <div className="dm-admin-barra-relatorio dm-admin-nao-imprimir">
      <div className="dm-admin-segmentado" role="group" aria-label="Modo de extração">
        <button type="button" aria-pressed={modo === 'raio'} onClick={() => setModo('raio')}>
          Por raio
        </button>
        <button type="button" aria-pressed={modo === 'estado'} onClick={() => setModo('estado')}>
          Por estado
        </button>
      </div>

      <div className="dm-admin-segmentado" role="group" aria-label="O que mostrar">
        <button type="button" aria-pressed={vista === 'mapa'} onClick={() => setVista('mapa')}>
          Mapa
        </button>
        <button type="button" aria-pressed={vista === 'lista'} onClick={() => setVista('lista')}>
          Resultados{todas ? ` · ${filtradas.length.toLocaleString('pt-BR')}` : ''}
        </button>
      </div>

      <div className="dm-admin-barra-relatorio__filtros">
        <FiltroSuspenso
          rotulo="Gravidade"
          opcoes={ORDEM_GRAVIDADE.map((g) => ({ valor: g, rotulo: ROTULO_GRAVIDADE[g] }))}
          selecionados={gravidades}
          aoAlternar={(g) => alternar(gravidades, g, setGravidades)}
          resumo={resumoLista(gravidades as Set<string>, ORDEM_GRAVIDADE, ROTULO_GRAVIDADE)}
        />
        <FiltroSuspenso
          rotulo="Situação"
          opcoes={ORDEM_STATUS.map((s) => ({ valor: s, rotulo: ROTULO_STATUS[s] }))}
          selecionados={statuses}
          aoAlternar={(s) => alternar(statuses, s, setStatuses)}
          resumo={resumoLista(statuses as Set<string>, ORDEM_STATUS, ROTULO_STATUS)}
        />
        <FiltroSuspenso
          rotulo="Período"
          unico
          opcoes={PERIODOS.map((p) => ({ valor: p.dias, rotulo: p.dias === 0 ? 'Todo o período' : `Últimos ${p.rotulo}` }))}
          selecionados={new Set([dias])}
          aoAlternar={(d) => setDias(d)}
          resumo={dias > 0 ? `${dias} dias` : undefined}
        />
        {categoriasDisponiveis.length > 0 && (
          <FiltroSuspenso
            rotulo="Categoria"
            opcoes={categoriasDisponiveis.map((c) => ({ valor: c.id, rotulo: c.nome, extra: c.total }))}
            selecionados={categoriasSel}
            aoAlternar={(id) => alternar(categoriasSel, id, setCategoriasSel)}
            resumo={categoriasSel.size > 0 ? String(categoriasSel.size) : undefined}
          />
        )}
        {filtrosAtivos && (
          <button type="button" className="dm-admin-filtro__limpar" onClick={limparFiltros}>
            <FiX aria-hidden="true" /> Limpar
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <CabecalhoAba
        compacto
        titulo="Extração regional"
        subtitulo={
          modo === 'raio'
            ? 'Escolha um ponto e um raio no mapa para ver e baixar as ocorrências da área.'
            : 'Escolha um estado para ver e baixar as ocorrências dele.'
        }
        acoes={
          <button type="button" className="dm-admin-botao dm-admin-botao--escuro dm-admin-botao--auto" onClick={() => setExportando(true)} disabled={!podeExportar}>
            <FiDownload aria-hidden="true" /> Baixar relatório
          </button>
        }
      />

      {barraFiltros}

      {vista === 'mapa' ? (
        <section className="dm-painel dm-admin-painel dm-admin-painel--ferramenta">
          {modo === 'raio' ? (
            <FerramentaRaio centro={centro} raioMetros={raio} aoMudarCentro={setCentro} aoMudarRaio={setRaio} pontos={pontos} aoClicarPonto={setAbertaId}>
              <p className="dm-admin-previa-linha" aria-live="polite">
                <strong>{!centro ? '—' : carregando ? '…' : filtradas.length.toLocaleString('pt-BR')}</strong> ocorrências em {areaKm2(raio)} km²
              </p>
            </FerramentaRaio>
          ) : (
            <FerramentaEstado uf={uf} aoMudarUf={setUf} poligono={dadosEstado?.poligono ?? null} pontos={pontos} aoClicarPonto={setAbertaId}>
              <p className="dm-admin-previa-linha" aria-live="polite">
                <strong>{!uf ? '—' : carregando ? '…' : filtradas.length.toLocaleString('pt-BR')}</strong> ocorrências
                {estadoAtual ? ` em ${formatarAreaEstado(estadoAtual.areaKm2)} km²` : ''}
              </p>
            </FerramentaEstado>
          )}
        </section>
      ) : (
        <section className="dm-painel dm-admin-painel">
          {!todas ? (
            <p className="dm-admin-vazio">
              {modo === 'raio' ? 'Escolha um ponto no mapa para ver as ocorrências da área.' : 'Escolha um estado para ver as ocorrências dele.'}{' '}
              <button type="button" className="dm-categorias__limpar" onClick={() => setVista('mapa')}>
                Voltar ao mapa
              </button>
            </p>
          ) : (
            <>
              <div className="dm-admin-resultados__topo dm-admin-nao-imprimir">
                <label className="dm-admin-busca">
                  <FiSearch aria-hidden="true" />
                  <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por descrição, categoria ou número" aria-label="Buscar nos resultados" />
                  {busca && (
                    <button type="button" onClick={() => setBusca('')} aria-label="Limpar busca">
                      <FiX aria-hidden="true" />
                    </button>
                  )}
                </label>
                <p className="dm-admin-resultados__resumo">
                  <strong>{filtradas.length.toLocaleString('pt-BR')}</strong> ocorrências · <strong>{altas.toLocaleString('pt-BR')}</strong> de gravidade alta ·{' '}
                  <strong>{confirmadas.toLocaleString('pt-BR')}</strong> confirmadas
                </p>
                <button type="button" className="dm-admin-link-botao" onClick={modo === 'raio' ? recarregar : recarregarEstado} aria-label="Buscar novamente" title="Buscar novamente">
                  <FiRefreshCw aria-hidden="true" />
                </button>
              </div>

              {carregando ? (
                <div className="dm-admin-esqueleto" aria-hidden="true" />
              ) : encontradas.length === 0 ? (
                <p className="dm-admin-vazio">{total === 0 ? 'Nenhuma ocorrência nessa área.' : 'Nada encontrado com esses filtros ou essa busca.'}</p>
              ) : (
                <>
                  <div className="dm-tabela-wrap">
                    <table className="dm-tabela dm-tabela--empilhada">
                      <thead>
                        <tr>
                          <th scope="col">Ocorrência</th>
                          <th scope="col">Gravidade</th>
                          <th scope="col">Situação</th>
                          {modo === 'raio' && <th scope="col">Distância</th>}
                          <th scope="col">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exibidas.map((r) => (
                          <tr key={r.id} className="dm-tabela__clicavel" tabIndex={0} onClick={() => setAbertaId(r.id)} onKeyDown={aoTeclarLinha(() => setAbertaId(r.id))} aria-label={`Abrir ocorrência #${r.id}`}>
                            <td data-rotulo="Ocorrência" className="dm-admin-celula-texto">
                              <strong className="dm-admin-celula-titulo">{r.categoria ?? 'Sem categoria'}</strong>
                              <span className="dm-admin-celula-sub">{r.descricao || 'sem descrição'}</span>
                            </td>
                            <td data-rotulo="Gravidade">
                              <span className={`dm-severidade dm-severidade--${r.gravidade}`}>
                                <span className="dm-severidade__ponto" aria-hidden="true" />
                                {ROTULO_GRAVIDADE[r.gravidade] ?? r.gravidade}
                              </span>
                            </td>
                            <td data-rotulo="Situação">
                              <span className={CLASSE_PILL_STATUS[r.status] ?? 'dm-pill'}>{ROTULO_STATUS[r.status] ?? r.status}</span>
                            </td>
                            {modo === 'raio' && (
                              <td data-rotulo="Distância" className="dm-mono">
                                {formatarDistancia(Number((r as ResultadoRelatorioRegiao).distancia_metros))}
                              </td>
                            )}
                            <td data-rotulo="Data" className="dm-mono">
                              {new Date(r.data_registro).toLocaleDateString('pt-BR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Paginacao total={encontradas.length} pagina={pagina} porPagina={porPagina} aoMudar={setPagina} />
                </>
              )}
            </>
          )}
        </section>
      )}

      {abertaId !== null && <ModalOcorrencia ocorrenciaId={abertaId} aoFechar={() => setAbertaId(null)} aoMudar={modo === 'raio' ? recarregar : recarregarEstado} />}

      {exportando && exportacao && (
        <ModalExportar
          titulo={exportacao.titulo}
          subtitulo={exportacao.subtitulo}
          relatorio={exportacao.relatorio}
          pdf={exportacao.pdf}
          previa={[
            { numero: filtradas.length.toLocaleString('pt-BR'), rotulo: filtrosAtivos ? 'Ocorrências (filtradas)' : 'Ocorrências' },
            { numero: altas.toLocaleString('pt-BR'), rotulo: 'De gravidade alta' },
          ]}
          aoFechar={() => setExportando(false)}
        />
      )}
    </>
  );
}