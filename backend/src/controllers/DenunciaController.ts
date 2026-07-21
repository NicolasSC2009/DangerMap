import { Response } from 'express';
import { RequisicaoAutenticada } from '../middlewares/authMiddleware.js';
import { DenunciaService } from '../services/DenunciaService.js';

const denunciaService = new DenunciaService();

export class DenunciaController {
  async criar(req: RequisicaoAutenticada, res: Response) {
    try {
      const usuarioId = req.usuarioId;
      const idParam = req.params.ocorrenciaId;
      const ocorrenciaId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
      const { motivo } = req.body;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      if (isNaN(ocorrenciaId)) {
        return res.status(400).json({ error: 'ID da ocorrência inválido' });
      }

      const denuncia = await denunciaService.criarDenuncia(usuarioId, ocorrenciaId, motivo);

      return res.status(201).json({
        mensagem: 'Denúncia enviada com sucesso! Seu caso será analisado!',
        denuncia
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao registrar denúncia';
      return res.status(400).json({ error: errorMessage });
    }
  }

  async listar(req: RequisicaoAutenticada, res: Response) {
    try {
      const denuncias = await denunciaService.listarDenuncias();
      return res.status(200).json(denuncias);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar denúncias';
      return res.status(500).json({ error: errorMessage });
    }
  }
}