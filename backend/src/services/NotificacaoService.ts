import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class NotificacaoService {
  static async listarNotificacoes(usuarioId: number, apenasNaoLidas = false) {
    const whereCondition = {
      usuario_id: usuarioId,
      ...(apenasNaoLidas ? { lida: false } : {}),
    };

    const [notificacoes, totalNaoLidas] = await Promise.all([
      prisma.notificacao.findMany({
        where: whereCondition,
        orderBy: { data_envio: 'desc' },
      }),
      prisma.notificacao.count({
        where: { usuario_id: usuarioId, lida: false },
      }),
    ]);

    return { totalNaoLidas, notificacoes };
  }

  static async marcarComoLida(id: number, usuarioId: number) {
    const notificacao = await prisma.notificacao.findFirst({
      where: { id, usuario_id: usuarioId },
    });

    if (!notificacao) throw new Error('Notificação não encontrada');

    return prisma.notificacao.update({
      where: { id },
      data: { lida: true },
    });
  }

  static async marcarTodasComoLidas(usuarioId: number) {
    return prisma.notificacao.updateMany({
      where: { usuario_id: usuarioId, lida: false },
      data: { lida: true },
    });
  }

  static async deletar(id: number, usuarioId: number) {
    const notificacao = await prisma.notificacao.findFirst({
      where: { id, usuario_id: usuarioId },
    });

    if (!notificacao) throw new Error('Notificação não encontrada');

    return prisma.notificacao.delete({ where: { id } });
  }

  static async criarGatilhoNotificacao(data: {
    usuarioId: number;
    ocorrenciaId?: number;
    titulo: string;
    mensagem: string;
    tipo: 'proximidade' | 'validacao_campo' | 'confirmacao' | 'resolucao' | 'sistema' | 'moderacao';
  }) {
    return prisma.notificacao.create({
      data: {
        usuario_id: data.usuarioId,
        ocorrencia_id: data.ocorrenciaId,
        titulo: data.titulo,
        mensagem: data.mensagem,
        tipo: data.tipo,
      },
    });
  }
}