import { Request, Response } from 'express';
import { LoginService } from '../services/loginService.js';

const loginService = new LoginService();

export class LoginController {
  async lidar(req: Request, res: Response): Promise<Response> {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      const resultado = await loginService.executar({ email, senha });

      return res.status(200).json(resultado);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro interno no servidor';
      return res.status(401).json({ error: errorMessage });
    }
  }
}