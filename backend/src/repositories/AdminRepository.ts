import { PrismaClient, status_ocorrencia_enum } from '@prisma/client';

const prisma = new PrismaClient();

export class AdminRepository {
  async alterarStatusOcorrencia(
    ocorrenciaId: number, 
    novoStatus: status_ocorrencia_enum
  ) {
    return prisma.ocorrencia.update({
      where: { id: ocorrenciaId },
      data: { status: novoStatus }
    });
  }

  async inativarUsuario(usuarioId: number) {
    return prisma.usuario.update({
      where: { id: usuarioId },
      data: { ativo: false }
    });
  }

  async reativarUsuario(usuarioId: number) {
    return prisma.usuario.update({
      where: { id: usuarioId },
      data: { ativo: true }
    });
  }
}