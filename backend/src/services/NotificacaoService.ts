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
  static async notificarUsuariosProximos(
    ocorrenciaId: number,
    latitude: number,
    longitude: number,
    categoriaNome: string,
    autorId: number,
    raioEmMetros: number = 600
  ) {
    try {
      const usuariosProximos: Array<{ id: number }> = await prisma.$queryRaw`
        SELECT DISTINCT u.id 
        FROM usuarios u
        JOIN ocorrencias o ON o.usuario_id = u.id
        WHERE u.id != ${autorId}
          AND u.ativo = true
          AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(o.longitude, o.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
            ${raioEmMetros}
          )
      `;

      for (const usr of usuariosProximos) {
        await NotificacaoService.criarGatilhoNotificacao({
          usuarioId: usr.id,
          ocorrenciaId: ocorrenciaId,
          titulo: 'Alerta de Perigo Próximo',
          mensagem: `Novo registro de ${categoriaNome} na sua região. Fique atento!`,
          tipo: 'proximidade'
        });
      }
    } catch (error) {
      console.error('[ERRO NOTIFICAÇÃO PROXIMIDADE]:', error);
    }
  }
  static async verificarValidadorPresencial(
    usuarioId: number,
    latitude: number,
    longitude: number
  ) {
    try {
      const ocorrenciasProximas: Array<{ id: number; categoria_nome: string }> = await prisma.$queryRaw`
        SELECT o.id, c.nome as categoria_nome
        FROM ocorrencias o
        LEFT JOIN categorias c ON c.id = o.categoria_id
        WHERE o.status = 'pendente'
          AND o.usuario_id != ${usuarioId}
          AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(o.longitude, o.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
            200
          )
      `;

      for (const oc of ocorrenciasProximas) {
        const jaNotificado = await prisma.notificacao.findFirst({
          where: {
            usuario_id: usuarioId,
            ocorrencia_id: oc.id,
            tipo_notificacao: 'validacao_campo',
            lida: false
          }
        });

        if (!jaNotificado) {
          await NotificacaoService.criarGatilhoNotificacao({
            usuarioId: usuarioId,
            ocorrenciaId: oc.id,
            titulo: 'Validação Presencial',
            mensagem: `Você está próximo de um problema pendente (${oc.categoria_nome || 'Ocorrência'}). Ele ainda é real? Toque para confirmar ou reportar.`,
            tipo: 'validacao_campo'
          });
        }
      }
    } catch (error) {
      console.error('[ERRO GEOFENCING VALIDACAO]:', error);
    }
  }

  static async notificarResolucaoOcorrencia(
    ocorrenciaId: number,
    autorId: number,
    categoriaNome?: string
  ) {
    try {
      await NotificacaoService.criarGatilhoNotificacao({
        usuarioId: autorId,
        ocorrenciaId: ocorrenciaId,
        titulo: 'Ocorrência Resolvida',
        mensagem: `Sua ocorrência ${categoriaNome ? '[' + categoriaNome + '] ' : ''}foi marcada como RESOLVIDA. Ela ficará visível no mapa por mais 24 horas antes de ser arquivada.`,
        tipo: 'resolucao'
      });
    } catch (error) {
      console.error('[ERRO NOTIFICACAO RESOLUCAO]:', error);
    }
  }
}