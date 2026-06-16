import { Request, Response } from 'express';
import { CadastroService } from '../services/cadastroService.js';
import { cadastroSchema } from '../schemas/authSchema.js';
import { ZodError } from 'zod';

const cadastroService = new CadastroService();

export class CadastroController {
  async lidar(req: Request, res: Response): Promise<Response> {
    try {
      // O Zod intercepta e valida os dados do body aqui
      const dadosValidados = cadastroSchema.parse(req.body);

      // Se passou, manda os dados limpos para o service
      const novoUsuario = await cadastroService.executar(dadosValidados);

      return res.status(201).json(novoUsuario);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const errosFormatados = error.issues.map(function (err) {
          return err.message;
        });
        return res.status(400).json({ erros: errosFormatados });
      }

      const errorMessage = error instanceof Error ? error.message : 'Erro interno no servidor';
      return res.status(400).json({ error: errorMessage });
    }
  }
}