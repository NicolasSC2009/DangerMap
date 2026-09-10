import { ParametroRepository } from '../repositories/ParametroRepository.js';

const parametroRepository = new ParametroRepository();

const VALORES_PADRAO: Record<string, string> = {
  limite_denuncias_ocorrencia: '5',
  limite_denuncias_usuario: '5',
  horas_arquivamento_resolvido: '24',
  raio_validacao_presencial_metros: '200',
  raio_notificacao_proximidade_metros: '600',
};

const TTL_CACHE_MS = 60 * 1000;

let cache: Record<string, string> | null = null;
let cacheExpiraEm = 0;

export class ParametroService {
  static async obterTodos(): Promise<Record<string, string>> {
    const agora = Date.now();
    if (cache && agora < cacheExpiraEm) {
      return cache;
    }

    try {
      const linhas = await parametroRepository.listarTodos();
      const mapa: Record<string, string> = { ...VALORES_PADRAO };

      for (const linha of linhas) {
        mapa[linha.chave] = linha.valor;
      }

      cache = mapa;
      cacheExpiraEm = agora + TTL_CACHE_MS;
      return mapa;
    } catch (error) {
      console.error('[ERRO AO CARREGAR PARÂMETROS] Usando valores padrão:', error);
      return { ...VALORES_PADRAO };
    }
  }

  static async obterNumero(chave: string): Promise<number> {
    const parametros = await ParametroService.obterTodos();
    const bruto = parametros[chave] ?? VALORES_PADRAO[chave];
    const valor = Number(bruto);
    return Number.isFinite(valor) ? valor : Number(VALORES_PADRAO[chave]);
  }

  static async listarParaAdmin() {
    return parametroRepository.listarTodos();
  }

  static async atualizar(chave: string, valor: string) {
    if (!(chave in VALORES_PADRAO)) {
      throw new Error('Parâmetro desconhecido.');
    }

    if (!valor || valor.trim() === '') {
      throw new Error('O valor do parâmetro não pode ser vazio.');
    }

    const atualizado = await parametroRepository.atualizar(chave, valor);
    cache = null;
    return atualizado;
  }
}
