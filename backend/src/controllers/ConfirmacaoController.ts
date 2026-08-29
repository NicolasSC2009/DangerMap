import { Response } from 'express';
import { RequisicaoAutenticada } from '../middlewares/authMiddleware.js';
import { ConfirmacaoService } from '../services/ConfirmacaoService.js';
import { NotificacaoService } from '../services/NotificacaoService.js';

const confirmacaoService = new ConfirmacaoService();

export class ConfirmacaoController {
  async confirmar(req: RequisicaoAutenticada, res: Response) {
    try {
      const usuarioId = req.usuarioId;
      const idParam = req.params.ocorrenciaId;
      const ocorrenciaId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
      }

      if (isNaN(ocorrenciaId)) {
        return res.status(400).json({ error: 'ID da ocorrência inválido.' });
      }

      const resultado = await confirmacaoService.executarConfirmacao(usuarioId, ocorrenciaId);

      if (resultado && (resultado as any).ocorrencia?.usuario_id) {
        const autorId = (resultado as any).ocorrencia.usuario_id;
        if (autorId !== usuarioId) {
          NotificacaoService.criarGatilhoNotificacao({
            usuarioId: autorId,
            ocorrenciaId: ocorrenciaId,
            titulo: 'Nova Confirmação',
            mensagem: 'Sua ocorrência recebeu uma nova confirmação de um cidadão.',
            tipo: 'confirmacao'
          }).catch(function(err) {
            console.error('[ERRO NOTIFICAÇÃO CONFIRMAÇÃO]:', err);
          });
        }
      }

      return res.status(201).json({
        mensagem: 'Ocorrência confirmada com sucesso!',
        confirmacao: resultado
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao confirmar ocorrência.';
      return res.status(400).json({ error: errorMessage });
    }
  }

  async retirar(req: RequisicaoAutenticada, res: Response) {
    try {
      const usuarioId = req.usuarioId;
      const idParam = req.params.ocorrenciaId;
      const ocorrenciaId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
      }

      if (isNaN(ocorrenciaId)) {
        return res.status(400).json({ error: 'ID da ocorrência inválido.' });
      }

      const resultado = await confirmacaoService.executarRetirada(usuarioId, ocorrenciaId);

      return res.status(200).json({
        mensagem: 'Confirmação retirada com sucesso!',
        resultado
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao retirar confirmação.';
      return res.status(400).json({ error: errorMessage });
    }
  }
}