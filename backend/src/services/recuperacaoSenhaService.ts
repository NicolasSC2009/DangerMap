import { UsuarioRepository } from '../repositories/UsuarioRepository.js';
import { mailTransporter, MAIL_FROM } from '../config/mail.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const usuarioRepository = new UsuarioRepository();

export class RecuperacaoSenhaService {
  async enviarToken(email: string) {
    const mensagemGenerica = { mensagem: 'Se o e-mail estiver cadastrado, um código de recuperação foi enviado.' };

    const usuario = await usuarioRepository.buscarPorEmail(email);

    // Retorna a mesma resposta (200, mesmo formato) exista ou não a conta -
    // sem isso, o status/formato diferente já revelaria quais e-mails estão
    // cadastrados (enumeração de usuários), mesmo com a mensagem "genérica".
    if (!usuario) {
      return mensagemGenerica;
    }

    const token = crypto.randomInt(100000, 1000000).toString();

    const expiracao = new Date(Date.now() + 15 * 60 * 1000);

    await usuarioRepository.salvarTokenReset(email, token, expiracao);

    await mailTransporter.sendMail({
      from: MAIL_FROM,
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

    return mensagemGenerica;
  }

  // Confere se o código enviado por e-mail pertence a ESSE e-mail e ainda vale.
  // Serve tanto pra etapa "confirmar código" quanto pra trava final da troca.
  private async validarCodigo(email: string, token: string) {
    const usuario = await usuarioRepository.buscarPorEmail(email);
    const esperado = usuario?.senha_reset_token;

    const iguais =
      !!esperado &&
      esperado.length === token.length &&
      crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(token));

    if (!usuario || !iguais) {
      throw new Error('Código de recuperação inválido ou expirado.');
    }

    if (usuario.senha_reset_expira && new Date() > usuario.senha_reset_expira) {
      throw new Error('Código de recuperação inválido ou expirado.');
    }

    return usuario;
  }

  async verificarCodigo(email: string, token: string) {
    await this.validarCodigo(email, token);
    return { mensagem: 'Código confirmado.' };
  }

  async resetarSenha(email: string, token: string, novaSenha: any) {
    const usuario = await this.validarCodigo(email, token);

    const novaSenhaCriptografada = await bcrypt.hash(novaSenha, 10);

    await usuarioRepository.atualizarSenha(usuario.id, novaSenhaCriptografada);

    return { mensagem: 'Senha alterada com sucesso!' };
  }
}