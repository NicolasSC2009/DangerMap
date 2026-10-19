import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { RequisicaoAutenticada } from '../middlewares/authMiddleware.js';
import { AdminService } from '../services/AdminService.js';
import { NotificacaoService } from '../services/NotificacaoService.js';
import { LogAtividadeService } from '../services/LogAtividadeService.js';
import { ParametroService } from '../services/ParametroService.js';
import { DashboardService } from '../services/DashboardService.js';
import { OcorrenciaRepository } from '../repositories/OcorrenciaRepository.js';
import { UsuarioRepository } from '../repositories/UsuarioRepository.js';
import { aplicarFiltros, buscarPorEstado, buscarPorRaio, lerFiltros, type FiltrosRelatorio } from '../services/RelatorioGeograficoService.js';
import { gerarPdfEstatisticas, gerarPdfOcorrencias } from '../services/RelatorioPdfService.js';

const adminService = new AdminService();
const ocorrenciaRepository = new OcorrenciaRepository();
const usuarioRepository = new UsuarioRepository();
const prisma = new PrismaClient();

const ROTULO_GRAVIDADE_FILTRO: Record<string, string> = { baixo: 'Baixa', medio: 'Média', alto: 'Alta' };
const ROTULO_STATUS_FILTRO: Record<string, string> = { pendente: 'Pendente', confirmado: 'Confirmada', resolvido: 'Resolvida', arquivado: 'Arquivada' };

