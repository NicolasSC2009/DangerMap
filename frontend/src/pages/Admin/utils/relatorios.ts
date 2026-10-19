// Monta os relatórios do painel em uma estrutura única e a converte para planilha (CSV ou XLSX).
// O PDF é gerado no servidor (mesmos dados e filtros).
import type { EstatisticasDashboard, ResultadoRelatorioEstado, ResultadoRelatorioRegiao } from '@shared/types';
import { ROTULO_GRAVIDADE, ROTULO_STATUS, ORDEM_GRAVIDADE, ORDEM_STATUS } from '../../../theme/rotulos';
import { baixarArquivo, baixarCsv, gerarCsv } from './csv';
import { gerarXlsx, type PlanilhaXlsx } from './xlsx';

type Celula = string | number | null | undefined;

export type FormatoRelatorio = 'pdf' | 'xlsx' | 'csv';

export interface Relatorio {
  titulo: string;
  /** Nome do arquivo, sem a extensão. */
  nomeArquivo: string;
  meta: Array<[string, Celula]>;
  resumos: Array<{ titulo: string; colunas: [string, string]; linhas: Array<[string, number]> }>;
  tabela?: { nome: string; cabecalho: string[]; linhas: Celula[][]; larguras?: number[] };
}

export const TIPO_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function agora(): string {
  return new Date().toLocaleString('pt-BR');
}

export function relatorioEstatisticas(dados: EstatisticasDashboard, nomeArquivo: string): Relatorio {
  const t = dados.totais;
  return {
    titulo: 'DangerMap — Relatório administrativo',
    nomeArquivo,
    meta: [['Gerado em', new Date(dados.geradoEm).toLocaleString('pt-BR')]],
    resumos: [
      {
        titulo: 'Totais',
        colunas: ['Indicador', 'Valor'],
        linhas: [
          ['Ocorrências', t.totalOcorrencias],
          ['Usuários', t.totalUsuarios],
          ['Usuários ativos', t.totalUsuariosAtivos],
          ['Denúncias', t.totalDenuncias],
          ['Confirmações', t.totalConfirmacoes],
        ],
      },
      {
        titulo: 'Ocorrências por situação',
        colunas: ['Situação', 'Total'],
        linhas: dados.ocorrenciasPorStatus.map((i) => [ROTULO_STATUS[i.status] ?? String(i.status ?? 'Sem situação'), i.total]),
      },
      {
        titulo: 'Ocorrências por gravidade',
        colunas: ['Gravidade', 'Total'],
        linhas: dados.ocorrenciasPorGravidade.map((i) => [ROTULO_GRAVIDADE[i.gravidade] ?? String(i.gravidade ?? 'Sem gravidade'), i.total]),
      },
      {
        titulo: 'Ocorrências por categoria',
        colunas: ['Categoria', 'Total'],
        linhas: [...dados.ocorrenciasPorCategoria].sort((a, b) => b.total - a.total).map((i) => [i.categoriaNome, i.total]),
      },
    ],
    tabela: {
      nome: 'Por dia',
      cabecalho: ['Dia', 'Registros'],
      linhas: dados.serieTemporal.map((i) => [String(i.dia).slice(0, 10).split('-').reverse().join('/'), i.total]),
      larguras: [14, 12],
    },
  };
}

type LinhaOcorrencia = ResultadoRelatorioRegiao | ResultadoRelatorioEstado;

