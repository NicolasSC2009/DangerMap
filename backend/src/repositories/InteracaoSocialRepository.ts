import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class InteracaoSocialRepository {
  async buscarPorUsuarioOcorrenciaETipo(usuarioId: number, ocorrenciaId: number, tipo: string) {
    return prisma.interacaoSocial.findFirst({
      where: { usuario_id: usuarioId, ocorrencia_id: ocorrenciaId, tipo_interacao: tipo },
    });
  }

  async criar(usuarioId: number, ocorrenciaId: number, tipo: string) {
    return prisma.interacaoSocial.create({
      data: { usuario_id: usuarioId, ocorrencia_id: ocorrenciaId, tipo_interacao: tipo },
    });
  }

  async remover(id: number) {
    return prisma.interacaoSocial.delete({ where: { id } });
  }

  async contarPorTipo(ocorrenciaId: number, tipo: string) {
    return prisma.interacaoSocial.count({
      where: { ocorrencia_id: ocorrenciaId, tipo_interacao: tipo },
    });
  }
}
