import bcrypt from 'bcryptjs';
import { UsuarioRepository } from '../repositories/UsuarioRepository.js';

const usuarioRepository = new UsuarioRepository();

export class UsuarioService {
  async obterMeuPerfil(usuarioId: number) {
    const usuario = await usuarioRepository.buscarPorId(usuarioId);
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    const { senha, senha_reset_token, senha_reset_expira, ...dadosSeguros } = usuario;
    return dadosSeguros;
  }

  async obterPerfilPublico(usuarioId: number) {
    const perfil = await usuarioRepository.buscarPerfilPublico(usuarioId);
    if (!perfil || !perfil.ativo) {
      throw new Error('Perfil não encontrado ou inativo');
    }

    return perfil;
  }

  async atualizarPerfil(usuarioId: number, nome?: string, senhaAtual?: string, novaSenha?: string) {
    const usuario = await usuarioRepository.buscarPorId(usuarioId);
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    const dadosAtualizacao: { nome?: string; senha?: string } = {};

    if (nome && nome.trim() !== '') {
      dadosAtualizacao.nome = nome;
    }

    if (novaSenha) {
      if (!senhaAtual) {
        throw new Error('É necessário informar a senha atual para alterar a senha');
      }

      const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);
      if (!senhaValida) {
        throw new Error('A senha atual está incorreta');
      }

      dadosAtualizacao.senha = await bcrypt.hash(novaSenha, 10);
    }

    return await usuarioRepository.atualizarPerfil(usuarioId, dadosAtualizacao);
  }

  async desativarMinhaConta(usuarioId: number) {
    const usuario = await usuarioRepository.buscarPorId(usuarioId);
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    return await usuarioRepository.desativarUsuario(usuarioId);
  }

  async reativarConta(usuarioId: number) {
    const usuario = await usuarioRepository.buscarPorId(usuarioId);
    if (!usuario) {
      throw new Error('Usuário não encontrado.');
    }

    return await usuarioRepository.reativarUsuario(usuarioId);
  }

  async denunciarUsuario(autorId: number, denunciadoId: number, motivo: string) {
    if (autorId === denunciadoId) {
      throw new Error('Você não pode denunciar o seu próprio perfil');
    }

    const denunciado = await usuarioRepository.buscarPorId(denunciadoId);
    if (!denunciado) {
      throw new Error('Usuário denunciado não encontrado');
    }

    if (!motivo || motivo.trim() === '') {
      throw new Error('O motivo da denúncia é obrigatório');
    }

    return await usuarioRepository.registrarDenunciaUsuario(autorId, denunciadoId, motivo);
  }
}