export function relatorioOcorrencias(opcoes: {
  titulo: string;
  nomeArquivo: string;
  meta: Array<[string, Celula]>;
  linhas: LinhaOcorrencia[];
  comDistancia?: boolean;
}): Relatorio {
  const { linhas } = opcoes;
  const porCategoria = new Map<string, number>();
  for (const l of linhas) porCategoria.set(l.categoria ?? 'Sem categoria', (porCategoria.get(l.categoria ?? 'Sem categoria') ?? 0) + 1);

  const cabecalho = ['Nº', 'Data', 'Categoria', 'Gravidade', 'Situação', ...(opcoes.comDistancia ? ['Distância (m)'] : []), 'Descrição', 'Latitude', 'Longitude'];
  return {
    titulo: opcoes.titulo,
    nomeArquivo: opcoes.nomeArquivo,
    meta: [...opcoes.meta, ['Gerado em', agora()], ['Ocorrências', linhas.length]],
    resumos: [
      {
        titulo: 'Por gravidade',
        colunas: ['Gravidade', 'Total'],
        linhas: [...ORDEM_GRAVIDADE].reverse().map((g) => [ROTULO_GRAVIDADE[g], linhas.filter((l) => l.gravidade === g).length]),
      },
      {
        titulo: 'Por situação',
        colunas: ['Situação', 'Total'],
        linhas: ORDEM_STATUS.map((s) => [ROTULO_STATUS[s], linhas.filter((l) => l.status === s).length]),
      },
      {
        titulo: 'Por categoria',
        colunas: ['Categoria', 'Total'],
        linhas: [...porCategoria.entries()].sort((a, b) => b[1] - a[1]),
      },
    ],
    tabela: {
      nome: 'Ocorrências',
      cabecalho,
      linhas: linhas.map((l) => [
        l.id,
        new Date(l.data_registro).toLocaleString('pt-BR'),
        l.categoria ?? 'Sem categoria',
        ROTULO_GRAVIDADE[l.gravidade] ?? l.gravidade,
        ROTULO_STATUS[l.status] ?? l.status,
        ...(opcoes.comDistancia ? [Number((l as ResultadoRelatorioRegiao).distancia_metros)] : []),
        l.descricao ?? '',
        Number(l.latitude),
        Number(l.longitude),
      ]),
      larguras: opcoes.comDistancia ? [8, 18, 24, 12, 12, 14, 60, 12, 12] : [8, 18, 24, 12, 12, 60, 12, 12],
    },
  };
}

// ---------- CSV: tudo numa folha só (resumos primeiro, depois a tabela) ----------

export function relatorioParaCsv(rel: Relatorio): Celula[][] {
  const linhas: Celula[][] = [[rel.titulo], ...rel.meta.map(([k, v]) => [k, v] as Celula[]), []];
  for (const r of rel.resumos) {
    linhas.push([r.titulo], [...r.colunas], ...r.linhas.map((l) => [...l] as Celula[]), []);
  }
  if (rel.tabela) linhas.push([rel.tabela.nome], rel.tabela.cabecalho, ...rel.tabela.linhas);
  return linhas;
}

// ---------- XLSX: aba "Resumo" + aba da tabela ----------

export function relatorioParaPlanilhas(rel: Relatorio): PlanilhaXlsx[] {
  const linhas: Celula[][] = [];
  const titulo: number[] = [];
  const secao: number[] = [];
  const cabecalho: number[] = [];

  titulo.push(linhas.length);
  linhas.push([rel.titulo]);
  for (const [k, v] of rel.meta) linhas.push([k, v]);
  linhas.push([]);
  for (const r of rel.resumos) {
    secao.push(linhas.length);
    linhas.push([r.titulo]);
    cabecalho.push(linhas.length);
    linhas.push([...r.colunas]);
    for (const l of r.linhas) linhas.push([...l]);
    linhas.push([]);
  }

  const abas: PlanilhaXlsx[] = [{ nome: 'Resumo', linhas, linhasTitulo: titulo, linhasSecao: secao, linhasCabecalho: cabecalho, larguras: [34, 22] }];
  if (rel.tabela) {
    abas.push({ nome: rel.tabela.nome, linhas: [rel.tabela.cabecalho, ...rel.tabela.linhas], linhasCabecalho: [0], larguras: rel.tabela.larguras });
  }
  return abas;
}

export function baixarRelatorioPlanilha(rel: Relatorio, formato: 'xlsx' | 'csv') {
  if (formato === 'csv') {
    baixarCsv(relatorioParaCsv(rel), `${rel.nomeArquivo}.csv`);
    return;
  }
  baixarArquivo(gerarXlsx(relatorioParaPlanilhas(rel)), `${rel.nomeArquivo}.xlsx`, TIPO_XLSX);
}

// Só para testes manuais: mesmo conteúdo do CSV como texto.
export function relatorioComoTextoCsv(rel: Relatorio): string {
  return gerarCsv(relatorioParaCsv(rel));
}

// Relatório de uma lista simples (moderação, perfis, categorias): só os metadados e a tabela.
export function relatorioLista(opcoes: {
  titulo: string;
  nomeArquivo: string;
  meta?: Array<[string, Celula]>;
  nomeAba: string;
  cabecalho: string[];
  linhas: Celula[][];
  larguras?: number[];
}): Relatorio {
  return {
    titulo: opcoes.titulo,
    nomeArquivo: opcoes.nomeArquivo,
    meta: [...(opcoes.meta ?? []), ['Gerado em', agora()], ['Itens', opcoes.linhas.length]],
    resumos: [],
    tabela: { nome: opcoes.nomeAba, cabecalho: opcoes.cabecalho, linhas: opcoes.linhas, larguras: opcoes.larguras },
  };
}
