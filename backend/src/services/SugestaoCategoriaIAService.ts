import { CategoriaRepository } from '../repositories/CategoriaRepository.js';
import { GEMINI_API_KEY, GEMINI_ENDPOINT } from '../config/gemini.js';
import { SugestaoCategoria } from './SugestaoCategoriaService.js';

const categoriaRepository = new CategoriaRepository();
const TIMEOUT_MS = 10000;
const SEM_CATEGORIA = 'nenhuma';

function montarPrompt(nomesCategorias: string[]): string {
  return (
    'Você é um classificador de fotos de problemas de infraestrutura urbana ' +
    'reportados por cidadãos em um aplicativo de mapa de perigos (DangerMap).\n' +
    `Categorias disponíveis: ${nomesCategorias.join(', ')}.\n` +
    `Analise a imagem anexada e responda com a categoria que melhor descreve o ` +
    `problema visível nela. Se a imagem não mostrar claramente nenhum desses ` +
    `problemas, responda "${SEM_CATEGORIA}". Responda sempre em JSON.`
  );
}

export class SugestaoCategoriaIAService {
  static async sugerirPorImagem(bufferImagem: Buffer, mimeType: string): Promise<SugestaoCategoria> {
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
            { text: montarPrompt(nomesCategorias) },
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
