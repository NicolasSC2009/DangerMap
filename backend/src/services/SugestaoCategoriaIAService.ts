import { CategoriaRepository } from '../repositories/CategoriaRepository.js';
import { GEMINI_API_KEY, GEMINI_ENDPOINT } from '../config/gemini.js';
import { SugestaoCategoria } from './SugestaoCategoriaService.js';

const categoriaRepository = new CategoriaRepository();
const TIMEOUT_MS = 10000;
const SEM_CATEGORIA = 'nenhuma';

// Abaixo disso a IA "chutou": melhor não sugerir nada do que sugerir errado.
const CONFIANCA_MINIMA = 0.55;

function montarPrompt(categorias: Array<{ nome: string; descricao?: string | null }>, descricaoUsuario?: string): string {
  const lista = categorias
    .map(function (c) { return `- ${c.nome}${c.descricao ? `: ${c.descricao}` : ''}`; })
    .join('\n');

  const contexto = descricaoUsuario && descricaoUsuario.trim()
    ? `\nO autor do relato escreveu: "${descricaoUsuario.trim().slice(0, 500)}". Use como contexto, ` +
      'mas a imagem manda se os dois discordarem.\n'
    : '';

  return (
    'Você é um classificador de fotos de problemas de infraestrutura urbana e segurança ' +
    'reportados por cidadãos em um aplicativo de mapa de perigos (DangerMap).\n' +
    `Categorias disponíveis:\n${lista}\n\n` +
    'Regras para decidir:\n' +
    '- Escolha a categoria mais ESPECÍFICA para o problema principal em destaque na foto.\n' +
    '- Animal vivo na via = "Animal na Pista"; animal sem vida = "Animal Morto na Via".\n' +
    '- Água cobrindo a rua = "Alagamento"; piso apenas molhado, com óleo, lama ou areia = "Pista Escorregadia".\n' +
    '- Buraco/cratera na rua = "Buraco na Via"; calçada ou piso irregular onde uma pessoa pode cair = "Risco de Queda".\n' +
    '- Fogo ou fumaça = "Foco de Incêndio". Veículos batidos = "Acidente de Trânsito".\n' +
    '- Se a foto não for de rua/via pública, estiver ilegível, ou não mostrar claramente nenhum dos problemas, ' +
    `responda "${SEM_CATEGORIA}" com confiança baixa. Nunca invente.\n` +
    'A confiança vai de 0 a 1 e deve refletir sua certeza real.' +
    contexto +
    '\nResponda sempre em JSON.'
  );
}

export class SugestaoCategoriaIAService {
  static async sugerirPorImagem(
    bufferImagem: Buffer,
    mimeType: string,
    descricaoUsuario?: string
  ): Promise<SugestaoCategoria> {
    if (!GEMINI_API_KEY) {
      throw new Error('Sugestão por imagem indisponível: GEMINI_API_KEY não configurada.');
    }

    const categorias = await categoriaRepository.listarTodas();
    if (categorias.length === 0) {
      return { categoriaId: null, categoriaNome: null, confianca: 0 };
    }

    const nomesCategorias = categorias.map(function (c) { return c.nome; });
    const opcoesEnum = [...nomesCategorias, SEM_CATEGORIA];

    const corpo = {
      contents: [
        {
          parts: [
            { text: montarPrompt(categorias, descricaoUsuario) },
            { inlineData: { mimeType, data: bufferImagem.toString('base64') } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            categoria: { type: 'STRING', enum: opcoesEnum },
            confianca: { type: 'NUMBER' },
          },
          required: ['categoria', 'confianca'],
        },
      },
    };

    const controle = new AbortController();
    const timeout = setTimeout(function () { controle.abort(); }, TIMEOUT_MS);

    try {
      const resposta = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
        signal: controle.signal,
      });

      if (!resposta.ok) {
        const detalhe = await resposta.text().catch(function () { return ''; });
        throw new Error(`Gemini respondeu com status ${resposta.status}: ${detalhe}`);
      }

      const json = (await resposta.json()) as any;
      const textoResposta = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textoResposta) {
        throw new Error('Resposta da IA veio vazia.');
      }

      const resultado = JSON.parse(textoResposta) as { categoria: string; confianca: number };

      if (!resultado.categoria || resultado.categoria === SEM_CATEGORIA) {
        return { categoriaId: null, categoriaNome: null, confianca: 0 };
      }

      const categoriaEncontrada = categorias.find(function (c) { return c.nome === resultado.categoria; });
      if (!categoriaEncontrada) {
        return { categoriaId: null, categoriaNome: null, confianca: 0 };
      }

      const confianca = Math.max(0, Math.min(1, Number(resultado.confianca) || 0));
      if (confianca < CONFIANCA_MINIMA) {
        return { categoriaId: null, categoriaNome: null, confianca: 0 };
      }

      return {
        categoriaId: categoriaEncontrada.id,
        categoriaNome: categoriaEncontrada.nome,
        confianca: Number(confianca.toFixed(2)),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
