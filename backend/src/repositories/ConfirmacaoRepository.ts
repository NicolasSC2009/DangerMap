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

  // Ao atingir limiteConfirmacoes confirmações, uma ocorrência pendente passa a
  // "confirmado" sozinha (a comunidade validou). Devolve também o novo status.
  async confirmar(usuarioId: number, ocorrenciaId: number, limiteConfirmacoes: number) {
    return prisma.$transaction(async function (tx) {
      const novaConfirmacao = await tx.confirmacao.create({
        data: {
          usuario_id: usuarioId,
          ocorrencia_id: ocorrenciaId
        },
        include: {
          ocorrencia: { select: { usuario_id: true } }
        }
      });

      const atualizada = await tx.ocorrencia.update({
        where: { id: ocorrenciaId },
        data: {
          qtd_confirmacoes: {
            increment: 1
          }
        },
        select: { qtd_confirmacoes: true, status: true }
      });

      let virouConfirmada = false;
      if (atualizada.status === 'pendente' && (atualizada.qtd_confirmacoes ?? 0) >= limiteConfirmacoes) {
        await tx.ocorrencia.update({ where: { id: ocorrenciaId }, data: { status: 'confirmado' } });
        virouConfirmada = true;
      }

      return { ...novaConfirmacao, virouConfirmada };
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