import { Request, Response } from 'express';
import { NotificacaoService } from '../services/NotificacaoService.js';

export class NotificacaoController {
  static async listar(req: Request, res: Response) {
    try {
      const usuarioId = (req as any).usuarioId;
      const apenasNaoLidas = req.query.lidas === 'false';

      const resultado = await NotificacaoService.listarNotificacoes(usuarioId, apenasNaoLidas);
      return res.status(200).json(resultado);
    } catch (error: any) {
      return res.status(400).json({ mensagem: error.message });
    }
  }

  static async lerUma(req: Request, res: Response) {
    try {
      const usuarioId = (req as any).usuarioId;
      const id = Number(req.params.id);

      const atualizado = await NotificacaoService.marcarComoLida(id, usuarioId);
      return res.status(200).json(atualizado);
    } catch (error: any) {
      return res.status(400).json({ mensagem: error.message });
    }
  }

  static async lerTodas(req: Request, res: Response) {
    try {
      const usuarioId = (req as any).usuarioId;
      await NotificacaoService.marcarTodasComoLidas(usuarioId);
      return res.status(200).json({ mensagem: 'Todas as notificações foram marcadas como lidas' });
    } catch (error: any) {
      return res.status(400).json({ mensagem: error.message });
    }
  }

  static async deletar(req: Request, res: Response) {
    try {
      const usuarioId = (req as any).usuarioId;
      const id = Number(req.params.id);

      await NotificacaoService.deletar(id, usuarioId);
      return res.status(200).json({ mensagem: 'Notificação excluída com sucesso' });
    } catch (error: any) {
      return res.status(400).json({ mensagem: error.message });
    }
  }
}