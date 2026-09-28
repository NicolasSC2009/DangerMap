import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiDownload, FiPrinter, FiRefreshCw } from 'react-icons/fi';
import { ModalOcorrencia } from '../../components/ocorrencia/ModalOcorrencia';
import { ROTULO_GRAVIDADE, ROTULO_STATUS, ORDEM_GRAVIDADE, ORDEM_STATUS } from '../../theme/rotulos';
import type { Gravidade, StatusOcorrencia } from '@shared/types';
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
import { CLASSE_PILL_STATUS, aoTeclarLinha } from './componentes/TabelaOcorrenciasRecentes';
import { baixarCsv, carimboData, csvRelatorioRegiao } from './utils/csv';

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

export function AbaRelatorioRegiao() {
  const [params, setParams] = useSearchParams();
  const [centro, setCentro] = useState<Coordenada | null>(() => lerCentroDaUrl(params));
  const [raio, setRaio] = useState<number>(() => (params.get('raio') ? limitarRaio(Number(params.get('raio'))) : RAIO_PADRAO_M));
  const [gravidades, setGravidades] = useState<Set<Gravidade>>(() => new Set(ORDEM_GRAVIDADE));
  const [statuses, setStatuses] = useState<Set<StatusOcorrencia>>(() => new Set(ORDEM_STATUS));
  const [abertaId, setAbertaId] = useState<number | null>(null);
  const { resultados, buscando, recarregar } = useBuscaRegiao(centro, raio);

  // Mantém centro/raio na URL (deep link / recarregar a página).
  useEffect(
    function () {
      if (!centro) return;
      const t = window.setTimeout(function () {
        setParams({ lat: centro.lat.toFixed(6), lng: centro.lng.toFixed(6), raio: String(raio) }, { replace: true });
      }, 500);
      return () => window.clearTimeout(t);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [centro?.lat, centro?.lng, raio]
  );

  const filtrados = useMemo(
    () => (resultados ?? []).filter((r) => gravidades.has(r.gravidade) && statuses.has(r.status)),
    [resultados, gravidades, statuses]
  );

  const pontos: PontoResultado[] = useMemo(
    () =>
      filtrados.map((r) => ({
        id: r.id,
        lat: Number(r.latitude),
        lng: Number(r.longitude),
        gravidade: r.gravidade,
        rotulo: r.descricao ? (r.descricao.length > 40 ? `${r.descricao.slice(0, 40)}…` : r.descricao) : `Ocorrência #${r.id}`,
      })),
    [filtrados]
  );

  function alternar<T>(conjunto: Set<T>, valor: T, definir: (s: Set<T>) => void) {
    const novo = new Set(conjunto);
    if (novo.has(valor)) novo.delete(valor);
    else novo.add(valor);
    definir(novo);
  }

  function exportarCsv() {
    if (!centro) return;
    baixarCsv(csvRelatorioRegiao(filtrados, { lat: centro.lat, lng: centro.lng, raioMetros: raio }), `extracao-regional-${carimboData()}.csv`);
  }

  const temResultado = !!centro && !!resultados;
  const filtrosAtivos = gravidades.size < ORDEM_GRAVIDADE.length || statuses.size < ORDEM_STATUS.length;

  return (
    <>
      <CabecalhoAba
        eyebrow="Relatórios"
        titulo="Extração regional"
        subtitulo="Clique no mapa para definir o centro e arraste o ponto ou a alça para ajustar o raio. A tabela considera apenas as ocorrências dentro do círculo."
        acoes={
          <>
            <button type="button" className="dm-btn dm-btn--ghost dm-btn--pequeno" onClick={exportarCsv} disabled={!temResultado || filtrados.length === 0}>
              <FiDownload aria-hidden="true" /> Baixar CSV
            </button>
            <button type="button" className="dm-btn dm-btn--primario dm-btn--pequeno" onClick={() => window.print()} disabled={!temResultado}>
              <FiPrinter aria-hidden="true" /> Imprimir / PDF
            </button>
          </>
        }
      />

      <section className="dm-painel dm-admin-painel dm-admin-painel--ferramenta">
        <FerramentaRaio
          centro={centro}
          raioMetros={raio}
          aoMudarCentro={setCentro}
          aoMudarRaio={setRaio}
          pontos={pontos}
          aoClicarPonto={setAbertaId}
        >
          <div className="dm-admin-previa dm-admin-previa--lateral" aria-live="polite">
            <div>
              <div className="dm-admin-previa__num">
                {!centro ? '—' : buscando && !resultados ? '…' : filtrados.length.toLocaleString('pt-BR')}
              </div>
              <div className="dm-admin-previa__rotulo">{filtrosAtivos ? 'Ocorrências (filtradas)' : 'Ocorrências na área'}</div>
            </div>
            <div className="dm-admin-previa__dir">
              <div className="dm-admin-previa__num">{areaKm2(raio)}</div>
              <div className="dm-admin-previa__rotulo">km² abrangidos</div>
            </div>
          </div>
        </FerramentaRaio>
      </section>

      <section className="dm-painel dm-admin-painel dm-admin-nao-imprimir">
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
            <span className="dm-rotulo">Status</span>
            <div className="dm-chips" role="group" aria-label="Filtrar por status">
              {ORDEM_STATUS.map((s) => (
                <button key={s} type="button" className="dm-chip dm-chip--claro" aria-pressed={statuses.has(s)} onClick={() => alternar(statuses, s, setStatuses)}>
                  {ROTULO_STATUS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="dm-painel dm-admin-painel">
        <div className="dm-admin-so-impressao dm-admin-impressao-cabecalho">
          <strong>DangerMap · Extração regional</strong>
          {centro && (
            <span>
              Centro {centro.lat.toFixed(5)}, {centro.lng.toFixed(5)} · raio {formatarRaio(raio)} km · {areaKm2(raio)} km² · gerado em{' '}
              {new Date().toLocaleString('pt-BR')}
            </span>
          )}
        </div>

        <div className="dm-painel-cabecalho">
          <h3>Ocorrências na área</h3>
          <span className="dm-painel-nota">
            {!centro
              ? 'Escolha um ponto no mapa'
              : buscando
                ? 'Buscando…'
                : resultados
                  ? `${filtrados.length} de ${resultados.length}`
                  : ''}
            {centro && !buscando && (
              <button type="button" className="dm-admin-link-botao dm-admin-nao-imprimir" onClick={recarregar} aria-label="Buscar novamente">
                <FiRefreshCw aria-hidden="true" />
              </button>
            )}
          </span>
        </div>

        {!centro ? (
          <p className="dm-admin-vazio">Clique em qualquer ponto do mapa (ou use "Minha localização") para escolher o centro da busca.</p>
        ) : !resultados ? (
          <div className="dm-admin-esqueleto" aria-hidden="true" />
        ) : filtrados.length === 0 ? (
          <p className="dm-admin-vazio">
            {resultados.length === 0 ? 'Nenhuma ocorrência dentro do raio informado.' : 'Nenhuma ocorrência com os filtros selecionados.'}
          </p>
        ) : (
          <div className="dm-tabela-wrap">
            <table className="dm-tabela dm-tabela--empilhada">
              <thead>
                <tr>
                  <th scope="col">Descrição</th>
                  <th scope="col">Gravidade</th>
                  <th scope="col">Status</th>
                  <th scope="col">Distância</th>
                  <th scope="col">Data</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((r) => (
                  <tr
                    key={r.id}
                    className="dm-tabela__clicavel"
                    tabIndex={0}
                    onClick={() => setAbertaId(r.id)}
                    onKeyDown={aoTeclarLinha(() => setAbertaId(r.id))}
                    aria-label={`Abrir ocorrência #${r.id}`}
                  >
                    <td data-rotulo="Descrição" className="dm-admin-celula-texto">
                      {r.descricao || <em className="dm-admin-apagado">sem descrição</em>}
                    </td>
                    <td data-rotulo="Gravidade">
                      <span className={`dm-severidade dm-severidade--${r.gravidade}`}>
                        <span className="dm-severidade__ponto" aria-hidden="true" />
                        {ROTULO_GRAVIDADE[r.gravidade] ?? r.gravidade}
                      </span>
                    </td>
                    <td data-rotulo="Status">
                      <span className={CLASSE_PILL_STATUS[r.status] ?? 'dm-pill'}>{ROTULO_STATUS[r.status] ?? r.status}</span>
                    </td>
                    <td data-rotulo="Distância" className="dm-mono">
                      {formatarDistancia(Number(r.distancia_metros))}
                    </td>
                    <td data-rotulo="Data" className="dm-mono">
                      {new Date(r.data_registro).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {abertaId !== null && <ModalOcorrencia ocorrenciaId={abertaId} aoFechar={() => setAbertaId(null)} aoMudar={recarregar} />}
    </>
  );
}
