import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiDownload, FiMap, FiRefreshCw } from 'react-icons/fi';
import { api } from '../../services/api';
import { ROTULO_GRAVIDADE, ROTULO_STATUS, ORDEM_GRAVIDADE, ORDEM_STATUS, COR_GRAVIDADE, COR_STATUS } from '../../theme/rotulos';
import type { EstatisticasDashboard } from '@shared/types';
import { CabecalhoAba } from './componentes/CabecalhoAba';
import { CartaoEstatistica } from './componentes/CartaoEstatistica';
import { GraficoBarras, type PontoSerie } from './componentes/GraficoBarras';
import { LegendaCategorias } from './componentes/LegendaCategorias';
import { CartaoExtracao } from './componentes/CartaoExtracao';
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

export function AbaVisaoGeral() {
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
  const ultimos7 = serie30.slice(-7).reduce((acc, p) => acc + p.total, 0);

  const acoes = (
    <>
      <button type="button" className="dm-btn dm-btn--ghost dm-btn--pequeno" onClick={() => setModalExtracao(true)}>
        <FiMap aria-hidden="true" /> Extração regional
      </button>
      <button type="button" className="dm-btn dm-btn--primario dm-btn--pequeno" onClick={() => setModalExportar(true)} disabled={!dados}>
        <FiDownload aria-hidden="true" /> Exportar relatório
      </button>
    </>
  );

  if (!dados) {
    return (
      <>
        <CabecalhoAba eyebrow="Painel administrativo" titulo="Visão geral" subtitulo="Monitoramento geral e exportação de dados consolidados." acoes={acoes} />
        {erro ? (
          <div className="dm-painel dm-admin-erro">
            <p>Não foi possível carregar as estatísticas.</p>
            <button type="button" className="dm-btn dm-btn--ghost dm-btn--pequeno" onClick={() => setVersao((v) => v + 1)}>
              <FiRefreshCw aria-hidden="true" /> Tentar de novo
            </button>
          </div>
        ) : (
          <div className="dm-admin-visao" aria-busy="true">
            <div className="dm-admin-stats">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="dm-admin-stat dm-admin-esqueleto" />
              ))}
            </div>
          </div>
        )}
        {modalExtracao && <ModalExtracaoRegional aoFechar={() => setModalExtracao(false)} />}
      </>
    );
  }

  const t = dados.totais;
  const geradoEm = new Date(dados.geradoEm);
  const mediaConfirmacoes = t.totalOcorrencias > 0 ? t.totalConfirmacoes / t.totalOcorrencias : 0;
  const porStatus = new Map(dados.ocorrenciasPorStatus.map((i) => [i.status, i.total]));
  const porGravidade = new Map(dados.ocorrenciasPorGravidade.map((i) => [i.gravidade, i.total]));

  return (
    <>
      <CabecalhoAba
        eyebrow="Painel administrativo"
        titulo="Visão geral"
        subtitulo="Monitoramento geral e exportação de dados consolidados."
        acoes={acoes}
      />

      <div className="dm-admin-visao">
        <section className="dm-admin-stats" aria-label="Indicadores">
          <CartaoEstatistica
            indice={0}
            nota={`GERADO ÀS ${geradoEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
            rotulo="Ocorrências totais"
            valor={t.totalOcorrencias}
            delta={`+${ultimos7.toLocaleString('pt-BR')} nos últimos 7 dias`}
          />
          <CartaoEstatistica
            indice={1}
            nota="CADASTRADOS"
            rotulo="Usuários"
            valor={t.totalUsuarios}
            delta={`${t.totalUsuariosAtivos.toLocaleString('pt-BR')} ativos`}
          />
          <CartaoEstatistica
            indice={2}
            nota="TOTAL ACUMULADO"
            rotulo="Denúncias"
            valor={t.totalDenuncias}
            risco
            delta={<Link to="/admin/moderacao">Ver fila de moderação →</Link>}
          />
          <CartaoEstatistica
            indice={3}
            nota="PELA COMUNIDADE"
            rotulo="Confirmações"
            valor={t.totalConfirmacoes}
            delta={`${mediaConfirmacoes.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} por ocorrência`}
          />
        </section>

        <section className="dm-painel dm-admin-painel dm-admin-area-barras">
          <div className="dm-painel-cabecalho">
            <h3>Registros nos últimos {janela} dias</h3>
            <div className="dm-admin-segmentado" role="group" aria-label="Período do gráfico">
              {([14, 30] as Janela[]).map((j) => (
                <button key={j} type="button" aria-pressed={janela === j} onClick={() => setJanela(j)}>
                  {j} d
                </button>
              ))}
            </div>
          </div>
          <GraficoBarras serie={serieVisivel} />
        </section>

        <section className="dm-painel dm-admin-painel dm-admin-area-categorias">
          <div className="dm-painel-cabecalho">
            <h3>Por categoria</h3>
            <span className="dm-painel-nota">Todas as ocorrências</span>
          </div>
          <LegendaCategorias itens={dados.ocorrenciasPorCategoria} />
        </section>

        <div className="dm-admin-linha-3">
          <CartaoExtracao aoAbrirRapido={() => setModalExtracao(true)} />

          <section className="dm-painel dm-admin-painel">
            <div className="dm-painel-cabecalho">
              <h3>Por status</h3>
            </div>
            {ORDEM_STATUS.map((status) => (
              <LinhaBarra
                key={status}
                rotulo={ROTULO_STATUS[status]}
                valor={porStatus.get(status) ?? 0}
                total={t.totalOcorrencias}
                cor={COR_STATUS[status]}
              />
            ))}
          </section>

          <section className="dm-painel dm-admin-painel">
            <div className="dm-painel-cabecalho">
              <h3>Por gravidade</h3>
            </div>
            {ORDEM_GRAVIDADE.map((gravidade) => (
              <LinhaBarra
                key={gravidade}
                rotulo={ROTULO_GRAVIDADE[gravidade]}
                valor={porGravidade.get(gravidade) ?? 0}
                total={t.totalOcorrencias}
                cor={COR_GRAVIDADE[gravidade]}
              />
            ))}
          </section>
        </div>

        <TabelaOcorrenciasRecentes />
      </div>

      {modalExportar && <ModalExportarRelatorio dados={dados} aoFechar={() => setModalExportar(false)} />}
      {modalExtracao && <ModalExtracaoRegional aoFechar={() => setModalExtracao(false)} />}
    </>
  );
}

function LinhaBarra(props: { rotulo: string; valor: number; total: number; cor: string }) {
  const pct = props.total > 0 ? (props.valor / props.total) * 100 : 0;
  return (
    <div className="dm-admin-linha-barra" style={{ '--pct': `${pct}%`, '--c': props.cor } as React.CSSProperties}>
      <div className="dm-admin-linha-barra__topo">
        <span>{props.rotulo}</span>
        <span className="dm-mono">
          {props.valor.toLocaleString('pt-BR')} <small>· {Math.round(pct)}%</small>
        </span>
      </div>
      <div className="dm-admin-linha-barra__trilho" aria-hidden="true">
        <div className="dm-admin-linha-barra__preenchimento" />
      </div>
    </div>
  );
}
