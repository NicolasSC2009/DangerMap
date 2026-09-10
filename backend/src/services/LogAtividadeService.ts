import { PrismaClient } from '@prisma/client';
import { Request } from 'express';

const prisma = new PrismaClient();

export class LogAtividadeService {
  static async registrar(params: {
    usuarioId?: number | null;
    acao: string;
    req?: Request;
  }) {
    try {
      const ipOrigem = params.req?.ip || params.req?.socket?.remoteAddress || undefined;
      const userAgent = params.req?.headers['user-agent'];

      await prisma.logAtividade.create({
        data: {
          usuario_id: params.usuarioId ?? null,
          acao: params.acao,
          ...(ipOrigem ? { ip_origem: ipOrigem } : {}),
          ...(userAgent ? { user_agent: userAgent } : {}),
        },
      });
    } catch (error) {
      console.error('[ERRO AO REGISTRAR LOG DE ATIVIDADE]:', error);
    }
  }
}
