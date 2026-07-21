import { status_ocorrencia_enum } from '@prisma/client';
import { AdminRepository } from '../repositories/AdminRepository.js';
import { OcorrenciaRepository } from '../repositories/OcorrenciaRepository.js';
import { UsuarioRepository } from '../repositories/UsuarioRepository.js';

const adminRepository = new AdminRepository();
const ocorrenciaRepository = new OcorrenciaRepository();
const usuarioRepository = new UsuarioRepository();

export class AdminService {
  async moderarOcorrencia(ocorrenciaId: number, acao: 'rejeitar' | 'manter') {
    const ocorrencia = await ocorrenciaRepository.buscarPorId(ocorrenciaId);
    if (!ocorrencia) {
      throw new Error('Ocorrência não encontrada.');
    }

    if (acao === 'rejeitar') {
      return await adminRepository.alterarStatusOcorrencia(
        ocorrenciaId, 
        status_ocorrencia_enum.resolvido
      );
    }

    return await adminRepository.alterarStatusOcorrencia(
      ocorrenciaId, 
      status_ocorrencia_enum.confirmado
    );
  }

  async banirUsuario(usuarioId: number) {
    const usuario = await usuarioRepository.buscarPorId(usuarioId);
    if (!usuario) {
      throw new Error('Usuário não encontrado.');
    }

    return await adminRepository.inativarUsuario(usuarioId);
  }
}