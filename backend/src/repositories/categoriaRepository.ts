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

  async buscarPorId(id: number) {
    return prisma.categorias.findUnique({
      where: { id },
    });
  }

  async listarTodas() {
    return prisma.categorias.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' }
    });
  }

  async listarTodasAdmin() {
    return prisma.categorias.findMany({
      orderBy: { nome: 'asc' }
    });
  }

  async atualizar(id: number, dados: { nome?: string; descricao?: string; icone_url?: string }) {
    return prisma.categorias.update({
      where: { id },
      data: dados,
    });
  }

  async definirAtivo(id: number, ativo: boolean) {
    return prisma.categorias.update({
      where: { id },
      data: { ativo },
    });
  }
}