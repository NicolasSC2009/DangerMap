import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class OcorrenciaRepository {
  async criar(dados: any) {
    return prisma.ocorrencia.create({
      data: {
        usuario_id: dados.usuarioId,
        categoria_id: dados.categoriaId,
        gravidade: dados.gravidade || 'medio', 
        descricao: dados.descricao || null,    
        latitude: dados.latitude,
        longitude: dados.longitude,
        anonimo: dados.anonimo,
        status: 'pendente'
      }
    });
  }

  async listarTodas(limiteDenuncias: number) {
    return prisma.ocorrencia.findMany({
      where: {
        status: { in: ['pendente', 'confirmado'] },
        qtd_denuncias: { lt: limiteDenuncias }
      },
      include: {
        categorias: {
          select: {
            nome: true,
            icone_url: true
          }
        }
      }
    });
  }

  async buscarPorId(id: number) {
    return prisma.ocorrencia.findUnique({
      where: { id }
    });
  }

  async atualizarImagem(id: number, imagemUrl: string | null) {
    return prisma.ocorrencia.update({
      where: { id },
      data: { imagem_url: imagemUrl }
    });
  }

  async listarComDenunciasAcimaDoLimite(limiteDenuncias: number) {
    return prisma.ocorrencia.findMany({
      where: { qtd_denuncias: { gte: limiteDenuncias } },
      include: {
        categorias: { select: { nome: true } },
        usuario: { select: { id: true, nome: true } }
      },
      orderBy: { qtd_denuncias: 'desc' }
    });
  }
}