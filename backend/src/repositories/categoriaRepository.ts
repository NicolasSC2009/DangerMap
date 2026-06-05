import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CategoriaRepository {
  async buscarPorNome(nome: string) {
    return prisma.categorias.findUnique({
      where: { nome },
    });
  }

  async criar(dados: { nome: string; descricao?: string; icone_url?: string }) {
    return prisma.categorias.create({
      data: dados,
    });
  }

  async listarTodas() {
    return prisma.categorias.findMany({
      orderBy: { nome: 'asc' }
    });
  }
}