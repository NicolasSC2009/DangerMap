// Gerador de planilhas .xlsx sem dependências: monta os XMLs do formato Office Open XML
// e empacota num .zip (método "store", sem compressão). Abre no Excel, LibreOffice e Google Planilhas.

export type CelulaXlsx = string | number | null | undefined;

export interface PlanilhaXlsx {
  /** Nome da aba (até 31 caracteres, sem : \ / ? * [ ]). */
  nome: string;
  linhas: CelulaXlsx[][];
  /** Índices das linhas (começando em 0) com estilo de título, de cabeçalho de tabela e de seção. */
  linhasTitulo?: number[];
  linhasCabecalho?: number[];
  linhasSecao?: number[];
  /** Largura de cada coluna, em caracteres. */
  larguras?: number[];
}

const ESTILO = { padrao: 0, titulo: 1, cabecalho: 2, secao: 3 } as const;

function escaparXml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // caracteres de controle não são aceitos em XML
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

function nomeColuna(indice: number): string {
  let n = indice + 1;
  let nome = '';
  while (n > 0) {
    const resto = (n - 1) % 26;
    nome = String.fromCharCode(65 + resto) + nome;
    n = Math.floor((n - 1) / 26);
  }
  return nome;
}

function nomeAba(nome: string, usados: Set<string>): string {
  let base = nome.replace(/[:\\/?*[\]]/g, ' ').trim().slice(0, 31) || 'Planilha';
  let candidato = base;
  let n = 2;
  while (usados.has(candidato.toLowerCase())) {
    const sufixo = ` ${n++}`;
    candidato = base.slice(0, 31 - sufixo.length) + sufixo;
  }
  usados.add(candidato.toLowerCase());
  return candidato;
}

function xmlPlanilha(p: PlanilhaXlsx): string {
  const titulo = new Set(p.linhasTitulo ?? []);
  const cabecalho = new Set(p.linhasCabecalho ?? []);
  const secao = new Set(p.linhasSecao ?? []);
  const colunas = p.larguras?.length
    ? `<cols>${p.larguras.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>`
    : '';

  const linhas = p.linhas
    .map(function (linha, r) {
      const estilo = titulo.has(r) ? ESTILO.titulo : cabecalho.has(r) ? ESTILO.cabecalho : secao.has(r) ? ESTILO.secao : ESTILO.padrao;
      const atributoEstilo = estilo ? ` s="${estilo}"` : '';
      const celulas = linha
        .map(function (valor, c) {
          if (valor === null || valor === undefined || valor === '') return estilo ? `<c r="${nomeColuna(c)}${r + 1}"${atributoEstilo}/>` : '';
          const ref = `${nomeColuna(c)}${r + 1}`;
          if (typeof valor === 'number' && Number.isFinite(valor)) return `<c r="${ref}"${atributoEstilo}><v>${valor}</v></c>`;
          return `<c r="${ref}"${atributoEstilo} t="inlineStr"><is><t xml:space="preserve">${escaparXml(String(valor))}</t></is></c>`;
        })
        .join('');
      return `<row r="${r + 1}">${celulas}</row>`;
    })
    .join('');

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews>' +
    colunas +
    `<sheetData>${linhas}</sheetData></worksheet>`
  );
}

const ESTILOS_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<fonts count="4">' +
  '<font><sz val="11"/><name val="Calibri"/></font>' +
  '<font><b/><sz val="16"/><color rgb="FF003223"/><name val="Calibri"/></font>' +
  '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>' +
  '<font><b/><sz val="12"/><color rgb="FF003223"/><name val="Calibri"/></font>' +
  '</fonts>' +
  '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
  '<fill><patternFill patternType="solid"><fgColor rgb="FF003223"/><bgColor indexed="64"/></patternFill></fill></fills>' +
  '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="4">' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
  '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
  '<xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>' +
  '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
  '</cellXfs>' +
  '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
  '</styleSheet>';

// ---------- zip (sem compressão) ----------

const TABELA_CRC = (function () {
  const tabela = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabela[n] = c >>> 0;
  }
  return tabela;
})();

function crc32(dados: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < dados.length; i++) c = TABELA_CRC[(c ^ dados[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function u16(valor: number): number[] {
  return [valor & 0xff, (valor >>> 8) & 0xff];
}

function u32(valor: number): number[] {
  return [valor & 0xff, (valor >>> 8) & 0xff, (valor >>> 16) & 0xff, (valor >>> 24) & 0xff];
}

function empacotar(arquivos: Array<{ caminho: string; conteudo: string }>): Uint8Array<ArrayBuffer> {
  const codificador = new TextEncoder();
  const central: number[][] = [];
  let deslocamento = 0;
  // hora fixa (1980-01-01): o formato exige o campo, o Excel ignora
  const hora = u16(0);
  const data = u16((0 << 9) | (1 << 5) | 1);

  const blocos: Uint8Array[] = [];
  for (const arquivo of arquivos) {
    const nome = codificador.encode(arquivo.caminho);
    const dados = codificador.encode(arquivo.conteudo);
    const crc = crc32(dados);
    const cabecalho = [
      ...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...hora, ...data,
      ...u32(crc), ...u32(dados.length), ...u32(dados.length), ...u16(nome.length), ...u16(0),
    ];
    blocos.push(Uint8Array.from(cabecalho), nome, dados);
    central.push([
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...hora, ...data,
      ...u32(crc), ...u32(dados.length), ...u32(dados.length), ...u16(nome.length), ...u16(0), ...u16(0),
      ...u16(0), ...u16(0), ...u32(0), ...u32(deslocamento), ...Array.from(nome),
    ]);
    deslocamento += cabecalho.length + nome.length + dados.length;
  }

  const inicioCentral = deslocamento;
  const centralBytes = Uint8Array.from(central.flat());
  const fim = Uint8Array.from([
    ...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(arquivos.length), ...u16(arquivos.length),
    ...u32(centralBytes.length), ...u32(inicioCentral), ...u16(0),
  ]);

  const total = blocos.reduce((s, b) => s + b.length, 0) + centralBytes.length + fim.length;
  const saida = new Uint8Array(total);
  let pos = 0;
  for (const b of [...blocos, centralBytes, fim]) {
    saida.set(b, pos);
    pos += b.length;
  }
  return saida;
}

export function gerarXlsx(planilhas: PlanilhaXlsx[]): Uint8Array<ArrayBuffer> {
  const usados = new Set<string>();
  const nomes = planilhas.map((p) => nomeAba(p.nome, usados));

  const arquivos: Array<{ caminho: string; conteudo: string }> = [
    {
      caminho: '[Content_Types].xml',
      conteudo:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        planilhas
          .map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
          .join('') +
        '</Types>',
    },
    {
      caminho: '_rels/.rels',
      conteudo:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>',
    },
    {
      caminho: 'xl/workbook.xml',
      conteudo:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        '<sheets>' +
        nomes.map((n, i) => `<sheet name="${escaparXml(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') +
        '</sheets></workbook>',
    },
    {
      caminho: 'xl/_rels/workbook.xml.rels',
      conteudo:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        planilhas
          .map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
          .join('') +
        `<Relationship Id="rId${planilhas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
        '</Relationships>',
    },
    { caminho: 'xl/styles.xml', conteudo: ESTILOS_XML },
    ...planilhas.map((p, i) => ({ caminho: `xl/worksheets/sheet${i + 1}.xml`, conteudo: xmlPlanilha(p) })),
  ];

  return empacotar(arquivos);
}
