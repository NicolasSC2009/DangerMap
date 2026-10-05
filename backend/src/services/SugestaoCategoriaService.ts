import { CategoriaRepository } from '../repositories/CategoriaRepository.js';

const categoriaRepository = new CategoriaRepository();

const REGEX_DIACRITICOS = new RegExp('[̀-ͯ]', 'g');

// Palavras muito comuns no português que, apesar de terem 3+ letras, não
// carregam significado nenhum para a comparação.
const PALAVRAS_IRRELEVANTES = new Set([
  'com', 'para', 'que', 'uma', 'uns', 'das', 'dos', 'nas', 'nos', 'nao',
  'sim', 'nem', 'nesta', 'neste', 'isso', 'este', 'esta', 'essa',
  'esse', 'nele', 'nela', 'nada', 'tem', 'ter', 'foi', 'ser', 'sao',
  'sera', 'muito', 'pouco', 'todo', 'toda',
]);

// Texto sem acento, minúsculo e com espaços simples — base de toda comparação.
function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(REGEX_DIACRITICOS, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function palavrasRelevantes(texto: string): string[] {
  return normalizarTexto(texto)
    .split(' ')
    .filter(function (palavra) {
      return palavra.length >= 3 && !PALAVRAS_IRRELEVANTES.has(palavra);
    });
}

type Termo = [termo: string, peso: number];

// Termos (já sem acento) que indicam cada categoria, com peso: 4 = quase
// inequívoco, 3 = forte, 2 = bom indício, 1 = fraco (só ajuda a desempatar).
// A comparação é por início de palavra ("buraco" casa "buracos"/"esburacado"
// não; "esburac" casa) e frases casam como um todo. A chave é o nome da
// categoria normalizado; categorias novas caem no fallback por nome/descrição.
const TERMOS_POR_CATEGORIA: Record<string, Termo[]> = {
  'buraco na via': [
    ['buraco', 3], ['esburac', 3], ['cratera', 3], ['rachadura', 2], ['asfalto', 2],
    ['pavimento', 2], ['cavidade', 2], ['bueiro', 2], ['tampa de bueiro', 3], ['depressao', 1],
  ],
  'alagamento': [
    ['alagament', 4], ['alagad', 3], ['alaga', 3], ['enchente', 4], ['inunda', 4],
    ['enxurrada', 3], ['agua acumulada', 4], ['acumulo de agua', 4], ['agua na rua', 3],
    ['empoca', 2], ['transbord', 2], ['submers', 2], ['nivel da agua', 2], ['chuva', 1],
  ],
  'acidente de transito': [
    ['acidente', 3], ['colisao', 4], ['colidiu', 4], ['bateu', 3], ['batida', 3],
    ['atropel', 3], ['capot', 4], ['engavet', 4], ['tombou', 2], ['moto caida', 3],
    ['carro batido', 4], ['ambulancia', 1], ['samu', 1], ['vitima', 1],
  ],
  'animal morto na via': [
    ['animal morto', 5], ['cachorro morto', 5], ['gato morto', 5], ['cavalo morto', 5],
    ['carcaca', 4], ['cadaver', 3], ['morto', 2], ['partido ao meio', 4], ['atropelado', 2],
  ],
  'animal na pista': [
    ['vaca', 3], ['boi|', 3], ['bois|', 3], ['cavalo', 3], ['gado|', 3], ['capivara', 3], ['bovino', 3],
    ['porco', 3], ['ovelha', 3], ['cabra', 3], ['jumento', 3], ['cachorro', 2],
    ['animal', 2], ['atravessando', 2], ['solto', 1], ['na pista', 1],
  ],
  'assalto ou roubo': [
    ['assalt', 4], ['roub', 4], ['furt', 3], ['arrastao', 4], ['ladrao', 4], ['ladroes', 4], ['bandid', 4],
    ['sequestro', 3], ['tiroteio', 3], ['violencia', 2], ['arma de fogo', 3], ['armado', 3],
    ['assaltante', 4], ['bala', 1],
  ],
  'foco de incendio': [
    ['incendi', 5], ['queimada', 5], ['pegando fogo', 5], ['fogo', 3], ['fumaca', 3],
    ['chamas', 3], ['queimando', 3], ['bombeiro', 2], ['ateou', 3],
  ],
  'iluminacao publica': [
    ['iluminac', 4], ['lampada', 3], ['luminaria', 3], ['poste', 3], ['sem luz', 4],
    ['escuro', 2], ['escuridao', 3], ['apagad', 1], ['breu', 2], ['fiacao', 2], ['luz|', 1], ['luzes|', 1],
  ],
  'obra na via': [
    ['obra', 3], ['escavac', 3], ['vala|', 3], ['valas|', 3], ['entulho', 2], ['construc', 2], ['tapume', 2],
    ['canteiro', 2], ['maquina', 1], ['cone|', 1], ['cones|', 1], ['trabalhador', 1],
  ],
  'pista escorregadia': [
    ['escorreg', 4], ['derrap', 4], ['oleo', 3], ['lama', 3], ['barro', 3], ['pista molhada', 3],
    ['aderencia', 3], ['areia na pista', 3], ['chao liso', 3], ['liso', 2], ['cascalho', 2],
  ],
  'risco de queda': [
    ['calcada', 3], ['desnivel', 3], ['tropec', 3], ['piso solto', 3], ['piso molhado', 3],
    ['piso quebrado', 3], ['queda', 2], ['caiu', 2], ['cair', 2], ['degrau', 2], ['escada', 2],
    ['corrimao', 2], ['ladrilho', 2], ['passarela', 1],
  ],
  'sinalizacao danificada': [
    ['semaforo', 4], ['sinalizac', 3], ['placa', 3], ['faixa apagada', 4], ['faixa de pedestre', 3],
    ['faixa', 2], ['sinal apagado', 4], ['sinal de transito', 3], ['arrancad', 2], ['sem placa', 3],
    ['sinal', 1],
  ],
  'vazamento de gas': [
    ['gas|', 4], ['cheiro de gas', 5], ['botijao', 3], ['gasoduto', 4], ['cheiro forte', 3],
    ['odor', 2], ['explosao', 2], ['vazament', 1],
  ],
  'via interditada': [
    ['interdit', 4], ['bloquead', 3], ['bloqueio', 3], ['bloquei', 3], ['desmoronament', 3],
    ['deslizament', 3], ['arvore caida', 4], ['queda de arvore', 4], ['arvore', 2],
    ['sem passagem', 3], ['impedindo passagem', 3], ['barreira', 2], ['fechada', 2], ['manifestac', 2],
  ],
};

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Termo terminado em "|" só casa a palavra inteira (evita "gas" casar "gasolina").
function pontuarPorTermos(textoNormalizado: string, termos: Termo[]): number {
  let pontuacao = 0;
  for (const [termo, peso] of termos) {
    const palavraInteira = termo.endsWith('|');
    const base = escaparRegex(termo.replace('|', '').trim());
    const regex = new RegExp(palavraInteira ? `(^| )${base}( |$)` : `(^| )${base}`);
    if (regex.test(textoNormalizado)) {
      pontuacao += peso;
    }
  }
  return pontuacao;
}

export interface SugestaoCategoria {
  categoriaId: number | null;
  categoriaNome: string | null;
  confianca: number;
}

export interface CategoriaConsultavel {
  id: number;
  nome: string;
  descricao?: string | null;
}

// Pontuação por palavras-chave para categorias que o admin criou depois e
// ainda não têm dicionário: compara o texto com o nome (peso 2) e a
// descrição (peso 1) da categoria.
function pontuarCategoriaDesconhecida(palavrasDescricao: Set<string>, categoria: CategoriaConsultavel): number {
  let pontuacao = 0;
  for (const palavra of palavrasRelevantes(categoria.nome)) {
    if (palavrasDescricao.has(palavra)) pontuacao += 2;
  }
  for (const palavra of palavrasRelevantes(categoria.descricao || '')) {
    if (palavrasDescricao.has(palavra)) pontuacao += 1;
  }
  return pontuacao;
}

const PONTUACAO_MINIMA = 2;
const PONTUACAO_CONFIANCA_TOTAL = 6;

// Lógica pura de pontuação - sem I/O, fácil de testar. Exportada separada de
// sugerirPorTexto (que busca as categorias no banco).
export function calcularSugestaoPorTexto(
  descricao: string,
  categorias: CategoriaConsultavel[]
): SugestaoCategoria {
  const textoNormalizado = normalizarTexto(descricao || '');
  const palavrasDescricao = new Set(palavrasRelevantes(descricao || ''));
  const vazio: SugestaoCategoria = { categoriaId: null, categoriaNome: null, confianca: 0 };

  if (palavrasDescricao.size === 0 || categorias.length === 0) {
    return vazio;
  }

  const pontuadas = categorias
    .map(function (categoria) {
      const termos = TERMOS_POR_CATEGORIA[normalizarTexto(categoria.nome)];
      const pontuacao = termos
        ? pontuarPorTermos(textoNormalizado, termos)
        : pontuarCategoriaDesconhecida(palavrasDescricao, categoria);
      return { categoria, pontuacao };
    })
    .filter(function (item) { return item.pontuacao > 0; })
    .sort(function (a, b) { return b.pontuacao - a.pontuacao; });

  const melhor = pontuadas[0];
  if (!melhor || melhor.pontuacao < PONTUACAO_MINIMA) {
    return vazio;
  }

  // Confiança cai quando outra categoria também pontuou bem (texto ambíguo).
  const segundo = pontuadas[1];
  const penalidade = segundo ? 0.5 * (segundo.pontuacao / melhor.pontuacao) : 0;
  const confianca = Math.min(1, melhor.pontuacao / PONTUACAO_CONFIANCA_TOTAL) * (1 - penalidade);

  return {
    categoriaId: melhor.categoria.id,
    categoriaNome: melhor.categoria.nome,
    confianca: Number(confianca.toFixed(2)),
  };
}

export class SugestaoCategoriaService {
  // Sugestão instantânea (sem chamada externa) baseada na descrição digitada.
  // Complementa a análise de imagem por IA (SugestaoCategoriaIAService).
  static async sugerirPorTexto(descricao: string): Promise<SugestaoCategoria> {
    const categorias = await categoriaRepository.listarTodas();
    return calcularSugestaoPorTexto(descricao, categorias);
  }
}
