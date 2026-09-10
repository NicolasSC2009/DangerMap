import { CategoriaRepository } from '../repositories/CategoriaRepository.js';

const categoriaRepository = new CategoriaRepository();

const REGEX_DIACRITICOS = new RegExp('[̀-ͯ]', 'g');

function normalizar(texto: string): string[] {
  return texto
    .normalize('NFD')
    .replace(REGEX_DIACRITICOS, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(function (palavra) {
      return palavra.length >= 3;
    });
}

export interface SugestaoCategoria {
  categoriaId: number | null;
  categoriaNome: string | null;
  confianca: number;
}

export class SugestaoCategoriaService {
  // Sugestão baseada em correspondência de palavras-chave entre a descrição
  // e o nome/descrição de cada categoria ativa. É instantânea (sem chamada
  // externa) - um placeholder rápido para a análise de imagem por IA real
  // (RF14), que depende de um provedor de visão computacional ainda não
  // configurado no projeto.
  static async sugerirPorTexto(descricao: string): Promise<SugestaoCategoria> {
    const categorias = await categoriaRepository.listarTodas();
    const palavrasDescricao = new Set(normalizar(descricao || ''));

    if (palavrasDescricao.size === 0 || categorias.length === 0) {
      return { categoriaId: null, categoriaNome: null, confianca: 0 };
    }

    let melhor: { id: number; nome: string; pontuacao: number } | null = null;

    for (const categoria of categorias) {
      const palavrasCategoria = normalizar(`${categoria.nome} ${categoria.descricao || ''}`);

      let pontuacao = 0;
      for (const palavra of palavrasCategoria) {
        if (palavrasDescricao.has(palavra)) {
          pontuacao += 1;
        }
      }

      if (pontuacao > 0 && (!melhor || pontuacao > melhor.pontuacao)) {
        melhor = { id: categoria.id, nome: categoria.nome, pontuacao };
      }
    }

    if (!melhor) {
      return { categoriaId: null, categoriaNome: null, confianca: 0 };
    }

    const confianca = Math.min(1, melhor.pontuacao / Math.max(3, palavrasDescricao.size));

    return {
      categoriaId: melhor.id,
      categoriaNome: melhor.nome,
      confianca: Number(confianca.toFixed(2)),
    };
  }
}
