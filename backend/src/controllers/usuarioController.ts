import { Response } from 'express';
import { RequisicaoAutenticada } from '../middlewares/authMiddleware.js';
import { UsuarioService } from '../services/UsuarioService.js';
import { NotificacaoService } from '../services/NotificacaoService.js';
import { LogAtividadeService } from '../services/LogAtividadeService.js';
import { ParametroService } from '../services/ParametroService.js';

const usuarioService = new UsuarioService();

export class UsuarioController {

  async excluirMinhaConta(req: RequisicaoAutenticada, res: Response): Promise<Response> {
    try {
      const usuarioId = req.usuarioId;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      await usuarioService.desativarMinhaConta(usuarioId);

      LogAtividadeService.registrar({ usuarioId, acao: 'EXCLUIR_CONTA', req });

      return res.status(200).json({ mensagem: 'Sua conta foi excluída e desativada com sucesso' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao tentar excluir a conta' });
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

      const perfil = await usuarioService.obterPerfilPublico(usuarioId, req.usuarioId);
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
  async atualizarPosicaoGPS(req: RequisicaoAutenticada, res: Response): Promise<Response> {
    try {
      const usuarioId = req.usuarioId;
      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { latitude, longitude } = req.body;
      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'Latitude e longitude são obrigatórias.' });
      }

      ParametroService.obterNumero('raio_validacao_presencial_metros').then(function (raio) {
        return NotificacaoService.verificarValidadorPresencial(
          usuarioId,
          Number(latitude),
          Number(longitude),
          raio
        );
      }).catch(function(err) {
        console.error('[ERRO GPS GEOFENCING]:', err);
      });

      return res.status(200).json({ mensagem: 'Posição GPS processada com sucesso' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao processar localização GPS.' });
    }
  }
}