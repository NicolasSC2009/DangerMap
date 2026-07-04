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
        status: 'pendente'                     
      }
    });
  }

  async listarTodas() {
    return prisma.ocorrencia.findMany({
      where: {
        status: { in: ['pendente', 'confirmado'] }
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
  
}