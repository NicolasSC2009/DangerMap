// Geração de CSV no cliente (sem dependências). Separador ";" e BOM UTF-8
// para o Excel em pt-BR abrir acentos e colunas corretamente.
import type { EstatisticasDashboard, ResultadoRelatorioRegiao } from '@shared/types';
import { ROTULO_GRAVIDADE, ROTULO_STATUS } from '../../../theme/rotulos';

type Celula = string | number | null | undefined;

const SEPARADOR = ';';

function escaparCelula(valor: Celula): string {
  if (valor === null || valor === undefined) return '';
  const texto = typeof valor === 'number' ? String(valor).replace('.', ',') : String(valor);
  if (/[";\r\n]/.test(texto)) return `"${texto.replace(/"/g, '""')}"`;
  return texto;
}

export function gerarCsv(linhas: Celula[][]): string {
  return '﻿' + linhas.map((linha) => linha.map(escaparCelula).join(SEPARADOR)).join('\r\n');
}

export function baixarArquivo(conteudo: BlobPart, nomeArquivo: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function baixarCsv(linhas: Celula[][], nomeArquivo: string) {
  baixarArquivo(gerarCsv(linhas), nomeArquivo, 'text/csv;charset=utf-8');
}

// "2026-09-28" — usado nos nomes de arquivo.
export function carimboData(data = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}`;
}

export function csvEstatisticas(dados: EstatisticasDashboard): Celula[][] {
  const t = dados.totais;
  const linhas: Celula[][] = [
    ['DangerMap - Relatório administrativo'],
    ['Gerado em', new Date(dados.geradoEm).toLocaleString('pt-BR')],
    [],
    ['Totais'],
    ['Indicador', 'Valor'],
    ['Ocorrências', t.totalOcorrencias],
    ['Usuários', t.totalUsuarios],
    ['Usuários ativos', t.totalUsuariosAtivos],
    ['Denúncias', t.totalDenuncias],
    ['Confirmações', t.totalConfirmacoes],
    [],
    ['Ocorrências por status'],
    ['Status', 'Total'],
    ...dados.ocorrenciasPorStatus.map((i) => [ROTULO_STATUS[i.status] ?? i.status, i.total]),
    [],
    ['Ocorrências por gravidade'],
    ['Gravidade', 'Total'],
    ...dados.ocorrenciasPorGravidade.map((i) => [ROTULO_GRAVIDADE[i.gravidade] ?? i.gravidade, i.total]),
    [],
    ['Ocorrências por categoria'],
    ['Categoria', 'Total'],
    ...dados.ocorrenciasPorCategoria.map((i) => [i.categoriaNome, i.total]),
    [],
    ['Registros por dia (últimos 30 dias)'],
    ['Dia', 'Total'],
    ...dados.serieTemporal.map((i) => [String(i.dia).slice(0, 10), i.total]),
  ];
  return linhas;
}

export function csvRelatorioRegiao(
  resultados: ResultadoRelatorioRegiao[],
  meta: { lat: number; lng: number; raioMetros: number }
): Celula[][] {
  return [
    ['DangerMap - Extração regional'],
    ['Centro (lat, lng)', `${meta.lat.toFixed(6)}, ${meta.lng.toFixed(6)}`],
    ['Raio (m)', meta.raioMetros],
    ['Gerado em', new Date().toLocaleString('pt-BR')],
    ['Ocorrências', resultados.length],
    [],
    ['ID', 'Descrição', 'Gravidade', 'Status', 'Distância (m)', 'Data de registro', 'Latitude', 'Longitude'],
    ...resultados.map((r) => [
      r.id,
      r.descricao ?? '',
      ROTULO_GRAVIDADE[r.gravidade] ?? r.gravidade,
      ROTULO_STATUS[r.status] ?? r.status,
      Number(r.distancia_metros),
      new Date(r.data_registro).toLocaleString('pt-BR'),
      r.latitude,
      r.longitude,
    ]),
  ];
}
