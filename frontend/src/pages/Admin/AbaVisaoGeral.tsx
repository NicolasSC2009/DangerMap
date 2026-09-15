import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { CORES } from '../../theme/cores';
import { api } from '../../services/api';
import { estilosAdmin as s } from './estilosAdmin';
import type { EstatisticasDashboard } from '@shared/types';

const CORES_CATEGORIA = [CORES.verdeSalada, CORES.laranja, CORES.verdeGarrafa, CORES.vermelhoAlerta, CORES.laranjaEscuro, CORES.tintaSuave];

export function AbaVisaoGeral() {
  const [dados, setDados] = useState<EstatisticasDashboard | null>(null);
  const [exportando, setExportando] = useState(false);

  useEffect(function () {
    api
      .get<EstatisticasDashboard>('/admin/dashboard/estatisticas')
      .then((r) => setDados(r.data))
      .catch(() => toast.error('Não foi possível carregar as estatísticas.'));
  }, []);

  async function exportarPdf() {
    setExportando(true);
    try {
      const resposta = await api.get('/admin/dashboard/relatorio.pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([resposta.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'relatorio-dangermap.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Não foi possível exportar o relatório agora.');
    } finally {
      setExportando(false);
    }
  }

  if (!dados) {
    return <p style={{ color: CORES.tintaSuave }}>Carregando estatísticas…</p>;
  }

  const maiorContagemDia = Math.max(1, ...dados.serieTemporal.map((d) => d.total));
  const totalCategorias = dados.ocorrenciasPorCategoria.reduce((acc, c) => acc + c.total, 0) || 1;

  return (
    <div>
      <div style={s.topbar}>
        <div>
          <span style={s.eyebrow}>Painel administrativo</span>
          <h1 style={s.titulo}>Visão geral</h1>
          <p style={s.subtitulo}>Resumo da atividade do DangerMap nos últimos 30 dias.</p>
        </div>
        <button style={s.btnPrimario} onClick={exportarPdf} disabled={exportando}>
          {exportando ? 'Gerando…' : 'Exportar PDF'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 22 }}>
        <CartaoEstatistica label="Ocorrências totais" valor={dados.totais.totalOcorrencias} />
        <CartaoEstatistica label="Usuários" valor={`${dados.totais.totalUsuarios} (${dados.totais.totalUsuariosAtivos} ativos)`} />
        <CartaoEstatistica label="Denúncias" valor={dados.totais.totalDenuncias} risco />
        <CartaoEstatistica label="Confirmações" valor={dados.totais.totalConfirmacoes} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={s.painel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontSize: 17, color: CORES.verdeGarrafa, fontWeight: 700 }}>Registros por dia</h3>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, color: '#9aa79e', textTransform: 'uppercase' }}>Últimos 30 dias</span>
          </div>
          {dados.serieTemporal.length === 0 ? (
            <p style={{ fontSize: 13, color: CORES.tintaSuave }}>Sem registros no período.</p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 150, paddingTop: 6 }}>
              {dados.serieTemporal.map((dia) => {
                const altura = Math.max(4, (dia.total / maiorContagemDia) * 130);
                const pico = dia.total === maiorContagemDia;
                return (
                  <div key={dia.dia} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 6 }} title={`${new Date(dia.dia).toLocaleDateString('pt-BR')}: ${dia.total}`}>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: 14,
                        height: altura,
                        borderRadius: '4px 4px 0 0',
                        background: pico
                          ? `linear-gradient(180deg, ${CORES.laranja} 0%, ${CORES.laranjaEscuro} 160%)`
                          : `linear-gradient(180deg, ${CORES.verdeSalada} 0%, ${CORES.verdeGarrafa} 160%)`,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={s.painel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontSize: 17, color: CORES.verdeGarrafa, fontWeight: 700 }}>Por categoria</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {dados.ocorrenciasPorCategoria.length === 0 ? (
              <p style={{ fontSize: 13, color: CORES.tintaSuave }}>Sem dados.</p>
            ) : (
              dados.ocorrenciasPorCategoria.map((cat, i) => (
                <div key={String(cat.categoriaId) + i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: CORES_CATEGORIA[i % CORES_CATEGORIA.length], flexShrink: 0 }} />
                  <span style={{ flex: 1, color: CORES.tinta }}>{cat.categoriaNome}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', color: CORES.tintaSuave, fontSize: 12 }}>
                    {Math.round((cat.total / totalCategorias) * 100)}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={s.painel}>
          <h3 style={{ fontSize: 17, color: CORES.verdeGarrafa, fontWeight: 700, marginBottom: 16 }}>Por status</h3>
          {dados.ocorrenciasPorStatus.map((item) => (
            <LinhaBarra key={item.status} rotulo={item.status} valor={item.total} total={dados.totais.totalOcorrencias} />
          ))}
        </div>
        <div style={s.painel}>
          <h3 style={{ fontSize: 17, color: CORES.verdeGarrafa, fontWeight: 700, marginBottom: 16 }}>Por gravidade</h3>
          {dados.ocorrenciasPorGravidade.map((item) => (
            <LinhaBarra key={item.gravidade} rotulo={item.gravidade} valor={item.total} total={dados.totais.totalOcorrencias} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CartaoEstatistica(props: { label: string; valor: number | string; risco?: boolean }) {
  return (
    <div style={s.statCard}>
      <div
        style={{
          position: 'absolute', top: 14, right: 16, width: 8, height: 8, borderRadius: '50%',
          backgroundColor: props.risco ? CORES.vermelhoAlerta : CORES.verdeSalada,
          boxShadow: props.risco ? `0 0 0 4px ${CORES.vermelhoAlerta}28` : `0 0 0 4px ${CORES.verdeSalada}28`,
        }}
      />
      <div style={s.statLabel}>{props.label}</div>
      <div style={s.statValue}>{props.valor}</div>
    </div>
  );
}

function LinhaBarra(props: { rotulo: string; valor: number; total: number }) {
  const pct = props.total > 0 ? Math.round((props.valor / props.total) * 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
        <span style={{ textTransform: 'capitalize', color: CORES.tinta }}>{props.rotulo}</span>
        <span style={{ color: CORES.tintaSuave, fontFamily: 'JetBrains Mono, monospace' }}>{props.valor}</span>
      </div>
      <div style={{ height: 6, borderRadius: 4, backgroundColor: `${CORES.verdeGarrafa}12` }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, backgroundColor: CORES.verdeSalada }} />
      </div>
    </div>
  );
}
