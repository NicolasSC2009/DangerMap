// Consultas geográficas dos relatórios de área (por raio e por estado) e os filtros
// compartilhados entre a tela, o PDF e as planilhas.
import { PrismaClient } from '@prisma/client';
import { obterMalhaEstado } from './MalhaGeograficaService.js';

const prisma = new PrismaClient();

export interface LinhaRelatorio {
  id: number;
  descricao: string | null;
  latitude: string | number;
  longitude: string | number;
  gravidade: 'baixo' | 'medio' | 'alto';
  status: 'pendente' | 'confirmado' | 'resolvido' | 'arquivado';
  data_registro: Date | string;
  categoria_id: number | null;
  categoria: string | null;
  distancia_metros?: string | number;
}

export interface FiltrosRelatorio {
  gravidades?: string[];
  status?: string[];
  categorias?: number[];
  /** Só ocorrências registradas nos últimos N dias (0 ou vazio = todas). */
  dias?: number;
}

const GRAVIDADES = ['baixo', 'medio', 'alto'];
const STATUS = ['pendente', 'confirmado', 'resolvido', 'arquivado'];

function lista(valor: unknown): string[] | undefined {
  if (typeof valor !== 'string' || valor.trim() === '') return undefined;
  return valor.split(',').map((v) => v.trim()).filter(Boolean);
}

// Lê os filtros da query string (?gravidades=alto,medio&status=pendente&categorias=1,2&dias=30).
export function lerFiltros(query: Record<string, unknown>): FiltrosRelatorio {
  const gravidades = lista(query.gravidades)?.filter((g) => GRAVIDADES.includes(g));
  const status = lista(query.status)?.filter((s) => STATUS.includes(s));
  const categorias = lista(query.categorias)?.map(Number).filter((n) => Number.isInteger(n));
  const dias = Number(query.dias);
  return {
    gravidades,
    status,
    categorias,
    dias: Number.isFinite(dias) && dias > 0 ? Math.min(dias, 3650) : undefined,
  };
}

export function aplicarFiltros(linhas: LinhaRelatorio[], filtros: FiltrosRelatorio): LinhaRelatorio[] {
  const limite = filtros.dias ? Date.now() - filtros.dias * 24 * 3600 * 1000 : null;
  return linhas.filter(function (l) {
    if (filtros.gravidades && !filtros.gravidades.includes(l.gravidade)) return false;
    if (filtros.status && !filtros.status.includes(l.status)) return false;
    if (filtros.categorias && filtros.categorias.length > 0 && (l.categoria_id === null || !filtros.categorias.includes(l.categoria_id))) return false;
    if (limite !== null && new Date(l.data_registro).getTime() < limite) return false;
    return true;
  });
}

export async function buscarPorRaio(latitude: number, longitude: number, raioMetros: number): Promise<LinhaRelatorio[]> {
  return prisma.$queryRaw<LinhaRelatorio[]>`
    SELECT
      o.id,
      o.descricao,
      o.latitude,
      o.longitude,
      o.gravidade,
      o.status,
      o.data_registro,
      o.categoria_id,
      c.nome AS categoria,
      ROUND(
        ST_Distance(
          ST_SetSRID(ST_MakePoint(o.longitude, o.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        )::numeric, 2
      ) AS distancia_metros
    FROM ocorrencias o
    LEFT JOIN categorias c ON c.id = o.categoria_id
    WHERE ST_DWithin(
      ST_SetSRID(ST_MakePoint(o.longitude, o.latitude), 4326)::geography,
      ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
      ${raioMetros}
    )
    ORDER BY distancia_metros ASC;
  `;
}

export type ResultadoEstado =
  | { erro: 'uf-invalida' }
  | { erro: 'malha-indisponivel' }
  | { uf: string; poligono: unknown; ocorrencias: LinhaRelatorio[] };

export async function buscarPorEstado(ufBruta: string): Promise<ResultadoEstado> {
  const uf = String(ufBruta || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(uf)) return { erro: 'uf-invalida' };

  const poligono = await obterMalhaEstado(uf);
  if (!poligono) return { erro: 'malha-indisponivel' };

  const geometriaJson = JSON.stringify(poligono);
  const ocorrencias = await prisma.$queryRaw<LinhaRelatorio[]>`
    SELECT o.id, o.descricao, o.latitude, o.longitude, o.gravidade, o.status, o.data_registro,
           o.categoria_id, c.nome AS categoria
    FROM ocorrencias o
    LEFT JOIN categorias c ON c.id = o.categoria_id
    WHERE ST_Contains(
      ST_SetSRID(ST_GeomFromGeoJSON(${geometriaJson}), 4326),
      ST_SetSRID(ST_MakePoint(o.longitude, o.latitude), 4326)
    )
    ORDER BY o.data_registro DESC;
  `;
  return { uf, poligono, ocorrencias };
}
