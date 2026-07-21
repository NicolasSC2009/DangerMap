import { DenunciaRepository } from '../repositories/DenunciaRepository.js';
import { OcorrenciaRepository } from '../repositories/OcorrenciaRepository.js';

const denunciaRepository = new DenunciaRepository();
const ocorrenciaRepository = new OcorrenciaRepository();

export class DenunciaService {
  async criarDenuncia(usuarioId: number, ocorrenciaId: number, motivo: string) {
    if (!motivo || motivo.trim() === '') {
      throw new Error('O motivo da denúncia é obrigatório');
    }

    const ocorrencia = await ocorrenciaRepository.buscarPorId(ocorrenciaId);
    if (!ocorrencia) {
      throw new Error('Ocorrência não encontrada');
    }

    const jaDenunciou = await denunciaRepository.buscarPorUsuarioEOcorrencia(usuarioId, ocorrenciaId);
    if (jaDenunciou) {
      throw new Error('Você já denunciou esta ocorrência');
    }

    return await denunciaRepository.criar(usuarioId, ocorrenciaId, motivo);
  }

  async listarDenuncias() {
    return await denunciaRepository.listarTodas();
  }
}