import { Response } from 'express';
import { UsuarioRepository } from '../repositories/usuarioRepository.js';
import { RequisicaoAutenticada } from '../middlewares/authMiddleware.js';

const usuarioRepository = new UsuarioRepository();

export class UsuarioController {
  async excluirMinhaConta(req: RequisicaoAutenticada, res: Response): Promise<Response> {
    try {
      const usuarioId = req.usuarioId;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuario não autenticado' });
      }

      await usuarioRepository.desativarUsuario(usuarioId);

      return res.status(200).json({ mensagem: 'Sua conta foi excluida e desativada com sucesso' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao tentar excluir a conta' });
    }
  }

  async reativarContaPorAdmin(req: RequisicaoAutenticada, res: Response): Promise<Response> {
    try {
      if (req.usuarioTipo !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem reativar contas.' });
      }

      const { usuarioIdParaReativar } = req.body;

      if (!usuarioIdParaReativar) {
        return res.status(400).json({ error: 'O ID do usuário a ser reativado é obrigatório.' });
      }

      // Executa a reativação no banco
      await usuarioRepository.reativarUsuario(Number(usuarioIdParaReativar));

      return res.status(200).json({ mensagem: 'A conta do usuário foi reativada com sucesso pelo administrador!' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao tentar reativar a conta.' });
    }
  }
}