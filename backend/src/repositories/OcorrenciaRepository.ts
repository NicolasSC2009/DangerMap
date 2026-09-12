import { PrismaClient } from '@prisma/client';
import { FiltrosOcorrencia } from '../schemas/OcorrenciaSchema.js';

const prisma = new PrismaClient();

// RN21 - ocorrências resolvidas continuam visíveis por 24h antes de serem
// arquivadas pelo cron (LimpezaOcorrencias); "arquivado" nunca é exibido.
const STATUS_VISIVEIS_PUBLICO = ['pendente', 'confirmado', 'resolvido'] as const;

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
      },
      include: {
        categorias: { select: { nome: true } }
      }
    });
  }

  async listarTodas(limiteDenuncias: number, filtros: FiltrosOcorrencia = {}) {
    return prisma.ocorrencia.findMany({
      where: {
        status: { in: filtros.status ? [filtros.status] : [...STATUS_VISIVEIS_PUBLICO] },
        qtd_denuncias: { lt: limiteDenuncias },
        ...(filtros.categoriaId ? { categoria_id: filtros.categoriaId } : {}),
        ...(filtros.gravidade ? { gravidade: filtros.gravidade } : {}),
        ...(filtros.dataInicio || filtros.dataFim
          ? {
              data_registro: {
                ...(filtros.dataInicio ? { gte: filtros.dataInicio } : {}),
                ...(filtros.dataFim ? { lte: filtros.dataFim } : {}),
              },
            }
          : {}),
      },
      include: {
        categorias: {
          select: {
            nome: true,
            icone_url: true
          }
        },
        _count: {
          select: {
            interacoes: { where: { tipo_interacao: 'curtida' } }
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

  async buscarDetalhePublico(id: number) {
    return prisma.ocorrencia.findUnique({
      where: { id },
      include: {
        categorias: { select: { nome: true, icone_url: true } },
        usuario: { select: { id: true, nome: true } },
        _count: {
          select: {
            interacoes: { where: { tipo_interacao: 'curtida' } }
          }
        }
      }
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