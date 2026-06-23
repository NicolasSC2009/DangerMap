import { Request, Response } from 'express';
import { RecuperacaoSenhaService } from '../services/RecuperacaoSenhaService.js';

const recuperacaoSenhaService = new RecuperacaoSenhaService();

export class RecuperacaoSenhaController {
  async solicitar(req: Request, res: Response): Promise<Response> {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'O email é obrigatório' });
      }

      const resultado = await recuperacaoSenhaService.enviarToken(email);
      return res.status(200).json(resultado);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar solicitação';
      return res.status(400).json({ error: errorMessage });
    }
  }
  
  async resetar(req: Request, res: Response): Promise<Response> {
    try {
      const { token, novaSenha } = req.body;
      if (!token || !novaSenha) {
        return res.status(400).json({ error: 'Código (token) e nova senha são obrigatórios' });
      }

      const resultado = await recuperacaoSenhaService.resetarSenha(token, novaSenha);
      return res.status(200).json(resultado);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao resetar senha';
      return res.status(400).json({ error: errorMessage });
    }
  }
}