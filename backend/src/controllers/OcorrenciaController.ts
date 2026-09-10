import { Response, Request } from 'express';
import { OcorrenciaService } from '../services/OcorrenciaService.js';
import { NotificacaoService } from '../services/NotificacaoService.js';
import { LogAtividadeService } from '../services/LogAtividadeService.js';
import { ParametroService } from '../services/ParametroService.js';
import { SugestaoCategoriaService } from '../services/SugestaoCategoriaService.js';
import { RequisicaoAutenticada } from '../middlewares/authMiddleware.js';
import { ZodError } from 'zod';

const ocorrenciaService = new OcorrenciaService();

export class OcorrenciaController {
  async cadastrar(req: RequisicaoAutenticada, res: Response): Promise<Response> {
    try {
      const usuarioId = req.usuarioId as number;

      const novaOcorrencia = await ocorrenciaService.registrar(req.body, usuarioId);

      if (novaOcorrencia && novaOcorrencia.latitude && novaOcorrencia.longitude) {
        const categoriaNome = (novaOcorrencia as any).categoria?.nome || 'Perigo';
        ParametroService.obterNumero('raio_notificacao_proximidade_metros').then(function (raio) {
          return NotificacaoService.notificarUsuariosProximos(
            novaOcorrencia.id,
            Number(novaOcorrencia.latitude),
            Number(novaOcorrencia.longitude),
            categoriaNome,
            usuarioId,
            raio
          );
        }).catch(function(err) {
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

  async uploadFoto(req: RequisicaoAutenticada, res: Response): Promise<Response> {
    try {
      const idOcorrencia = Number(req.params.id);
      if (isNaN(idOcorrencia)) {
        return res.status(400).json({ error: 'ID da ocorrência inválido.' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Nenhuma imagem enviada. Use o campo "imagem".' });
      }

      const caminhoPublico = `/uploads/ocorrencias/${req.file.filename}`;
      const ocorrenciaAtualizada = await ocorrenciaService.definirFoto(
        idOcorrencia,
        req.usuarioId as number,
        req.usuarioTipo,
        caminhoPublico
      );

      LogAtividadeService.registrar({ usuarioId: req.usuarioId, acao: `UPLOAD_FOTO_OCORRENCIA:${idOcorrencia}`, req });

      return res.status(200).json({
        mensagem: 'Foto enviada com sucesso!',
        ocorrencia: ocorrenciaAtualizada
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao enviar foto da ocorrência.';
      return res.status(400).json({ error: msg });
    }
  }

  async removerFoto(req: RequisicaoAutenticada, res: Response): Promise<Response> {
    try {
      const idOcorrencia = Number(req.params.id);
      if (isNaN(idOcorrencia)) {
        return res.status(400).json({ error: 'ID da ocorrência inválido.' });
      }

      const ocorrenciaAtualizada = await ocorrenciaService.removerFoto(idOcorrencia);

      LogAtividadeService.registrar({ usuarioId: req.usuarioId, acao: `REMOVER_FOTO_OCORRENCIA:${idOcorrencia}`, req });

      return res.status(200).json({
        mensagem: 'Foto removida com sucesso mantendo a ocorrência intacta.',
        ocorrencia: ocorrenciaAtualizada
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao remover foto da ocorrência.';
      return res.status(400).json({ error: msg });
    }
  }

  async sugerirCategoria(req: Request, res: Response): Promise<Response> {
    try {
      const { descricao } = req.body;
      if (!descricao || typeof descricao !== 'string') {
        return res.status(400).json({ error: 'Informe uma descrição para sugerir a categoria.' });
      }

      const sugestao = await SugestaoCategoriaService.sugerirPorTexto(descricao);
      return res.status(200).json(sugestao);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Erro ao sugerir categoria.' });
    }
  }
}