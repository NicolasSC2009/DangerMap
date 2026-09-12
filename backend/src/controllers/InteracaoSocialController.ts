import { Response } from 'express';
import { RequisicaoAutenticada } from '../middlewares/authMiddleware.js';
import { InteracaoSocialService } from '../services/InteracaoSocialService.js';
import { NotificacaoService } from '../services/NotificacaoService.js';
import { OcorrenciaRepository } from '../repositories/OcorrenciaRepository.js';

const interacaoSocialService = new InteracaoSocialService();
const ocorrenciaRepository = new OcorrenciaRepository();

function extrairOcorrenciaId(req: RequisicaoAutenticada): number {
  const idParam = req.params.ocorrenciaId;
  return parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
}

export class InteracaoSocialController {
  async curtir(req: RequisicaoAutenticada, res: Response) {
    try {
      const usuarioId = req.usuarioId;
      const ocorrenciaId = extrairOcorrenciaId(req);

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
      }
      if (isNaN(ocorrenciaId)) {
        return res.status(400).json({ error: 'ID da ocorrência inválido.' });
      }

      const resultado = await interacaoSocialService.curtir(usuarioId, ocorrenciaId);

      ocorrenciaRepository.buscarPorId(ocorrenciaId).then(function (ocorrencia) {
        if (ocorrencia && ocorrencia.usuario_id && ocorrencia.usuario_id !== usuarioId) {
          NotificacaoService.criarGatilhoNotificacao({
            usuarioId: ocorrencia.usuario_id,
            ocorrenciaId: ocorrenciaId,
            titulo: 'Nova Curtida',
            mensagem: 'Sua ocorrência recebeu uma curtida de apoio.',
            tipo: 'confirmacao',
          });
        }
      }).catch(function (err) {
        console.error('[ERRO NOTIFICAÇÃO CURTIDA]:', err);
      });

      return res.status(201).json({ mensagem: 'Ocorrência curtida com sucesso!', ...resultado });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao curtir ocorrência.';
      return res.status(400).json({ error: msg });
    }
  }

  async retirarCurtida(req: RequisicaoAutenticada, res: Response) {
    try {
      const usuarioId = req.usuarioId;
      const ocorrenciaId = extrairOcorrenciaId(req);

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
      }
      if (isNaN(ocorrenciaId)) {
        return res.status(400).json({ error: 'ID da ocorrência inválido.' });
      }

      const resultado = await interacaoSocialService.retirarCurtida(usuarioId, ocorrenciaId);
      return res.status(200).json({ mensagem: 'Curtida removida com sucesso!', ...resultado });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao remover curtida.';
      return res.status(400).json({ error: msg });
    }
  }

  async compartilhar(req: RequisicaoAutenticada, res: Response) {
    try {
      const usuarioId = req.usuarioId;
      const ocorrenciaId = extrairOcorrenciaId(req);

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
      }
      if (isNaN(ocorrenciaId)) {
        return res.status(400).json({ error: 'ID da ocorrência inválido.' });
      }

      const resultado = await interacaoSocialService.registrarCompartilhamento(usuarioId, ocorrenciaId);
      return res.status(201).json({ mensagem: 'Compartilhamento registrado!', ...resultado });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao registrar compartilhamento.';
      return res.status(400).json({ error: msg });
    }
  }
}
