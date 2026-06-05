import { Request, Response } from 'express';
import { CadastroService } from '../services/cadastroService.js';

const cadastroService = new CadastroService();

export class CadastroController {
  async lidar(req: Request, res: Response): Promise<Response> {
    try {
      const { nome, email, senha } = req.body;

      if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Todos os campos (nome, email, senha) são obrigatórios' });
      }

      const novoUsuario = await cadastroService.executar({ nome, email, senha });

      return res.status(201).json(novoUsuario);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro interno no servidor';
      return res.status(400).json({ error: errorMessage });
    }
  }
}