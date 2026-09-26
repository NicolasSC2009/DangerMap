import { z } from 'zod';

const LIMITES_BRASIL = {
  latMin: -34,
  latMax: 6,
  lngMin: -74,
  lngMax: -28,
};

function dentroDoBrasil(latitude: number, longitude: number): boolean {
  return (
    latitude >= LIMITES_BRASIL.latMin &&
    latitude <= LIMITES_BRASIL.latMax &&
    longitude >= LIMITES_BRASIL.lngMin &&
    longitude <= LIMITES_BRASIL.lngMax
  );
}

export const criarOcorrenciaSchema = z.object({
  categoriaId: z.number(),
  gravidade: z.enum(['baixo', 'medio', 'alto']).optional(),
  descricao: z.string().max(1000, 'A descrição deve ter no máximo 1000 caracteres').optional(),
  latitude: z.number()
    .min(-90, 'Latitude inválida (mínimo -90)')
    .max(90, 'Latitude inválida (máximo 90)'),
  longitude: z.number()
    .min(-180, 'Longitude inválida (mínimo -180)')
    .max(180, 'Longitude inválida (máximo 180)'),
  anonimo: z.boolean().optional().default(false)
}).refine(function (dados) {
  return dentroDoBrasil(dados.latitude, dados.longitude);
}, {
  message: 'O DangerMap só aceita ocorrências dentro do território brasileiro.',
  path: ['latitude'],
});

export const listarOcorrenciasQuerySchema = z.object({
  categoriaId: z.coerce.number().int().positive().optional(),
  gravidade: z.enum(['baixo', 'medio', 'alto']).optional(),
  status: z.enum(['pendente', 'confirmado', 'resolvido']).optional(),
  dataInicio: z.coerce.date({ message: 'dataInicio inválida.' }).optional(),
  dataFim: z.coerce.date({ message: 'dataFim inválida.' }).optional(),
}).refine(function (dados) {
  if (dados.dataInicio && dados.dataFim) {
    return dados.dataInicio <= dados.dataFim;
  }
  return true;
}, { message: 'dataInicio deve ser anterior ou igual a dataFim.', path: ['dataInicio'] });

export type FiltrosOcorrencia = z.infer<typeof listarOcorrenciasQuerySchema>;