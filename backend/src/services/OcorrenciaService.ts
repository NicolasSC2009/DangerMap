import { OcorrenciaRepository } from '../repositories/OcorrenciaRepository.js';
import { criarOcorrenciaSchema } from '../schemas/OcorrenciaSchema.js';

const ocorrenciaRepository = new OcorrenciaRepository();

export class OcorrenciaService {
  async registrar(dadosBrutos: any, usuarioId: number) {
    const dadosValidados = criarOcorrenciaSchema.parse(dadosBrutos);

    const novaOcorrencia = await ocorrenciaRepository.criar({
      ...dadosValidados,
      usuarioId
    });

    return novaOcorrencia;
  }

  async obterTodas() {
    const ocorrencias = await ocorrenciaRepository.listarTodas();

    return ocorrencias.map(function(ocorrencia: any) {
      if (ocorrencia.anonimo) {
        return {
          ...ocorrencia,
          usuario_id: null,
          usuarioId: null,
          usuario: null
        };
      }
      return ocorrencia;
    });
  }
}