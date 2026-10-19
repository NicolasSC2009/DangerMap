import type { EstatisticasDashboard } from '@shared/types';
import { carimboData } from '../utils/csv';
import { relatorioEstatisticas } from '../utils/relatorios';
import { ModalExportar } from './ModalExportar';

interface ModalExportarRelatorioProps {
  dados: EstatisticasDashboard;
  aoFechar: () => void;
}

// Relatório geral do painel (visão geral): PDF, Excel ou CSV.
export function ModalExportarRelatorio(props: ModalExportarRelatorioProps) {
  const registros30Dias = props.dados.serieTemporal.reduce((acc, d) => acc + d.total, 0);
  return (
    <ModalExportar
      titulo="Exportar relatório geral"
      subtitulo="Totais gerais e ocorrências por situação, gravidade e categoria. Excel e CSV incluem também o dia a dia dos últimos 30 dias."
      relatorio={relatorioEstatisticas(props.dados, `relatorio-dangermap-${carimboData()}`)}
      pdf={{ url: '/admin/dashboard/relatorio.pdf' }}
      previa={[
        { numero: props.dados.totais.totalOcorrencias.toLocaleString('pt-BR'), rotulo: 'Ocorrências no total' },
        { numero: registros30Dias.toLocaleString('pt-BR'), rotulo: 'Nos últimos 30 dias' },
      ]}
      nota={`Dados gerados em ${new Date(props.dados.geradoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}.`}
      aoFechar={props.aoFechar}
    />
  );
}