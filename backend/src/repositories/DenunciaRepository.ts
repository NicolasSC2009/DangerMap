import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DenunciaRepository {
  async buscarPorUsuarioEOcorrencia(usuarioId: number, ocorrenciaId: number) {
    return prisma.denuncia.findFirst({
      where: {
        usuario_id: usuarioId,
        ocorrencia_id: ocorrenciaId
      }
    });
  }

  async criar(usuarioId: number, ocorrenciaId: number, motivo: string) {
    return prisma.$transaction(async function (tx) {
      const novaDenuncia = await tx.denuncia.create({
        data: {
          usuario_id: usuarioId,
          ocorrencia_id: ocorrenciaId,
          motivo: motivo
        }
      });

      await tx.ocorrencia.update({
        where: { id: ocorrenciaId },
        data: { qtd_denuncias: { increment: 1 } }
      });

      return novaDenuncia;
    });
  }

  async listarTodas() {
    return prisma.denuncia.findMany({
      include: {
        usuario: {
          select: { id: true, nome: true, email: true }
        },
        ocorrencia: true
      },
      orderBy: {
        data_denuncia: 'desc'
      }
    });
  }
}