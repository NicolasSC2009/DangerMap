import { OcorrenciaRepository } from '../repositories/OcorrenciaRepository.js';
import { criarOcorrenciaSchema } from '../schemas/OcorrenciaSchema.js';
import { ParametroService } from './ParametroService.js';
import { removerArquivoUpload } from '../utils/arquivoUpload.js';

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
    const limiteDenuncias = await ParametroService.obterNumero('limite_denuncias_ocorrencia');
    const ocorrencias = await ocorrenciaRepository.listarTodas(limiteDenuncias);

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

  async definirFoto(ocorrenciaId: number, usuarioId: number, usuarioTipo: string | undefined, novoCaminho: string) {
    const ocorrencia = await ocorrenciaRepository.buscarPorId(ocorrenciaId);
    if (!ocorrencia) {
      throw new Error('Ocorrência não encontrada.');
    }

    const ehDono = ocorrencia.usuario_id === usuarioId;
    const ehAdmin = usuarioTipo === 'admin';
    if (!ehDono && !ehAdmin) {
      throw new Error('Você não tem permissão para alterar a foto desta ocorrência.');
    }

    const caminhoAntigo = ocorrencia.imagem_url;
    const atualizada = await ocorrenciaRepository.atualizarImagem(ocorrenciaId, novoCaminho);

    if (caminhoAntigo) {
      removerArquivoUpload(caminhoAntigo);
    }

    return atualizada;
  }

  async removerFoto(ocorrenciaId: number) {
    const ocorrencia = await ocorrenciaRepository.buscarPorId(ocorrenciaId);
    if (!ocorrencia) {
      throw new Error('Ocorrência não encontrada.');
    }

    const caminhoAntigo = ocorrencia.imagem_url;
    const atualizada = await ocorrenciaRepository.atualizarImagem(ocorrenciaId, null);

    if (caminhoAntigo) {
      removerArquivoUpload(caminhoAntigo);
    }

    return atualizada;
  }
}