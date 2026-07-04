import { ConfirmacaoRepository } from '../repositories/ConfirmacaoRepository.js';
import { OcorrenciaRepository } from '../repositories/OcorrenciaRepository.js'; // Assumindo o nome do seu repositório de ocorrências

const confirmacaoRepository = new ConfirmacaoRepository();
const ocorrenciaRepository = new OcorrenciaRepository();

export class ConfirmacaoService {
  async executarConfirmacao(usuarioId: number, ocorrenciaId: number) {
    const ocorrencia = await ocorrenciaRepository.buscarPorId(ocorrenciaId);
    if (!ocorrencia) {
      throw new Error('Ocorrência não encontrada.');
    }

    const jaConfirmou = await confirmacaoRepository.buscarPorUsuarioEOcorrencia(usuarioId, ocorrenciaId);
    if (jaConfirmou) {
      throw new Error('Você já confirmou esta ocorrência.');
    }

    return await confirmacaoRepository.confirmar(usuarioId, ocorrenciaId);
  }

  async executarRetirada(usuarioId: number, ocorrenciaId: number) {
    const ocorrencia = await ocorrenciaRepository.buscarPorId(ocorrenciaId);
    if (!ocorrencia) {
      throw new Error('Ocorrência não encontrada.');
    }

    const jaConfirmou = await confirmacaoRepository.buscarPorUsuarioEOcorrencia(usuarioId, ocorrenciaId);
    if (!jaConfirmou) {
      throw new Error('Você não possui uma confirmação para retirar nesta ocorrência.');
    }

    return await confirmacaoRepository.retirarConfirmacao(usuarioId, ocorrenciaId);
  }
}