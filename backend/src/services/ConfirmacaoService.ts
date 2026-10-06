import { ConfirmacaoRepository } from '../repositories/ConfirmacaoRepository.js';
import { OcorrenciaRepository } from '../repositories/OcorrenciaRepository.js';
import { ParametroService } from './ParametroService.js';

const confirmacaoRepository = new ConfirmacaoRepository();
const ocorrenciaRepository = new OcorrenciaRepository();

export class ConfirmacaoService {
  async executarConfirmacao(usuarioId: number, ocorrenciaId: number) {
    const ocorrencia = await ocorrenciaRepository.buscarPorId(ocorrenciaId);
    if (!ocorrencia) {
      throw new Error('Ocorrência não encontrada.');
    }

    if (ocorrencia.usuario_id === usuarioId) {
      throw new Error('Você não pode confirmar uma ocorrência registrada por você mesmo.');
    }

    const jaConfirmou = await confirmacaoRepository.buscarPorUsuarioEOcorrencia(usuarioId, ocorrenciaId);
    if (jaConfirmou) {
      throw new Error('Você já confirmou esta ocorrência.');
    }

    const limite = await ParametroService.obterNumero('confirmacoes_para_confirmar');
    return await confirmacaoRepository.confirmar(usuarioId, ocorrenciaId, limite);
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