// Texto curto dos filtros aplicados, para aparecer no topo do PDF.
async function descreverFiltros(filtros: FiltrosRelatorio): Promise<string[]> {
  const linhas: string[] = [];
  if (filtros.gravidades) linhas.push(`Gravidade: ${filtros.gravidades.map((g) => ROTULO_GRAVIDADE_FILTRO[g]).join(', ')}`);
  if (filtros.status) linhas.push(`Situação: ${filtros.status.map((s) => ROTULO_STATUS_FILTRO[s]).join(', ')}`);
  if (filtros.dias) linhas.push(`Período: últimos ${filtros.dias} dias`);
  if (filtros.categorias && filtros.categorias.length > 0) {
    const categorias = await prisma.categorias.findMany({ where: { id: { in: filtros.categorias } }, select: { nome: true } });
    linhas.push(`Categorias: ${categorias.map((c) => c.nome).join(', ')}`);
  }
  return linhas;
}
export class AdminController {
  async moderarOcorrencia(req: RequisicaoAutenticada, res: Response) {
    try {
      const idParam = req.params.ocorrenciaId;
      const ocorrenciaId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
      const { acao } = req.body;

      if (isNaN(ocorrenciaId)) {
        return res.status(400).json({ error: 'ID da ocorrência inválido' });
      }

      if (!acao || !['rejeitar', 'manter', 'resolver'].includes(acao)) {
        return res.status(400).json({ error: 'Ação inválida. Use "rejeitar", "manter" ou "resolver"' });
      }

      const resultado = await adminService.moderarOcorrencia(ocorrenciaId, acao);

      if (resultado && (resultado as any).usuario_id) {
        const autorId = (resultado as any).usuario_id;
        const categoriaNome = (resultado as any).categorias?.nome;

        if (acao === 'resolver' || (resultado as any).status === 'resolvido') {
          NotificacaoService.notificarResolucaoOcorrencia(
            ocorrenciaId,
            autorId,
            categoriaNome
          ).catch(function(err) {
            console.error('[ERRO NOTIFICAÇÃO RESOLUÇÃO]:', err);
          });
        } else {
          const mensagemNotificacao = acao === 'rejeitar'
            ? 'Sua ocorrência foi analisada pela moderação e removida do mapa.'
            : 'Sua ocorrência foi analisada e mantida ativa no mapa.';

          NotificacaoService.criarGatilhoNotificacao({
            usuarioId: autorId,
            ocorrenciaId: ocorrenciaId,
            titulo: 'Moderação da ocorrência',
            mensagem: mensagemNotificacao,
            tipo: 'moderacao'
          }).catch(function(err) {
            console.error('[ERRO NOTIFICAÇÃO MODERAÇÃO]:', err);
          });
        }
      }

      let mensagemResposta = 'Ocorrência mantida e confirmada com sucesso!';
      if (acao === 'rejeitar') {
        mensagemResposta = 'Ocorrência removida/rejeitada com sucesso!';
      } else if (acao === 'resolver') {
        mensagemResposta = 'Ocorrência marcada como resolvida (será arquivada em 24h)!';
      }

      LogAtividadeService.registrar({ usuarioId: req.usuarioId, acao: `MODERAR_OCORRENCIA:${acao}:${ocorrenciaId}`, req });

      return res.status(200).json({
        mensagem: mensagemResposta,
        ocorrencia: resultado
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao moderar ocorrência';
      return res.status(400).json({ error: errorMessage });
    }
  }

  async banirUsuario(req: RequisicaoAutenticada, res: Response) {
    try {
      const idParam = req.params.usuarioId;
      const usuarioId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);

      if (isNaN(usuarioId)) {
        return res.status(400).json({ error: 'ID de usuário inválido' });
      }

      const resultado = await adminService.banirUsuario(usuarioId);

      NotificacaoService.criarGatilhoNotificacao({
        usuarioId: usuarioId,
        titulo: 'Conta desativada',
        mensagem: 'Sua conta foi desativada por descumprir as regras de convivência.',
        tipo: 'sistema'
      }).catch(function(err) {
        console.error('[ERRO NOTIFICAÇÃO BANIR]:', err);
      });

      LogAtividadeService.registrar({ usuarioId: req.usuarioId, acao: `BANIR_USUARIO:${usuarioId}`, req });

      return res.status(200).json({
        mensagem: 'Usuário desativado com sucesso.',
        usuario: resultado
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao banir usuário';
      return res.status(400).json({ error: errorMessage });
    }
  }

  async desbanirUsuario(req: RequisicaoAutenticada, res: Response) {
    try {
      const idParam = req.params.usuarioId;
      const usuarioId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);

      if (isNaN(usuarioId)) {
        return res.status(400).json({ error: 'ID de usuário inválido.' });
      }

      const resultado = await adminService.desbanirUsuario(usuarioId);

      NotificacaoService.criarGatilhoNotificacao({
        usuarioId: usuarioId,
        titulo: 'Conta reativada',
        mensagem: 'Sua conta foi reativada. Você já pode usar o DangerMap normalmente.',
        tipo: 'sistema'
      }).catch(function(err) {
        console.error('[ERRO NOTIFICAÇÃO DESBANIR]:', err);
      });

      LogAtividadeService.registrar({ usuarioId: req.usuarioId, acao: `REATIVAR_USUARIO:${usuarioId}`, req });

      return res.status(200).json({
        mensagem: 'Usuário reativado com sucesso.',
        usuario: resultado
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao desbanir usuário.';
      return res.status(400).json({ error: errorMessage });
    }
  }

  async relatorioAreaGeografica(req: RequisicaoAutenticada, res: Response) {
    try {
      const latitude = Number(req.query.lat);
      const longitude = Number(req.query.lng);
      const raioMetros = Number(req.query.raio) || 5000;

      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ error: 'Latitude e longitude válidas são obrigatórias.' });
      }

      return res.status(200).json(await buscarPorRaio(latitude, longitude, raioMetros));
    } catch (error: unknown) {
      console.error('[ERRO POSTGIS RELATORIO]:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar relatório geográfico.';
      return res.status(500).json({ error: errorMessage });
    }
  }

  async relatorioAreaGeograficaPdf(req: RequisicaoAutenticada, res: Response) {
    try {
      const latitude = Number(req.query.lat);
      const longitude = Number(req.query.lng);
      const raioMetros = Number(req.query.raio) || 5000;

      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ error: 'Latitude e longitude válidas são obrigatórias.' });
      }

      const filtros = lerFiltros(req.query);
      const ocorrencias = aplicarFiltros(await buscarPorRaio(latitude, longitude, raioMetros), filtros);
      const raioKm = (raioMetros / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 });

