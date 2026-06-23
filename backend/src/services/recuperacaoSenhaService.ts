import { UsuarioRepository } from '../repositories/UsuarioRepository.js';
import { mailTransporter } from '../config/mail.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const usuarioRepository = new UsuarioRepository();

export class RecuperacaoSenhaService {
  async enviarToken(email: string) {
    const usuario = await usuarioRepository.buscarPorEmail(email);
    
    if (!usuario) {
      throw new Error('Se o email estiver cadastrado, um código de recuperação será enviado');
    }

    const token = crypto.randomInt(100000, 999999).toString();

    const expiracao = new Date(Date.now() + 15 * 60 * 1000);

    await usuarioRepository.salvarTokenReset(email, token, expiracao);

    await mailTransporter.sendMail({
      from: '"DangerMap Suporte" <suporte@dangermap.com>',
      to: email,
      subject: 'Recuperação de Senha - DangerMap',
      html: `
        <h1>Recuperação de Senha</h1>
        <p>Olá, ${usuario.nome}. Você solicitou a recuperação de senha para sua conta no DangerMap</p>
        <p>Seu código de verificação é: <strong>${token}</strong></p>
        <p>Este código expira em 15 minutos</p>
        <br>
        <p>Se não foi você quem solicitou, apenas ignore este e-mail.</p>
      `
    });

    return { mensagem: 'Código de recuperação enviado com sucesso!' };
  }

  async resetarSenha(token: string, novaSenha: any) {
    const usuario = await usuarioRepository.buscarPorTokenReset(token);
    
    if (!usuario) {
      throw new Error('Código de recuperação inválido ou expirado');
    }

    if (usuario.senha_reset_expira && new Date() > usuario.senha_reset_expira) {
      throw new Error('Código de recuperação inválido ou expirado.');
    }

    const novaSenhaCriptografada = await bcrypt.hash(novaSenha, 10);

    await usuarioRepository.atualizarSenha(usuario.id, novaSenhaCriptografada);

    return { mensagem: 'Senha alterada com sucesso!' };
  }
}