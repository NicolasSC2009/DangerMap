import { Response, Request } from 'express';
import { OcorrenciaService } from '../services/OcorrenciaService.js';
import { NotificacaoService } from '../services/NotificacaoService.js';
import { ZodError } from 'zod';
import { PrismaClient } from '@prisma/client';

const ocorrenciaService = new OcorrenciaService();
const prisma = new PrismaClient();

export class OcorrenciaController {
  async cadastrar(req: Request, res: Response): Promise<Response> {
    try {
      // @ts-ignore
      const usuarioId = req.usuarioId; 
      
      const novaOcorrencia = await ocorrenciaService.registrar(req.body, usuarioId);

      if (novaOcorrencia && novaOcorrencia.latitude && novaOcorrencia.longitude) {
        const categoriaNome = (novaOcorrencia as any).categoria?.nome || 'Perigo';
        NotificacaoService.notificarUsuariosProximos(
          novaOcorrencia.id,
          Number(novaOcorrencia.latitude),
          Number(novaOcorrencia.longitude),
          categoriaNome,
          usuarioId,
          600
        ).catch(function(err) {
          console.error('[ERRO NOTIFICAÇÃO PROXIMIDADE]:', err);
        });
      }

      return res.status(201).json({
        mensagem: 'Ocorrência registrada com sucesso!',
        ocorrencia: novaOcorrencia
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const errosFormatados = error.issues.map(function(issue) { return issue.message; });
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

  async removerFoto(req: Request, res: Response): Promise<Response> {
    try {
      const idOcorrencia = Number(req.params.id);

      const ocorrenciaAtualizada = await prisma.ocorrencia.update({
        where: { id: idOcorrencia },
        data: { imagem_url: null }
      });

      return res.status(200).json({
        mensagem: 'Foto removida com sucesso mantendo a ocorrência intacta.',
        ocorrencia: ocorrenciaAtualizada
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao remover foto da ocorrência.' });
    }
  }
}