      gerarPdfOcorrencias(res, {
        titulo: 'Extração regional',
        subtitulo: `Centro ${latitude.toFixed(5)}, ${longitude.toFixed(5)}  ·  raio de ${raioKm} km  ·  gerado em ${new Date().toLocaleString('pt-BR')}`,
        filtros: await descreverFiltros(filtros),
        ocorrencias,
        nomeArquivo: 'extracao-regional.pdf',
        comDistancia: true,
      });
    } catch (error: unknown) {
      console.error('[ERRO RELATORIO REGIONAL PDF]:', error);
      if (!res.headersSent) return res.status(500).json({ error: 'Erro ao gerar o PDF da extração regional.' });
      return res.end();
    }
  }

  async relatorioPorEstado(req: RequisicaoAutenticada, res: Response) {
    try {
      const resultado = await buscarPorEstado(String(req.query.uf || ''));
      if ('erro' in resultado) {
        return resultado.erro === 'uf-invalida'
          ? res.status(400).json({ error: 'Informe uma UF válida (ex.: SC).' })
          : res.status(502).json({ error: 'Não foi possível obter a fronteira desse estado agora.' });
      }
      return res.status(200).json(resultado);
    } catch (error: unknown) {
      console.error('[ERRO POSTGIS RELATORIO POR ESTADO]:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar relatório por estado.';
      return res.status(500).json({ error: errorMessage });
    }
  }

  async relatorioPorEstadoPdf(req: RequisicaoAutenticada, res: Response) {
    try {
      const resultado = await buscarPorEstado(String(req.query.uf || ''));
      if ('erro' in resultado) {
        return resultado.erro === 'uf-invalida'
          ? res.status(400).json({ error: 'Informe uma UF válida (ex.: SC).' })
          : res.status(502).json({ error: 'Não foi possível obter a fronteira desse estado agora.' });
      }

      const filtros = lerFiltros(req.query);
      const nome = String(req.query.nome || '').slice(0, 40).replace(/[^\p{L}\p{N} .'-]/gu, '');
      const rotuloEstado = nome ? `${nome} (${resultado.uf})` : resultado.uf;

      gerarPdfOcorrencias(res, {
        titulo: `Extração por estado — ${rotuloEstado}`,
        subtitulo: `Ocorrências dentro da fronteira do estado  ·  gerado em ${new Date().toLocaleString('pt-BR')}`,
        filtros: await descreverFiltros(filtros),
        ocorrencias: aplicarFiltros(resultado.ocorrencias, filtros),
        nomeArquivo: `extracao-${resultado.uf.toLowerCase()}.pdf`,
      });
    } catch (error: unknown) {
      console.error('[ERRO RELATORIO ESTADO PDF]:', error);
      if (!res.headersSent) return res.status(500).json({ error: 'Erro ao gerar o PDF da extração por estado.' });
      return res.end();
    }
  }

  async obterEstatisticas(req: RequisicaoAutenticada, res: Response) {
    try {
      const estatisticas = await DashboardService.obterEstatisticas();
      return res.status(200).json(estatisticas);
    } catch (error: unknown) {
      console.error('[ERRO DASHBOARD]:', error);
      return res.status(500).json({ error: 'Erro ao gerar estatísticas do dashboard.' });
    }
  }

  async exportarRelatorioPdf(req: RequisicaoAutenticada, res: Response) {
    try {
      const estatisticas = await DashboardService.obterEstatisticas();
      gerarPdfEstatisticas(res, estatisticas);
    } catch (error: unknown) {
      console.error('[ERRO RELATORIO PDF]:', error);
      if (!res.headersSent) {
        return res.status(500).json({ error: 'Erro ao gerar relatório em PDF.' });
      }
      return res.end();
    }
  }
  async filaModeracaoOcorrencias(req: RequisicaoAutenticada, res: Response) {
    try {
      const limite = await ParametroService.obterNumero('limite_denuncias_ocorrencia');
      const ocorrencias = await ocorrenciaRepository.listarComDenunciasAcimaDoLimite(limite);
      return res.status(200).json({ limite, ocorrencias });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Erro ao buscar fila de moderação de ocorrências.' });
    }
  }

  async filaUsuariosDenunciados(req: RequisicaoAutenticada, res: Response) {
    try {
      const limite = await ParametroService.obterNumero('limite_denuncias_usuario');
      const usuarios = await usuarioRepository.listarComDenunciasAcimaDoLimite(limite);
      return res.status(200).json({ limite, usuarios });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Erro ao buscar fila de usuários denunciados.' });
    }
  }

  async listarParametros(req: RequisicaoAutenticada, res: Response) {
    try {
      const parametros = await ParametroService.listarParaAdmin();
      return res.status(200).json(parametros);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Erro ao listar parâmetros.' });
    }
  }

}