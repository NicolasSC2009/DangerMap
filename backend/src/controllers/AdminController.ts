import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { PrismaClient } from '@prisma/client';
import { RequisicaoAutenticada } from '../middlewares/authMiddleware.js';
import { AdminService } from '../services/AdminService.js';
import { NotificacaoService } from '../services/NotificacaoService.js';
import { LogAtividadeService } from '../services/LogAtividadeService.js';
import { ParametroService } from '../services/ParametroService.js';
import { DashboardService } from '../services/DashboardService.js';
import { OcorrenciaRepository } from '../repositories/OcorrenciaRepository.js';
import { UsuarioRepository } from '../repositories/UsuarioRepository.js';

const adminService = new AdminService();
const ocorrenciaRepository = new OcorrenciaRepository();
const usuarioRepository = new UsuarioRepository();
const prisma = new PrismaClient();

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
            ? 'Sua ocorrência entrou em análise de moderação e foi removida.'
            : 'Sua ocorrência foi analisada e mantida ativa no mapa.';

          NotificacaoService.criarGatilhoNotificacao({
            usuarioId: autorId,
            ocorrenciaId: ocorrenciaId,
            titulo: 'Moderação de Ocorrência',
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
        titulo: 'Conta Inativada',
        mensagem: 'Sua conta foi temporariamente inativada por violar as diretrizes da comunidade.',
        tipo: 'sistema'
      }).catch(function(err) {
        console.error('[ERRO NOTIFICAÇÃO BANIR]:', err);
      });

      LogAtividadeService.registrar({ usuarioId: req.usuarioId, acao: `BANIR_USUARIO:${usuarioId}`, req });

      return res.status(200).json({
        mensagem: 'Usuário inativado/banido com sucesso!',
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
        titulo: 'Conta Reativada',
        mensagem: 'Sua conta no DangerMap foi reativada com sucesso! Você já pode navegar e colaborar novamente.',
        tipo: 'sistema'
      }).catch(function(err) {
        console.error('[ERRO NOTIFICAÇÃO DESBANIR]:', err);
      });

      LogAtividadeService.registrar({ usuarioId: req.usuarioId, acao: `REATIVAR_USUARIO:${usuarioId}`, req });

      return res.status(200).json({
        mensagem: 'Usuário reativado/desbanido com sucesso!',
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

      const ocorrencias = await prisma.$queryRaw`
        SELECT
          o.id,
          o.descricao,
          o.latitude,
          o.longitude,
          o.gravidade,
          o.status,
          o.data_registro,
          ROUND(
            ST_Distance(
              ST_SetSRID(ST_MakePoint(o.longitude, o.latitude), 4326)::geography,
              ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
            )::numeric, 2
          ) AS distancia_metros
        FROM ocorrencias o
        WHERE ST_DWithin(
          ST_SetSRID(ST_MakePoint(o.longitude, o.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${raioMetros}
        )
        ORDER BY distancia_metros ASC;
      `;

      return res.status(200).json(ocorrencias);
    } catch (error: unknown) {
      console.error('[ERRO POSTGIS RELATORIO]:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar relatório geográfico.';
      return res.status(500).json({ error: errorMessage });
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

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="relatorio-dangermap.pdf"');

      const documento = new PDFDocument({ margin: 50 });
      documento.pipe(res);

      documento.fontSize(20).text('DangerMap - Relatório Administrativo', { align: 'center' });
      documento.moveDown();
      documento.fontSize(10).fillColor('#555555').text(
        `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
        { align: 'center' }
      );
      documento.moveDown(2);

      documento.fillColor('#000000').fontSize(14).text('Resumo Geral');
      documento.fontSize(11);
      documento.text(`Total de ocorrências: ${estatisticas.totais.totalOcorrencias}`);
      documento.text(`Total de usuários: ${estatisticas.totais.totalUsuarios} (${estatisticas.totais.totalUsuariosAtivos} ativos)`);
      documento.text(`Total de denúncias: ${estatisticas.totais.totalDenuncias}`);
      documento.text(`Total de confirmações: ${estatisticas.totais.totalConfirmacoes}`);
      documento.moveDown();

      documento.fontSize(14).text('Ocorrências por Status');
      documento.fontSize(11);
      for (const item of estatisticas.ocorrenciasPorStatus) {
        documento.text(`${item.status || 'N/A'}: ${item.total}`);
      }
      documento.moveDown();

      documento.fontSize(14).text('Ocorrências por Gravidade');
      documento.fontSize(11);
      for (const item of estatisticas.ocorrenciasPorGravidade) {
        documento.text(`${item.gravidade || 'N/A'}: ${item.total}`);
      }
      documento.moveDown();

      documento.fontSize(14).text('Ocorrências por Categoria');
      documento.fontSize(11);
      for (const item of estatisticas.ocorrenciasPorCategoria) {
        documento.text(`${item.categoriaNome}: ${item.total}`);
      }

      documento.end();
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

  async atualizarParametro(req: RequisicaoAutenticada, res: Response) {
    try {
      const chaveParam = req.params.chave;
      const chave = Array.isArray(chaveParam) ? chaveParam[0] : chaveParam;
      const { valor } = req.body;

      if (!valor || typeof valor !== 'string') {
        return res.status(400).json({ error: 'O valor do parâmetro é obrigatório.' });
      }

      const atualizado = await ParametroService.atualizar(chave, valor);

      LogAtividadeService.registrar({ usuarioId: req.usuarioId, acao: `ALTERAR_PARAMETRO:${chave}=${valor}`, req });

      return res.status(200).json({ mensagem: 'Parâmetro atualizado com sucesso!', parametro: atualizado });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao atualizar parâmetro.';
      return res.status(400).json({ error: msg });
    }
  }
}