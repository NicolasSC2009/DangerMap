import { Response, Request } from 'express';
import { OcorrenciaService } from '../services/OcorrenciaService.js';
import { ZodError } from 'zod';

const ocorrenciaService = new OcorrenciaService();

export class OcorrenciaController {
  async cadastrar(req: Request, res: Response): Promise<Response> {
    try {
      // @ts-ignore
      const usuarioId = req.usuarioId; 
      
      const novaOcorrencia = await ocorrenciaService.registrar(req.body, usuarioId);

      return res.status(201).json({
        mensagem: 'Ocorrência registrada com sucesso!',
        ocorrencia: novaOcorrencia
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const errosFormatados = error.issues.map(issue => issue.message);
        return res.status(400).json({ erros: errosFormatados });
      }
      return res.status(500).json({ error: 'Erro interno ao registrar ocorrência.' });
    }
  }

  async listar(req: Request, res: Response): Promise<Response> {
    try {
      const ocorrencias = await ocorrenciaService.obterTodas();
      return res.status(200).json(ocorrencias);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar ocorrências para o mapa.' });
    }
  }
}