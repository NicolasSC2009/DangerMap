export type GravidadeOcorrencia = 'baixo' | 'medio' | 'alto';

const NIVEIS: GravidadeOcorrencia[] = ['baixo', 'medio', 'alto'];
const REGEX_DIACRITICOS = new RegExp('[̀-ͯ]', 'g');

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(REGEX_DIACRITICOS, '').toLowerCase();
}

// Gravidade-base de cada categoria (o quanto o problema, por natureza, põe
// vidas ou a circulação em risco). Chave: nome normalizado, sem acento.
const BASE_POR_CATEGORIA: Record<string, GravidadeOcorrencia> = {
  'acidente de transito': 'alto',
  'alagamento': 'alto',
  'assalto ou roubo': 'alto',
  'foco de incendio': 'alto',
  'vazamento de gas': 'alto',
  'animal morto na via': 'medio',
  'animal na pista': 'medio',
  'buraco na via': 'medio',
  'pista escorregadia': 'medio',
  'risco de queda': 'medio',
  'via interditada': 'medio',
  'iluminacao publica': 'baixo',
  'obra na via': 'baixo',
  'sinalizacao danificada': 'baixo',
};

// Categorias novas (criadas pelo admin) ainda não estão na tabela acima:
// estima pela palavra no nome/descrição, e cai em "médio" se nada casar.
const PALAVRAS_BASE_ALTA = ['incendio', 'fogo', 'gas', 'explos', 'assalto', 'roubo', 'acidente', 'alagament', 'enchente', 'inundac', 'desabament', 'eletric', 'fio'];
const PALAVRAS_BASE_BAIXA = ['sinaliza', 'iluminac', 'lampada', 'poste', 'obra', 'pintura', 'lixo', 'mato'];

// Palavras da descrição que indicam que o caso é pior (ou mais leve) que o
// normal da categoria. Comparação por prefixo, já sem acento.
const PALAVRAS_AGRAVANTES = [
  'grande', 'enorme', 'gigante', 'gigantesc', 'profund', 'fundo', 'urgente', 'urgencia',
  'perigos', 'grave', 'gravissim', 'crianca', 'idoso', 'ferid', 'vitima', 'morte', 'morreu',
  'explos', 'chama', 'fogo', 'bloquei', 'bloquead', 'interdit', 'impossivel', 'sem passagem',
  'oleo', 'arma de fogo', 'armado', 'sangue', 'desmai', 'risco de vida', 'ja caiu', 'cairam',
];
const PALAVRAS_ATENUANTES = ['pequen', 'leve', 'raso', 'superficial', 'ja foi resolvid', 'quase nada', 'pouco', 'discret'];

function contemAlgum(textoNormalizado: string, termos: string[]): boolean {
  return termos.some(function (termo) {
    return new RegExp(`(^|[^a-z])${termo}`).test(textoNormalizado);
  });
}

export function gravidadeBase(nomeCategoria: string, descricaoCategoria?: string | null): GravidadeOcorrencia {
  const nome = normalizar(nomeCategoria);
  if (BASE_POR_CATEGORIA[nome]) {
    return BASE_POR_CATEGORIA[nome];
  }
  const texto = normalizar(`${nomeCategoria} ${descricaoCategoria || ''}`);
  if (contemAlgum(texto, PALAVRAS_BASE_ALTA)) return 'alto';
  if (contemAlgum(texto, PALAVRAS_BASE_BAIXA)) return 'baixo';
  return 'medio';
}

// Gravidade definida automaticamente: parte da categoria e sobe/desce um
// nível conforme as palavras da descrição. Determinística e instantânea.
export function calcularGravidadeAutomatica(
  nomeCategoria: string,
  descricao?: string | null,
  descricaoCategoria?: string | null
): GravidadeOcorrencia {
  let indice = NIVEIS.indexOf(gravidadeBase(nomeCategoria, descricaoCategoria));

  const texto = normalizar(descricao || '');
  if (texto.trim()) {
    const agrava = contemAlgum(texto, PALAVRAS_AGRAVANTES);
    const atenua = contemAlgum(texto, PALAVRAS_ATENUANTES);
    if (agrava && !atenua) indice += 1;
    else if (atenua && !agrava) indice -= 1;
  }

  return NIVEIS[Math.max(0, Math.min(NIVEIS.length - 1, indice))];
}
