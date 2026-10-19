import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiAlertTriangle, FiArrowUpRight, FiCheckCircle, FiDownload, FiMap, FiRefreshCw, FiTrendingUp, FiUsers } from 'react-icons/fi';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { ROTULO_GRAVIDADE, ROTULO_STATUS, ORDEM_GRAVIDADE, ORDEM_STATUS, COR_GRAVIDADE, COR_STATUS } from '../../theme/rotulos';
import type { EstatisticasDashboard } from '@shared/types';
import { CabecalhoAba } from './componentes/CabecalhoAba';
import { CartaoEstatistica } from './componentes/CartaoEstatistica';
import { GraficoBarras, type PontoSerie } from './componentes/GraficoBarras';
import { LegendaCategorias } from './componentes/LegendaCategorias';
import { TabelaOcorrenciasRecentes } from './componentes/TabelaOcorrenciasRecentes';
import { ModalExportarRelatorio } from './componentes/ModalExportarRelatorio';
import { ModalExtracaoRegional } from './componentes/ModalExtracaoRegional';

type Janela = 14 | 30;

function chaveDia(data: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}`;
}

// A série do backend só traz dias com registro; completa os dias vazios
// com zero para o gráfico não "pular" datas.
function completarSerie(serie: EstatisticasDashboard['serieTemporal'], dias: number): PontoSerie[] {
  const porDia = new Map<string, number>();
  for (const item of serie) porDia.set(String(item.dia).slice(0, 10), Number(item.total) || 0);
  const hoje = new Date();
  const resultado: PontoSerie[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - i);
    const chave = chaveDia(d);
    resultado.push({ dia: chave, total: porDia.get(chave) ?? 0 });
  }
  return resultado;
}

function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 5) return 'Boa madrugada';
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

const soma = (lista: PontoSerie[]) => lista.reduce((acc, p) => acc + p.total, 0);

export function AbaVisaoGeral() {
  const { usuario } = useAuth();
  const [dados, setDados] = useState<EstatisticasDashboard | null>(null);
  const [erro, setErro] = useState(false);
  const [janela, setJanela] = useState<Janela>(14);
  const [modalExportar, setModalExportar] = useState(false);
  const [modalExtracao, setModalExtracao] = useState(false);
  const [versao, setVersao] = useState(0);

  useEffect(
    function () {
      setErro(false);
      api
        .get<EstatisticasDashboard>('/admin/dashboard/estatisticas')
        .then((r) => setDados(r.data))
        .catch(function () {
          setErro(true);
          toast.error('Não foi possível carregar as estatísticas.');
        });
    },
    [versao]
  );

  const serie30 = useMemo(() => (dados ? completarSerie(dados.serieTemporal, 30) : []), [dados]);
  const serieVisivel = janela === 30 ? serie30 : serie30.slice(-14);
  const ultimos7 = soma(serie30.slice(-7));
  const seteAnteriores = soma(serie30.slice(-14, -7));

  const primeiroNome = usuario?.nome?.split(' ')[0] ?? '';
  const titulo = primeiroNome ? `${saudacao()}, ${primeiroNome}` : saudacao();
  const subtitulo = 'Acompanhe o que acontece no mapa, modere denúncias e exporte relatórios.';

  if (!dados) {
    return (
      <>
        <CabecalhoAba titulo={titulo} subtitulo={subtitulo} />
        {erro ? (
          <div className="dm-painel dm-admin-erro">
            <p>Não foi possível carregar as estatísticas.</p>
            <button type="button" className="dm-btn dm-btn--ghost dm-btn--pequeno" onClick={() => setVersao((v) => v + 1)}>
              <FiRefreshCw aria-hidden="true" /> Tentar de novo
            </button>
          </div>
        ) : (
          <div className="dm-admin-visao" aria-busy="true">
            <div className="dm-admin-area-hero dm-admin-esqueleto" />
            <div className="dm-admin-area-kpis">
              <div className="dm-admin-kpi-grade">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="dm-admin-esqueleto" />
                ))}
              </div>
            </div>
            <div className="dm-admin-area-grafico dm-admin-esqueleto" />
          </div>
        )}
        {modalExtracao && <ModalExtracaoRegional aoFechar={() => setModalExtracao(false)} />}
      </>
    );
  }

  const t = dados.totais;
  const mediaConfirmacoes = t.totalOcorrencias > 0 ? t.totalConfirmacoes / t.totalOcorrencias : 0;
  const porStatus = new Map(dados.ocorrenciasPorStatus.map((i) => [i.status, i.total]));
  const porGravidade = new Map(dados.ocorrenciasPorGravidade.map((i) => [i.gravidade, i.total]));
  const totalGravidade = ORDEM_GRAVIDADE.reduce((acc, g) => acc + (porGravidade.get(g) ?? 0), 0);

  // Variação da última semana em relação à anterior.
  let variacao: { texto: string; tom: 'bom' | 'ruim' | 'neutro' };
  if (seteAnteriores === 0) {
    variacao = ultimos7 > 0 ? { texto: 'novo', tom: 'neutro' } : { texto: 'sem registros', tom: 'neutro' };
  } else {
    const pct = Math.round(((ultimos7 - seteAnteriores) / seteAnteriores) * 100);
    // Mais perigos registrados não é "bom": aqui a cor só diz subiu (laranja) ou caiu (verde).
    variacao = { texto: `${pct > 0 ? '+' : ''}${pct}%`, tom: pct > 0 ? 'ruim' : 'bom' };
  }

  return (
    <>
      <CabecalhoAba titulo={titulo} subtitulo={subtitulo} />

      <div className="dm-admin-visao">
        {/* ---------- total + situação ---------- */}
        <section className="dm-painel dm-admin-area-hero dm-entrada" aria-label="Ocorrências totais">
          <div className="dm-admin-hero__topo">
            <span className="dm-admin-hero__rotulo">Ocorrências totais</span>
            <span className="dm-admin-etiqueta dm-admin-etiqueta--neutro">Todas</span>
          </div>
          <div className="dm-admin-hero__valor">{t.totalOcorrencias.toLocaleString('pt-BR')}</div>
          <div className="dm-admin-hero__delta">
            <span className="dm-admin-etiqueta dm-admin-etiqueta--bom">
              <FiArrowUpRight aria-hidden="true" /> {ultimos7.toLocaleString('pt-BR')}
            </span>
            <span className="dm-admin-kpi__complemento">nos últimos 7 dias</span>
          </div>

          <div className="dm-admin-hero__acoes dm-admin-nao-imprimir">
            <button type="button" className="dm-admin-botao dm-admin-botao--escuro" onClick={() => setModalExportar(true)}>
              <FiDownload aria-hidden="true" /> Exportar relatório
            </button>
            <button type="button" className="dm-admin-botao" onClick={() => setModalExtracao(true)}>
              <FiMap aria-hidden="true" /> Extração por raio
            </button>
          </div>

          <div className="dm-admin-situacao">
            <div className="dm-admin-situacao__titulo">
              <span>Situação</span>
              <span className="dm-mono">{t.totalOcorrencias.toLocaleString('pt-BR')} no total</span>
            </div>
            <div className="dm-admin-situacao__grade">
              {ORDEM_STATUS.map((status) => {
                const valor = porStatus.get(status) ?? 0;
                const pct = t.totalOcorrencias > 0 ? Math.round((valor / t.totalOcorrencias) * 100) : 0;
                return (
                  <div key={status} className="dm-admin-situacao__item" style={{ '--c': COR_STATUS[status] } as React.CSSProperties}>
                    <span className="dm-admin-situacao__ponto" aria-hidden="true" />
                    <strong>{valor.toLocaleString('pt-BR')}</strong>
                    <span>{ROTULO_STATUS[status]}</span>
                    <small className="dm-mono">{pct}%</small>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* ---------- quatro indicadores ---------- */}
        <div className="dm-admin-area-kpis">
        <section className="dm-admin-kpi-grade" aria-label="Indicadores">
          <CartaoEstatistica
            indice={1}
            destaque
            icone={<FiTrendingUp />}
            rotulo="Novas em 7 dias"
            valor={ultimos7}
            etiqueta={variacao.texto}
            tomEtiqueta={variacao.tom}
            complemento="vs. semana anterior"
          />
          <CartaoEstatistica
            indice={2}
            icone={<FiUsers />}
            rotulo="Usuários"
            valor={t.totalUsuarios}
            etiqueta={`${t.totalUsuariosAtivos.toLocaleString('pt-BR')} ativos`}
            tomEtiqueta="bom"
          />
          <CartaoEstatistica
            indice={3}
            icone={<FiAlertTriangle />}
            rotulo="Denúncias"
            valor={t.totalDenuncias}
            etiqueta="Ver fila"
            tomEtiqueta="ruim"
            complemento={<Link to="/admin/moderacao">moderar →</Link>}
          />
          <CartaoEstatistica
            indice={4}
            icone={<FiCheckCircle />}
            rotulo="Confirmações"
            valor={t.totalConfirmacoes}
            etiqueta={`${mediaConfirmacoes.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}`}
            tomEtiqueta="neutro"
            complemento="por ocorrência"
          />
        </section>

        <section className="dm-painel dm-admin-gravidade dm-entrada" style={{ '--i': 5 } as React.CSSProperties} aria-label="Por gravidade">
          <div className="dm-admin-situacao__titulo">
            <span>Por gravidade</span>
            <span className="dm-mono">{totalGravidade.toLocaleString('pt-BR')} ocorrências</span>
          </div>
          <div
            className="dm-admin-pilha"
            role="img"
            aria-label={ORDEM_GRAVIDADE.map((g) => `${ROTULO_GRAVIDADE[g]}: ${porGravidade.get(g) ?? 0}`).join(', ')}
          >
            {ORDEM_GRAVIDADE.map((g) => {
              const valor = porGravidade.get(g) ?? 0;
              if (valor === 0 || totalGravidade === 0) return null;
              return <span key={g} style={{ flexGrow: valor, background: COR_GRAVIDADE[g] }} title={`${ROTULO_GRAVIDADE[g]}: ${valor}`} />;
            })}
          </div>
          <ul className="dm-admin-pilha__legenda">
            {ORDEM_GRAVIDADE.map((g) => (
              <li key={g}>
                <span className="dm-admin-situacao__ponto" style={{ background: COR_GRAVIDADE[g] }} aria-hidden="true" />
                {ROTULO_GRAVIDADE[g]} <strong className="dm-mono">{(porGravidade.get(g) ?? 0).toLocaleString('pt-BR')}</strong>
              </li>
            ))}
          </ul>
        </section>
        </div>

        {/* ---------- registros por dia ---------- */}
        <section className="dm-painel dm-admin-area-grafico dm-entrada" style={{ '--i': 2 } as React.CSSProperties}>
          <div className="dm-painel-cabecalho">
            <div>
              <h3>Registros por dia</h3>
              <p className="dm-admin-painel__sub">Últimos {janela} dias · {soma(serieVisivel).toLocaleString('pt-BR')} registros</p>
            </div>
            <div className="dm-admin-segmentado" role="group" aria-label="Período do gráfico">
              {([14, 30] as Janela[]).map((j) => (
                <button key={j} type="button" aria-pressed={janela === j} onClick={() => setJanela(j)}>
                  {j} dias
                </button>
              ))}
            </div>
          </div>
          <GraficoBarras serie={serieVisivel} />
        </section>

        {/* ---------- categorias ---------- */}
        <section className="dm-painel dm-admin-area-categorias dm-entrada" style={{ '--i': 3 } as React.CSSProperties}>
          <div className="dm-painel-cabecalho">
            <div>
              <h3>Por categoria</h3>
              <p className="dm-admin-painel__sub">Todas as ocorrências</p>
            </div>
          </div>
          <LegendaCategorias itens={dados.ocorrenciasPorCategoria} />
        </section>

        {/* ---------- recentes ---------- */}
        <TabelaOcorrenciasRecentes />
      </div>

      {modalExportar && <ModalExportarRelatorio dados={dados} aoFechar={() => setModalExportar(false)} />}
      {modalExtracao && <ModalExtracaoRegional aoFechar={() => setModalExtracao(false)} />}
    </>
  );
}
