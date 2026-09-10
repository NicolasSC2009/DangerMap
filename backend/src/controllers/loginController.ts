import { Request, Response } from 'express';
import { LoginService } from '../services/LoginService.js';
import { REFRESH_TOKEN_COOKIE_MAX_AGE_MS } from '../config/auth.js';

const loginService = new LoginService();

export class LoginController {
  async lidar(req: Request, res: Response): Promise<Response> {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      const resultado = await loginService.executar({ email, senha }) as any;

      if (resultado && resultado.refreshToken) {
        res.cookie('refreshToken', resultado.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_MS
        });

        delete resultado.refreshToken;
      }

      return res.status(200).json(resultado);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro interno no servidor';
      return res.status(401).json({ error: errorMessage });
    }
  }
}