import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ConfirmacaoRepository {
  async buscarPorUsuarioEOcorrencia(usuarioId: number, ocorrenciaId: number) {
    return prisma.confirmacao.findUnique({
      where: {
        usuario_id_ocorrencia_id: {
          usuario_id: usuarioId,
          ocorrencia_id: ocorrenciaId
        }
      }
    });
  }

  async confirmar(usuarioId: number, ocorrenciaId: number) {
    return prisma.$transaction(async function (tx) {
      const novaConfirmacao = await tx.confirmacao.create({
        data: {
          usuario_id: usuarioId,
          ocorrencia_id: ocorrenciaId
        }
      });

      await tx.ocorrencia.update({
        where: { id: ocorrenciaId },
        data: {
          qtd_confirmacoes: {
            increment: 1
          }
        }
      });

      return novaConfirmacao;
    });
  }

  async retirarConfirmacao(usuarioId: number, ocorrenciaId: number) {
    return prisma.$transaction(async function (tx) {
      await tx.confirmacao.delete({
        where: {
          usuario_id_ocorrencia_id: {
            usuario_id: usuarioId,
            ocorrencia_id: ocorrenciaId
          }
        }
      });

      await tx.ocorrencia.update({
        where: { id: ocorrenciaId },
        data: {
          qtd_confirmacoes: {
            decrement: 1
          }
        }
      });

      return { retirado: true };
    });
  }
}