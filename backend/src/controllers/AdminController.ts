import { Response } from 'express';
import { RequisicaoAutenticada } from '../middlewares/authMiddleware.js';
import { AdminService } from '../services/AdminService.js';
import { NotificacaoService } from '../services/NotificacaoService.js';

const adminService = new AdminService();

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
        const categoriaNome = (resultado as any).categoria?.nome;

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

      // Alerta de reativação de conta
      NotificacaoService.criarGatilhoNotificacao({
        usuarioId: usuarioId,
        titulo: 'Conta Reativada',
        mensagem: 'Sua conta no DangerMap foi reativada com sucesso! Você já pode navegar e colaborar novamente.',
        tipo: 'sistema'
      }).catch(function(err) {
        console.error('[ERRO NOTIFICAÇÃO DESBANIR]:', err);
      });

      return res.status(200).json({
        mensagem: 'Usuário reativado/desbanido com sucesso!',
        usuario: resultado
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao desbanir usuário.';
      return res.status(400).json({ error: errorMessage });
    }
  }
}