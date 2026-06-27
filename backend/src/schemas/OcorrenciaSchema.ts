import { z } from 'zod';

export const criarOcorrenciaSchema = z.object({
  categoriaId: z.number(),
  gravidade: z.enum(['baixo', 'medio', 'alto']).optional(),
  descricao: z.string().max(1000, 'A descrição deve ter no máximo 1000 caracteres').optional(),
  latitude: z.number()
    .min(-90, 'Latitude inválida (mínimo -90)')
    .max(90, 'Latitude inválida (máximo 90)'),
  longitude: z.number()
    .min(-180, 'Longitude inválida (mínimo -180)')
    .max(180, 'Longitude inválida (máximo 180)')
});