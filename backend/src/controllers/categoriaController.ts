import { Response } from 'express';
import { CategoriaService } from '../services/CategoriaService.js';
import { RequisicaoAutenticada } from '../middlewares/authMiddleware.js';
import { LogAtividadeService } from '../services/LogAtividadeService.js';

const categoriaService = new CategoriaService();

export class CategoriaController {
  async criar(req: RequisicaoAutenticada, res: Response): Promise<Response> {
    try {
      const { nome, descricao, icone_url } = req.body;
      const novaCategoria = await categoriaService.criar({ nome, descricao, icone_url });

      LogAtividadeService.registrar({ usuarioId: req.usuarioId, acao: `CRIAR_CATEGORIA:${novaCategoria.id}`, req });

      return res.status(201).json(novaCategoria);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro interno';
      return res.status(400).json({ error: errorMessage });
    }
  }

  async listar(req: RequisicaoAutenticada, res: Response): Promise<Response> {
    try {
      const categorias = await categoriaService.listar();
      return res.status(200).json(categorias);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Erro ao buscar categorias' });
    }
  }

  async listarAdmin(req: RequisicaoAutenticada, res: Response): Promise<Response> {
    try {
      const categorias = await categoriaService.listarAdmin();
      return res.status(200).json(categorias);
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Erro ao buscar categorias.' });
    }
  }

  async atualizar(req: RequisicaoAutenticada, res: Response): Promise<Response> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de categoria inválido.' });
      }

      const { nome, descricao, icone_url } = req.body;
      const categoria = await categoriaService.atualizar(id, { nome, descricao, icone_url });

      LogAtividadeService.registrar({ usuarioId: req.usuarioId, acao: `EDITAR_CATEGORIA:${id}`, req });

      return res.status(200).json(categoria);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao atualizar categoria.';
      return res.status(400).json({ error: msg });
    }
  }

  async definirAtivo(req: RequisicaoAutenticada, res: Response): Promise<Response> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de categoria inválido.' });
      }

      const { ativo } = req.body;
      if (typeof ativo !== 'boolean') {
        return res.status(400).json({ error: 'O campo "ativo" (booleano) é obrigatório.' });
      }

      const categoria = await categoriaService.definirAtivo(id, ativo);

      LogAtividadeService.registrar({
        usuarioId: req.usuarioId,
        acao: `${ativo ? 'ATIVAR' : 'DESATIVAR'}_CATEGORIA:${id}`,
        req
      });

      return res.status(200).json(categoria);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao alterar status da categoria.';
      return res.status(400).json({ error: msg });
    }
  }
}