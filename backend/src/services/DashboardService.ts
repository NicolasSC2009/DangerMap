import { DashboardRepository } from '../repositories/DashboardRepository.js';
import { CategoriaRepository } from '../repositories/CategoriaRepository.js';

const dashboardRepository = new DashboardRepository();
const categoriaRepository = new CategoriaRepository();

export class DashboardService {
  static async obterEstatisticas() {
    const [totais, porStatus, porGravidade, porCategoria, serieTemporal, categorias] = await Promise.all([
      dashboardRepository.totais(),
      dashboardRepository.contarPorStatus(),
      dashboardRepository.contarPorGravidade(),
      dashboardRepository.contarPorCategoria(),
      dashboardRepository.serieTemporalUltimosDias(30),
      categoriaRepository.listarTodasAdmin(),
    ]);

    const mapaCategorias = new Map(categorias.map(function (categoria) {
      return [categoria.id, categoria.nome] as const;
    }));

    return {
      totais,
      ocorrenciasPorStatus: porStatus.map(function (item) {
        return { status: item.status, total: item._count._all };
      }),
      ocorrenciasPorGravidade: porGravidade.map(function (item) {
        return { gravidade: item.gravidade, total: item._count._all };
      }),
      ocorrenciasPorCategoria: porCategoria.map(function (item) {
        return {
          categoriaId: item.categoria_id,
          categoriaNome: item.categoria_id ? (mapaCategorias.get(item.categoria_id) || 'Categoria removida') : 'Sem categoria',
          total: item._count._all,
        };
      }),
      serieTemporal: serieTemporal.map(function (item) {
        return { dia: item.dia, total: Number(item.total) };
      }),
      geradoEm: new Date(),
    };
  }
}
