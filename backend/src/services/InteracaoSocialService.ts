import { InteracaoSocialRepository } from '../repositories/InteracaoSocialRepository.js';
import { OcorrenciaRepository } from '../repositories/OcorrenciaRepository.js';

const interacaoRepository = new InteracaoSocialRepository();
const ocorrenciaRepository = new OcorrenciaRepository();

const TIPO_CURTIDA = 'curtida';
const TIPO_COMPARTILHAMENTO = 'compartilhamento';

export class InteracaoSocialService {
  async curtir(usuarioId: number, ocorrenciaId: number) {
    const ocorrencia = await ocorrenciaRepository.buscarPorId(ocorrenciaId);
    if (!ocorrencia) {
      throw new Error('Ocorrência não encontrada.');
    }

    const jaCurtiu = await interacaoRepository.buscarPorUsuarioOcorrenciaETipo(usuarioId, ocorrenciaId, TIPO_CURTIDA);
    if (jaCurtiu) {
      throw new Error('Você já curtiu esta ocorrência.');
    }

    await interacaoRepository.criar(usuarioId, ocorrenciaId, TIPO_CURTIDA);
    return { curtido: true };
  }

  async retirarCurtida(usuarioId: number, ocorrenciaId: number) {
    const curtida = await interacaoRepository.buscarPorUsuarioOcorrenciaETipo(usuarioId, ocorrenciaId, TIPO_CURTIDA);
    if (!curtida) {
      throw new Error('Você ainda não curtiu esta ocorrência.');
    }

    await interacaoRepository.remover(curtida.id);
    return { curtido: false };
  }

  async registrarCompartilhamento(usuarioId: number, ocorrenciaId: number) {
    const ocorrencia = await ocorrenciaRepository.buscarPorId(ocorrenciaId);
    if (!ocorrencia) {
      throw new Error('Ocorrência não encontrada.');
    }

    await interacaoRepository.criar(usuarioId, ocorrenciaId, TIPO_COMPARTILHAMENTO);
    const totalCompartilhamentos = await interacaoRepository.contarPorTipo(ocorrenciaId, TIPO_COMPARTILHAMENTO);

    return { link: `/ocorrencias/${ocorrenciaId}`, totalCompartilhamentos };
  }
}
