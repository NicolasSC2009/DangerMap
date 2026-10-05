import { OcorrenciaRepository } from '../repositories/OcorrenciaRepository.js';
import { criarOcorrenciaSchema, FiltrosOcorrencia } from '../schemas/OcorrenciaSchema.js';
import { ParametroService } from './ParametroService.js';
import { removerArquivoUpload } from '../utils/arquivoUpload.js';
import { agruparPorProximidade, RAIO_CLUSTER_PADRAO_METROS } from './ClusterizacaoService.js';
import { CategoriaRepository } from '../repositories/CategoriaRepository.js';
import { calcularGravidadeAutomatica, GravidadeOcorrencia } from './GravidadeAutomaticaService.js';
import { pontoDentroDoBrasil } from './MalhaGeograficaService.js';

const ocorrenciaRepository = new OcorrenciaRepository();
const categoriaRepository = new CategoriaRepository();

export class ErroDadosOcorrencia extends Error {}

export class OcorrenciaService {
  // A gravidade nunca vem do cliente: é calculada a partir da categoria e da
  // descrição (qualquer valor enviado em "gravidade" é ignorado).
  async estimarGravidade(categoriaId: number, descricao?: string | null): Promise<GravidadeOcorrencia> {
    const categoria = await categoriaRepository.buscarPorId(categoriaId);
    if (!categoria) {
      throw new ErroDadosOcorrencia('Categoria não encontrada.');
    }
    return calcularGravidadeAutomatica(categoria.nome, descricao, categoria.descricao);
  }

  async registrar(dadosBrutos: any, usuarioId: number) {
    const dadosValidados = criarOcorrenciaSchema.parse(dadosBrutos);

    if (!(await pontoDentroDoBrasil(dadosValidados.latitude, dadosValidados.longitude))) {
      throw new ErroDadosOcorrencia('O DangerMap só aceita ocorrências dentro do território brasileiro.');
    }

    const gravidade = await this.estimarGravidade(dadosValidados.categoriaId, dadosValidados.descricao);

    const novaOcorrencia = await ocorrenciaRepository.criar({
      ...dadosValidados,
      gravidade,
      usuarioId
    });

    return novaOcorrencia;
  }

  async obterTodas(filtros: FiltrosOcorrencia = {}) {
    const limiteDenuncias = await ParametroService.obterNumero('limite_denuncias_ocorrencia');
    const ocorrencias = await ocorrenciaRepository.listarTodas(limiteDenuncias, filtros);

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

  // RF14/RN16 - agrupa ocorrências próximas para o mapa não virar uma bagunça
  // de pins quando há muitos registros na mesma região. O raio é pensado pra
  // o frontend variar conforme o nível de zoom (mais zoom = raio menor).
  async obterClusters(raioMetros: number = RAIO_CLUSTER_PADRAO_METROS, filtros: FiltrosOcorrencia = {}) {
    const ocorrencias: any[] = await this.obterTodas(filtros);

    const pontos = ocorrencias
      .filter(function (o) { return o.latitude != null && o.longitude != null; })
      .map(function (o) {
        return {
          id: o.id,
          latitude: Number(o.latitude),
          longitude: Number(o.longitude),
          gravidade: o.gravidade,
          original: o,
        };
      });

    const clusters = agruparPorProximidade(pontos, raioMetros);

    return clusters.map(function (cluster) {
      if (cluster.quantidade === 1) {
        return {
          latitude: cluster.latitude,
          longitude: cluster.longitude,
          quantidade: 1,
          gravidadeMaisAlta: cluster.gravidadeMaisAlta,
          ocorrencia: cluster.itens[0].original,
        };
      }

      return {
        latitude: cluster.latitude,
        longitude: cluster.longitude,
        quantidade: cluster.quantidade,
        gravidadeMaisAlta: cluster.gravidadeMaisAlta,
        ocorrenciaIds: cluster.ocorrenciaIds,
      };
    });
  }

  async obterPorId(ocorrenciaId: number) {
    const ocorrencia: any = await ocorrenciaRepository.buscarDetalhePublico(ocorrenciaId);
    if (!ocorrencia) {
      throw new Error('Ocorrência não encontrada.');
    }

    if (ocorrencia.anonimo) {
      return { ...ocorrencia, usuario_id: null, usuario: null };
    }
    return ocorrencia;
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