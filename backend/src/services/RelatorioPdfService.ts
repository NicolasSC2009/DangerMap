// Geração dos relatórios em PDF (pdfkit): visão geral do painel e extrações por área.
import PDFDocument from 'pdfkit';
import type { Response } from 'express';
import type { LinhaRelatorio } from './RelatorioGeograficoService.js';

const COR = {
  verde: '#003223',
  verdeClaro: '#8CC850',
  laranja: '#FF6400',
  texto: '#1b2420',
  suave: '#5c6a63',
  linha: '#ddd7cb',
  fundo: '#f6f2ea',
  branco: '#ffffff',
};

const ROTULO_STATUS: Record<string, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmada',
  resolvido: 'Resolvida',
  arquivado: 'Arquivada',
};

const ROTULO_GRAVIDADE: Record<string, string> = { baixo: 'Baixa', medio: 'Média', alto: 'Alta' };

const COR_GRAVIDADE: Record<string, string> = { baixo: '#8CC850', medio: '#FF6400', alto: '#a02617' };
const COR_STATUS: Record<string, string> = { pendente: '#b13f0f', confirmado: '#003223', resolvido: '#5c6a63', arquivado: '#a02617' };

const MARGEM = 40;
const LIMITE_LINHAS_PDF = 3000;

type Doc = InstanceType<typeof PDFDocument>;

function largura(doc: Doc): number {
  return doc.page.width - MARGEM * 2;
}

function limite(doc: Doc): number {
  return doc.page.height - 56;
}

function abrir(res: Response, nomeArquivo: string): Doc {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
  const doc = new PDFDocument({ size: 'A4', margin: MARGEM, bufferPages: true, info: { Title: nomeArquivo, Author: 'DangerMap' } });
  doc.pipe(res);
  return doc;
}

function cabecalho(doc: Doc, titulo: string, subtitulo: string) {
  doc.rect(0, 0, doc.page.width, 96).fill(COR.verde);
  doc.rect(0, 96, doc.page.width, 4).fill(COR.laranja);
  doc.fillColor(COR.verdeClaro).font('Helvetica-Bold').fontSize(10).text('DANGERMAP', MARGEM, 24, { characterSpacing: 2 });
  doc.fillColor(COR.branco).font('Helvetica-Bold').fontSize(21).text(titulo, MARGEM, 40, { width: largura(doc) });
  doc.fillColor('#cfe3c2').font('Helvetica').fontSize(10).text(subtitulo, MARGEM, 70, { width: largura(doc) });
  doc.y = 120;
  doc.x = MARGEM;
}

function secao(doc: Doc, texto: string) {
  if (doc.y > limite(doc) - 60) doc.addPage();
  doc.moveDown(0.6);
  doc.fillColor(COR.verde).font('Helvetica-Bold').fontSize(13).text(texto, MARGEM, doc.y);
  const y = doc.y + 2;
  doc.moveTo(MARGEM, y).lineTo(MARGEM + 36, y).lineWidth(2.5).strokeColor(COR.laranja).stroke();
  doc.y = y + 8;
  doc.x = MARGEM;
}

function cartoes(doc: Doc, itens: Array<{ rotulo: string; valor: string }>) {
  const espaco = 10;
  const w = (largura(doc) - espaco * (itens.length - 1)) / itens.length;
  const y = doc.y;
  itens.forEach(function (item, i) {
    const x = MARGEM + i * (w + espaco);
    doc.roundedRect(x, y, w, 58, 8).fill(COR.fundo);
    doc.fillColor(COR.verde).font('Helvetica-Bold').fontSize(20).text(item.valor, x + 12, y + 10, { width: w - 24, lineBreak: false });
    doc.fillColor(COR.suave).font('Helvetica').fontSize(8.5).text(item.rotulo.toUpperCase(), x + 12, y + 38, { width: w - 24, lineBreak: false, characterSpacing: 0.6 });
  });
  doc.y = y + 70;
  doc.x = MARGEM;
}

