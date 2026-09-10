import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ParametroRepository {
  async listarTodos() {
    return prisma.parametros_sistema.findMany({
      orderBy: { chave: 'asc' },
    });
  }

  async buscarPorChave(chave: string) {
    return prisma.parametros_sistema.findUnique({
      where: { chave },
    });
  }

  async atualizar(chave: string, valor: string) {
    return prisma.parametros_sistema.update({
      where: { chave },
      data: { valor },
    });
  }
}
