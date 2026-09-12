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
    .max(180, 'Longitude inválida (máximo 180)'),
  anonimo: z.boolean().optional().default(false)
});

// RF13 - filtros de listagem (categoria, gravidade, status e período).
// "arquivado" não é uma opção válida de filtro: ocorrências arquivadas nunca
// devem voltar a aparecer no mapa público, mesmo que o filtro seja pedido.
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