function barras(doc: Doc, itens: Array<{ rotulo: string; valor: number; cor?: string }>) {
  const total = itens.reduce((acc, i) => acc + i.valor, 0);
  const maior = Math.max(1, ...itens.map((i) => i.valor));
  const wRotulo = 130;
  const wValor = 70;
  const wBarra = largura(doc) - wRotulo - wValor;
  for (const item of itens) {
    if (doc.y > limite(doc) - 18) doc.addPage();
    const y = doc.y;
    doc.fillColor(COR.texto).font('Helvetica').fontSize(10).text(item.rotulo, MARGEM, y, { width: wRotulo - 8, lineBreak: false, ellipsis: true });
    doc.roundedRect(MARGEM + wRotulo, y + 2, wBarra, 8, 4).fill(COR.fundo);
    const preenchido = Math.max(item.valor > 0 ? 4 : 0, (item.valor / maior) * wBarra);
    if (preenchido > 0) doc.roundedRect(MARGEM + wRotulo, y + 2, preenchido, 8, 4).fill(item.cor ?? COR.verde);
    const pct = total > 0 ? Math.round((item.valor / total) * 100) : 0;
    doc.fillColor(COR.suave).font('Helvetica').fontSize(9).text(`${item.valor.toLocaleString('pt-BR')}  ·  ${pct}%`, MARGEM + wRotulo + wBarra + 8, y + 1, {
      width: wValor - 8,
      align: 'right',
      lineBreak: false,
    });
    doc.y = y + 18;
  }
  doc.x = MARGEM;
}

interface Coluna {
  titulo: string;
  largura: number;
  alinhar?: 'left' | 'right' | 'center';
  texto: (linha: LinhaRelatorio) => string;
  secundario?: (linha: LinhaRelatorio) => string;
  cor?: (linha: LinhaRelatorio) => string;
}

function tabela(doc: Doc, colunas: Coluna[], linhas: LinhaRelatorio[]) {
  const total = colunas.reduce((acc, c) => acc + c.largura, 0);
  const fator = largura(doc) / total;
  const larguras = colunas.map((c) => c.largura * fator);

  function cabecalhoTabela() {
    const y = doc.y;
    doc.rect(MARGEM, y, largura(doc), 20).fill(COR.verde);
    let x = MARGEM;
    colunas.forEach(function (c, i) {
      doc.fillColor(COR.branco).font('Helvetica-Bold').fontSize(7.5).text(c.titulo.toUpperCase(), x + 5, y + 6, {
        width: larguras[i] - 10,
        align: c.alinhar ?? 'left',
        lineBreak: false,
      });
      x += larguras[i];
    });
    doc.y = y + 20;
  }

  cabecalhoTabela();
  linhas.forEach(function (linha, indice) {
    doc.font('Helvetica').fontSize(8.5);
    const alturas = colunas.map(function (c, i) {
      const principal = doc.heightOfString(c.texto(linha) || '—', { width: larguras[i] - 10 });
      const secundario = c.secundario ? doc.heightOfString(c.secundario(linha), { width: larguras[i] - 10 }) : 0;
      return principal + secundario;
    });
    const altura = Math.max(...alturas) + 10;
    if (doc.y + altura > limite(doc)) {
      doc.addPage();
      cabecalhoTabela();
    }
    const y = doc.y;
    if (indice % 2 === 0) doc.rect(MARGEM, y, largura(doc), altura).fill('#faf8f3');
    let x = MARGEM;
    colunas.forEach(function (c, i) {
      const principal = c.texto(linha) || '—';
      doc.fillColor(c.cor ? c.cor(linha) : COR.texto).font(c.cor ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5).text(principal, x + 5, y + 5, {
        width: larguras[i] - 10,
        align: c.alinhar ?? 'left',
      });
      if (c.secundario) {
        doc.fillColor(COR.suave).font('Helvetica').fontSize(7.5).text(c.secundario(linha), x + 5, doc.y, { width: larguras[i] - 10, align: c.alinhar ?? 'left' });
      }
      x += larguras[i];
    });
    doc.moveTo(MARGEM, y + altura).lineTo(MARGEM + largura(doc), y + altura).lineWidth(0.5).strokeColor(COR.linha).stroke();
    doc.y = y + altura;
  });
  doc.x = MARGEM;
}

function rodapes(doc: Doc, geradoEm: string) {
  const { start, count } = doc.bufferedPageRange();
  for (let i = start; i < start + count; i++) {
    doc.switchToPage(i);
    const y = doc.page.height - 32;
    doc.moveTo(MARGEM, y - 6).lineTo(doc.page.width - MARGEM, y - 6).lineWidth(0.5).strokeColor(COR.linha).stroke();
    doc.fillColor(COR.suave).font('Helvetica').fontSize(8).text(`DangerMap · gerado em ${geradoEm}`, MARGEM, y, { lineBreak: false });
    doc.text(`Página ${i + 1} de ${count}`, MARGEM, y, { width: largura(doc), align: 'right', lineBreak: false });
  }
}

