import { Response } from 'express';
import { RequisicaoAutenticada } from '../middlewares/authMiddleware.js';
import { UsuarioService } from '../services/UsuarioService.js';

const usuarioService = new UsuarioService();

export class UsuarioController {

  async excluirMinhaConta(req: RequisicaoAutenticada, res: Response): Promise<Response> {
    try {
      const usuarioId = req.usuarioId;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      await usuarioService.desativarMinhaConta(usuarioId);

      return res.status(200).json({ mensagem: 'Sua conta foi excluída e desativada com sucesso' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao tentar excluir a conta' });
    }
  }

  async reativarContaPorAdmin(req: RequisicaoAutenticada, res: Response): Promise<Response> {
    try {
      if (req.usuarioTipo !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem reativar contas' });
      }

      const { usuarioIdParaReativar } = req.body;

      if (!usuarioIdParaReativar) {
        return res.status(400).json({ error: 'O ID do usuário a ser reativado é obrigatório' });
      }

      await usuarioService.reativarConta(Number(usuarioIdParaReativar));

      return res.status(200).json({ mensagem: 'A conta do usuário foi reativada com sucesso pelo administrador!' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao tentar reativar a conta.' });
    }
  }

  async obterMeuPerfil(req: RequisicaoAutenticada, res: Response): Promise<Response> {
    try {
      const usuarioId = req.usuarioId;
      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const perfil = await usuarioService.obterMeuPerfil(usuarioId);
      return res.status(200).json(perfil);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao obter perfil';
      return res.status(400).json({ error: msg });
    }
  }

  async obterPerfilPublico(req: RequisicaoAutenticada, res: Response): Promise<Response> {
    try {
      const idParam = req.params.id;
      const usuarioId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);

      if (isNaN(usuarioId)) {
        return res.status(400).json({ error: 'ID de usuário inválido' });
      }

      const perfil = await usuarioService.obterPerfilPublico(usuarioId);
      return res.status(200).json(perfil);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao obter perfil público';
      return res.status(400).json({ error: msg });
    }
  }

  async atualizarPerfil(req: RequisicaoAutenticada, res: Response): Promise<Response> {
    try {
      const usuarioId = req.usuarioId;
      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { nome, senhaAtual, novaSenha } = req.body;

      const resultado = await usuarioService.atualizarPerfil(usuarioId, nome, senhaAtual, novaSenha);
      return res.status(200).json({
        mensagem: 'Perfil atualizado com sucesso!',
        usuario: resultado
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao atualizar perfil.';
      return res.status(400).json({ error: msg });
    }
  }

  async denunciarUsuario(req: RequisicaoAutenticada, res: Response): Promise<Response> {
    try {
      const autorId = req.usuarioId;
      if (!autorId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const idParam = req.params.id;
      const denunciadoId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
      const { motivo } = req.body;

      if (isNaN(denunciadoId)) {
        return res.status(400).json({ error: 'ID de usuário inválido.' });
      }

      const resultado = await usuarioService.denunciarUsuario(autorId, denunciadoId, motivo);

      return res.status(201).json({
        mensagem: 'Denúncia de perfil registrada com sucesso!',
        denuncia: resultado
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao denunciar usuário.';
      return res.status(400).json({ error: msg });
    }
  }
}