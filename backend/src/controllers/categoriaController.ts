import { Response } from 'express';
import { CategoriaService } from '../services/CategoriaService.js';
import { RequisicaoAutenticada } from '../middlewares/authMiddleware.js';

const categoriaService = new CategoriaService();

export class CategoriaController {
  async criar(req: RequisicaoAutenticada, res: Response): Promise<Response> {
    try {
      if (req.usuarioTipo !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado, apenas administradores podem gerenciar categorias' });
      }

      const { nome, descricao, icone_url } = req.body;
      const novaCategoria = await categoriaService.criar({ nome, descricao, icone_url });

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
}