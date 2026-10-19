import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiDownload, FiRefreshCw, FiX } from 'react-icons/fi';
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

const POR_PAGINA = 25;

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
  const [visiveis, setVisiveis] = useState(POR_PAGINA);
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

  // Ao mudar de filtro, volta para a primeira página da tabela.
  useEffect(
    function () {
      setVisiveis(POR_PAGINA);
    },
    [filtradas]
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
  const exibidas = filtradas.slice(0, visiveis);

  return (
    <>
      <CabecalhoAba
        titulo="Extração regional"
        subtitulo={
          modo === 'raio'
            ? 'Clique no mapa para definir o centro e arraste o ponto ou a alça para ajustar o raio. Os números consideram só as ocorrências dentro do círculo.'
            : 'Escolha um estado para ver a fronteira no mapa. Os números consideram só as ocorrências dentro do estado.'
        }
        acoes={
          <button type="button" className="dm-admin-botao dm-admin-botao--escuro dm-admin-botao--auto" onClick={() => setExportando(true)} disabled={!podeExportar}>
            <FiDownload aria-hidden="true" /> Baixar relatório
          </button>
        }
      />

      <div className="dm-admin-segmentado dm-admin-nao-imprimir" role="group" aria-label="Modo de extração">
        <button type="button" aria-pressed={modo === 'raio'} onClick={() => setModo('raio')}>
          Por raio
        </button>
        <button type="button" aria-pressed={modo === 'estado'} onClick={() => setModo('estado')}>
          Por estado
        </button>
      </div>

      <section className="dm-painel dm-admin-painel dm-admin-painel--ferramenta">
        {modo === 'raio' ? (
          <FerramentaRaio centro={centro} raioMetros={raio} aoMudarCentro={setCentro} aoMudarRaio={setRaio} pontos={pontos} aoClicarPonto={setAbertaId}>
            <div className="dm-admin-previa dm-admin-previa--lateral" aria-live="polite">
              <div>
                <div className="dm-admin-previa__num">{!centro ? '—' : carregando ? '…' : filtradas.length.toLocaleString('pt-BR')}</div>
                <div className="dm-admin-previa__rotulo">{filtrosAtivos ? 'Ocorrências (filtradas)' : 'Ocorrências na área'}</div>
              </div>
              <div className="dm-admin-previa__dir">
                <div className="dm-admin-previa__num">{areaKm2(raio)}</div>
                <div className="dm-admin-previa__rotulo">km² abrangidos</div>
              </div>
            </div>
          </FerramentaRaio>
        ) : (
          <FerramentaEstado uf={uf} aoMudarUf={setUf} poligono={dadosEstado?.poligono ?? null} pontos={pontos} aoClicarPonto={setAbertaId}>
            <div className="dm-admin-previa dm-admin-previa--lateral" aria-live="polite">
              <div>
                <div className="dm-admin-previa__num">{!uf ? '—' : carregando ? '…' : filtradas.length.toLocaleString('pt-BR')}</div>
                <div className="dm-admin-previa__rotulo">{filtrosAtivos ? 'Ocorrências (filtradas)' : 'Ocorrências no estado'}</div>
              </div>
              <div className="dm-admin-previa__dir">
                <div className="dm-admin-previa__num">{estadoAtual ? formatarAreaEstado(estadoAtual.areaKm2) : '—'}</div>
                <div className="dm-admin-previa__rotulo">km² abrangidos</div>
              </div>
            </div>
          </FerramentaEstado>
        )}
      </section>

      {/* ---------- filtros ---------- */}
      <section className="dm-painel dm-admin-painel dm-admin-nao-imprimir">
        <div className="dm-painel-cabecalho">
          <div>
            <h3>Filtros</h3>
            <p className="dm-admin-painel__sub">Valem para a tabela, para o mapa e para o relatório que você baixar.</p>
          </div>
          <button type="button" className="dm-btn dm-btn--ghost dm-btn--pequeno" onClick={limparFiltros} disabled={!filtrosAtivos}>
            <FiX aria-hidden="true" /> Limpar filtros
          </button>
        </div>

        <div className="dm-admin-filtros-grade">
          <div className="dm-campo-grupo">
            <span className="dm-rotulo">Gravidade</span>
            <div className="dm-chips" role="group" aria-label="Filtrar por gravidade">
              {ORDEM_GRAVIDADE.map((g) => (
                <button key={g} type="button" className="dm-chip dm-chip--claro" aria-pressed={gravidades.has(g)} onClick={() => alternar(gravidades, g, setGravidades)}>
                  <span className={`dm-severidade dm-severidade--${g}`}>
                    <span className="dm-severidade__ponto" aria-hidden="true" />
                  </span>
                  {ROTULO_GRAVIDADE[g]}
                </button>
              ))}
            </div>
          </div>
          <div className="dm-campo-grupo">
            <span className="dm-rotulo">Situação</span>
            <div className="dm-chips" role="group" aria-label="Filtrar por situação">
              {ORDEM_STATUS.map((s) => (
                <button key={s} type="button" className="dm-chip dm-chip--claro" aria-pressed={statuses.has(s)} onClick={() => alternar(statuses, s, setStatuses)}>
                  {ROTULO_STATUS[s]}
                </button>
              ))}
            </div>
          </div>
          <div className="dm-campo-grupo">
            <span className="dm-rotulo">Período</span>
            <div className="dm-chips" role="group" aria-label="Filtrar por período">
              {PERIODOS.map((p) => (
                <button key={p.dias} type="button" className="dm-chip dm-chip--claro" aria-pressed={dias === p.dias} onClick={() => setDias(p.dias)}>
                  {p.rotulo}
                </button>
              ))}
            </div>
          </div>
        </div>

        {categoriasDisponiveis.length > 0 && (
          <div className="dm-campo-grupo dm-admin-filtro-categorias">
            <span className="dm-rotulo">Categoria {categoriasSel.size === 0 && <em className="dm-admin-apagado">(todas)</em>}</span>
            <div className="dm-chips" role="group" aria-label="Filtrar por categoria">
              {categoriasDisponiveis.map((c) => (
                <button key={c.id} type="button" className="dm-chip dm-chip--claro" aria-pressed={categoriasSel.has(c.id)} onClick={() => alternar(categoriasSel, c.id, setCategoriasSel)}>
                  {c.nome} <span className="dm-admin-chip-total">{c.total}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ---------- resumo ---------- */}
      {todas && (
        <section className="dm-admin-resumo" aria-label="Resumo do resultado">
          <div className="dm-admin-resumo__item">
            <strong>{filtradas.length.toLocaleString('pt-BR')}</strong>
            <span>{filtrosAtivos ? `de ${total.toLocaleString('pt-BR')} ocorrências` : 'ocorrências'}</span>
          </div>
          <div className="dm-admin-resumo__item">
            <strong>{altas.toLocaleString('pt-BR')}</strong>
            <span>de gravidade alta</span>
          </div>
          <div className="dm-admin-resumo__item">
            <strong>{confirmadas.toLocaleString('pt-BR')}</strong>
            <span>confirmadas</span>
          </div>
          <div className="dm-admin-resumo__item">
            <strong>{resolvidas.toLocaleString('pt-BR')}</strong>
            <span>resolvidas</span>
          </div>
          <div className="dm-admin-resumo__pilha" role="img" aria-label="Distribuição por gravidade">
            {[...ORDEM_GRAVIDADE].reverse().map((g) => {
              const n = filtradas.filter((l) => l.gravidade === g).length;
              return n === 0 ? null : <span key={g} style={{ flexGrow: n, background: COR_GRAVIDADE[g] }} title={`${ROTULO_GRAVIDADE[g]}: ${n}`} />;
            })}
          </div>
        </section>
      )}

      {/* ---------- tabela ---------- */}
      <section className="dm-painel dm-admin-painel">
        <div className="dm-painel-cabecalho">
          <div>
            <h3>{modo === 'raio' ? 'Ocorrências na área' : 'Ocorrências no estado'}</h3>
            <p className="dm-admin-painel__sub">
              {modo === 'raio' && !centro
                ? 'Escolha um ponto no mapa'
                : modo === 'estado' && !uf
                  ? 'Escolha um estado'
                  : carregando
                    ? 'Buscando…'
                    : todas
                      ? `${filtradas.length} de ${total}`
                      : ''}
            </p>
          </div>
          {todas && !carregando && (
            <button type="button" className="dm-admin-link-botao dm-admin-nao-imprimir" onClick={modo === 'raio' ? recarregar : recarregarEstado} aria-label="Buscar novamente" title="Buscar novamente">
              <FiRefreshCw aria-hidden="true" />
            </button>
          )}
        </div>

        {modo === 'raio' && !centro ? (
          <p className="dm-admin-vazio">Clique em qualquer ponto do mapa (ou use "Minha localização") para escolher o centro da busca.</p>
        ) : modo === 'estado' && !uf ? (
          <p className="dm-admin-vazio">Selecione um estado no painel ao lado do mapa.</p>
        ) : !todas ? (
          <div className="dm-admin-esqueleto" aria-hidden="true" />
        ) : filtradas.length === 0 ? (
          <p className="dm-admin-vazio">{total === 0 ? 'Nenhuma ocorrência nessa área.' : 'Nenhuma ocorrência com os filtros selecionados.'}</p>
        ) : (
          <>
            <div className="dm-tabela-wrap">
              <table className="dm-tabela dm-tabela--empilhada">
                <thead>
                  <tr>
                    <th scope="col">Descrição</th>
                    <th scope="col">Categoria</th>
                    <th scope="col">Gravidade</th>
                    <th scope="col">Situação</th>
                    {modo === 'raio' && <th scope="col">Distância</th>}
                    <th scope="col">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {exibidas.map((r) => (
                    <tr key={r.id} className="dm-tabela__clicavel" tabIndex={0} onClick={() => setAbertaId(r.id)} onKeyDown={aoTeclarLinha(() => setAbertaId(r.id))} aria-label={`Abrir ocorrência #${r.id}`}>
                      <td data-rotulo="Descrição" className="dm-admin-celula-texto">
                        {r.descricao || <em className="dm-admin-apagado">sem descrição</em>}
                      </td>
                      <td data-rotulo="Categoria">{r.categoria ?? <em className="dm-admin-apagado">—</em>}</td>
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

            {filtradas.length > exibidas.length && (
              <div className="dm-admin-mais dm-admin-nao-imprimir">
                <button type="button" className="dm-btn dm-btn--ghost dm-btn--pequeno" onClick={() => setVisiveis((v) => v + POR_PAGINA)}>
                  Mostrar mais {Math.min(POR_PAGINA, filtradas.length - exibidas.length)}
                </button>
                <button type="button" className="dm-btn dm-btn--ghost dm-btn--pequeno" onClick={() => setVisiveis(filtradas.length)}>
                  Mostrar todas ({filtradas.length.toLocaleString('pt-BR')})
                </button>
              </div>
            )}
          </>
        )}
      </section>

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
