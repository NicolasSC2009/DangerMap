import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DashboardRepository {
  async contarPorStatus() {
    return prisma.ocorrencia.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
  }

  async contarPorGravidade() {
    return prisma.ocorrencia.groupBy({
      by: ['gravidade'],
      _count: { _all: true },
    });
  }

  async contarPorCategoria() {
    return prisma.ocorrencia.groupBy({
      by: ['categoria_id'],
      _count: { _all: true },
      orderBy: { _count: { categoria_id: 'desc' } },
    });
  }

  async totais() {
    const [totalOcorrencias, totalUsuarios, totalUsuariosAtivos, totalDenuncias, totalConfirmacoes] = await Promise.all([
      prisma.ocorrencia.count(),
      prisma.usuario.count(),
      prisma.usuario.count({ where: { ativo: true } }),
      prisma.denuncia.count(),
      prisma.confirmacao.count(),
    ]);

    return { totalOcorrencias, totalUsuarios, totalUsuariosAtivos, totalDenuncias, totalConfirmacoes };
  }

  async serieTemporalUltimosDias(dias: number) {
    const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

    return prisma.$queryRaw<Array<{ dia: Date; total: bigint }>>`
      SELECT DATE(data_registro) AS dia, COUNT(*) AS total
      FROM ocorrencias
      WHERE data_registro >= ${desde}
      GROUP BY DATE(data_registro)
      ORDER BY dia ASC
    `;
  }
}
