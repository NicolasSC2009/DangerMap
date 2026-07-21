import { Response } from 'express';
import { RequisicaoAutenticada } from '../middlewares/authMiddleware.js';
import { AdminService } from '../services/AdminService.js';

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

      if (!acao || !['rejeitar', 'manter'].includes(acao)) {
        return res.status(400).json({ error: 'Ação inválida. Use "rejeitar" ou "manter"' });
      }

      const resultado = await adminService.moderarOcorrencia(ocorrenciaId, acao);

      return res.status(200).json({
        mensagem: `Ocorrência ${acao === 'rejeitar' ? 'removida/rejeitada' : 'mantida e confirmada'} com sucesso!`,
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

      return res.status(200).json({
        mensagem: 'Usuário inativado/banido com sucesso!',
        usuario: resultado
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao banir usuário';
      return res.status(400).json({ error: errorMessage });
    }
  }
}