function contar<T extends string>(linhas: LinhaRelatorio[], campo: 'gravidade' | 'status', ordem: T[]) {
  return ordem.map((valor) => ({ valor, total: linhas.filter((l) => l[campo] === valor).length }));
}

function dataCurta(data: Date | string): string {
  return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

// ---------------------------------------------------------------------------
// Visão geral do painel
// ---------------------------------------------------------------------------

export interface DadosEstatisticas {
  totais: { totalOcorrencias: number; totalUsuarios: number; totalUsuariosAtivos: number; totalDenuncias: number; totalConfirmacoes: number };
  ocorrenciasPorStatus: Array<{ status: string | null; total: number }>;
  ocorrenciasPorGravidade: Array<{ gravidade: string | null; total: number }>;
  ocorrenciasPorCategoria: Array<{ categoriaNome: string; total: number }>;
  serieTemporal: Array<{ dia: string | Date; total: number }>;
}

export function gerarPdfEstatisticas(res: Response, dados: DadosEstatisticas) {
  const agora = new Date().toLocaleString('pt-BR');
  const doc = abrir(res, 'relatorio-dangermap.pdf');
  cabecalho(doc, 'Relatório administrativo', `Visão geral da plataforma · gerado em ${agora}`);

  const t = dados.totais;
  cartoes(doc, [
    { rotulo: 'Ocorrências', valor: t.totalOcorrencias.toLocaleString('pt-BR') },
    { rotulo: 'Usuários', valor: t.totalUsuarios.toLocaleString('pt-BR') },
    { rotulo: 'Denúncias', valor: t.totalDenuncias.toLocaleString('pt-BR') },
    { rotulo: 'Confirmações', valor: t.totalConfirmacoes.toLocaleString('pt-BR') },
  ]);
  doc.fillColor(COR.suave).font('Helvetica').fontSize(9).text(`${t.totalUsuariosAtivos.toLocaleString('pt-BR')} usuários ativos de ${t.totalUsuarios.toLocaleString('pt-BR')} cadastrados.`, MARGEM, doc.y - 6);

  secao(doc, 'Ocorrências por situação');
  barras(doc, dados.ocorrenciasPorStatus.map((i) => ({ rotulo: ROTULO_STATUS[i.status ?? ''] ?? 'Sem situação', valor: i.total, cor: COR_STATUS[i.status ?? ''] })));

  secao(doc, 'Ocorrências por gravidade');
  barras(doc, dados.ocorrenciasPorGravidade.map((i) => ({ rotulo: ROTULO_GRAVIDADE[i.gravidade ?? ''] ?? 'Sem gravidade', valor: i.total, cor: COR_GRAVIDADE[i.gravidade ?? ''] })));

  secao(doc, 'Ocorrências por categoria');
  barras(doc, [...dados.ocorrenciasPorCategoria].sort((a, b) => b.total - a.total).map((i) => ({ rotulo: i.categoriaNome, valor: i.total, cor: COR.verde })));

  if (dados.serieTemporal.length > 0) {
    secao(doc, 'Registros por dia (últimos 30 dias)');
    barras(
      doc,
      dados.serieTemporal.map((i) => ({ rotulo: dataCurta(i.dia), valor: Number(i.total), cor: COR.laranja }))
    );
  }

  rodapes(doc, agora);
  doc.end();
}

// ---------------------------------------------------------------------------
// Extrações por área (raio ou estado)
// ---------------------------------------------------------------------------

export interface OpcoesRelatorioOcorrencias {
  titulo: string;
  subtitulo: string;
  /** Linhas curtas com o que foi filtrado (ex.: "Gravidade: Alta, Média"). */
  filtros: string[];
  ocorrencias: LinhaRelatorio[];
  nomeArquivo: string;
  comDistancia?: boolean;
}

export function gerarPdfOcorrencias(res: Response, opcoes: OpcoesRelatorioOcorrencias) {
  const agora = new Date().toLocaleString('pt-BR');
  const doc = abrir(res, opcoes.nomeArquivo);
  cabecalho(doc, opcoes.titulo, opcoes.subtitulo);

  const linhas = opcoes.ocorrencias;
  cartoes(doc, [
    { rotulo: 'Ocorrências', valor: linhas.length.toLocaleString('pt-BR') },
    { rotulo: 'Confirmadas', valor: linhas.filter((l) => l.status === 'confirmado').length.toLocaleString('pt-BR') },
    { rotulo: 'Gravidade alta', valor: linhas.filter((l) => l.gravidade === 'alto').length.toLocaleString('pt-BR') },
    { rotulo: 'Resolvidas', valor: linhas.filter((l) => l.status === 'resolvido').length.toLocaleString('pt-BR') },
  ]);

  if (opcoes.filtros.length > 0) {
    doc.fillColor(COR.suave).font('Helvetica').fontSize(9).text(opcoes.filtros.join('   ·   '), MARGEM, doc.y - 6, { width: largura(doc) });
    doc.moveDown(0.4);
  }

  if (linhas.length === 0) {
    doc.moveDown(2);
    doc.fillColor(COR.suave).font('Helvetica').fontSize(12).text('Nenhuma ocorrência encontrada com esses filtros.', MARGEM, doc.y, { width: largura(doc), align: 'center' });
    rodapes(doc, agora);
    doc.end();
    return;
  }

  secao(doc, 'Por gravidade');
  barras(
    doc,
    contar(linhas, 'gravidade', ['alto', 'medio', 'baixo']).map((i) => ({ rotulo: ROTULO_GRAVIDADE[i.valor], valor: i.total, cor: COR_GRAVIDADE[i.valor] }))
  );
  secao(doc, 'Por situação');
  barras(
    doc,
    contar(linhas, 'status', ['pendente', 'confirmado', 'resolvido', 'arquivado']).map((i) => ({ rotulo: ROTULO_STATUS[i.valor], valor: i.total, cor: COR_STATUS[i.valor] }))
  );

  const porCategoria = new Map<string, number>();
  for (const l of linhas) porCategoria.set(l.categoria ?? 'Sem categoria', (porCategoria.get(l.categoria ?? 'Sem categoria') ?? 0) + 1);
  secao(doc, 'Por categoria');
  barras(
    doc,
    [...porCategoria.entries()].sort((a, b) => b[1] - a[1]).map(([rotulo, valor]) => ({ rotulo, valor, cor: COR.verde }))
  );

  doc.addPage();
  const exibidas = linhas.slice(0, LIMITE_LINHAS_PDF);
  secao(doc, `Ocorrências (${linhas.length.toLocaleString('pt-BR')})`);

  const colunas: Coluna[] = [
    { titulo: 'Nº', largura: 28, texto: (l) => String(l.id) },
    { titulo: 'Data', largura: 48, texto: (l) => dataCurta(l.data_registro) },
    { titulo: 'Gravidade', largura: 58, texto: (l) => ROTULO_GRAVIDADE[l.gravidade] ?? l.gravidade, cor: (l) => COR_GRAVIDADE[l.gravidade] ?? COR.texto },
    { titulo: 'Situação', largura: 58, texto: (l) => ROTULO_STATUS[l.status] ?? l.status },
    { titulo: 'Categoria', largura: 88, texto: (l) => l.categoria ?? 'Sem categoria' },
  ];
  if (opcoes.comDistancia) {
    colunas.push({
      titulo: 'Distância',
      largura: 60,
      alinhar: 'right',
      texto: (l) => {
        const m = Number(l.distancia_metros);
        return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} km`;
      },
    });
  }
  colunas.push({
    titulo: 'Descrição',
    largura: opcoes.comDistancia ? 180 : 238,
    texto: (l) => l.descricao ?? 'sem descrição',
    secundario: (l) => `${Number(l.latitude).toFixed(5)}, ${Number(l.longitude).toFixed(5)}`,
  });
  tabela(doc, colunas, exibidas);

  if (linhas.length > exibidas.length) {
    doc.moveDown();
    doc.fillColor(COR.suave).font('Helvetica-Oblique').fontSize(9).text(`Mostrando as ${exibidas.length.toLocaleString('pt-BR')} primeiras ocorrências. Para a lista completa, baixe a planilha.`, MARGEM, doc.y, { width: largura(doc) });
  }

  rodapes(doc, agora);
  doc.end();
}
