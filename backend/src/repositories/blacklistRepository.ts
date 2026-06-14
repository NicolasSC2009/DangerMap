import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class BlacklistRepository {
  async revogarToken(token: string, expiraEm: Date) {
    return prisma.blacklist_tokens.create({
      data: {
        token: token,
        expira_em: expiraEm
      }
    });
  }

  async buscarTokenRevogado(token: string) {
    return prisma.blacklist_tokens.findUnique({
      where: { token }
    });
  }
}