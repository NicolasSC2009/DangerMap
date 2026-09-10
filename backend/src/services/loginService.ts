import { UsuarioRepository } from '../repositories/UsuarioRepository.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, REFRESH_SECRET, ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } from '../config/auth.js';

const usuarioRepository = new UsuarioRepository();

export class LoginService {
  async executar(dados: any) {
    const usuario = await usuarioRepository.buscarPorEmail(dados.email);
    
    if (!usuario) {
      throw new Error('E-mail ou senha incorretos.');
    }

    if (usuario.ativo === false) {
      throw new Error('Esta conta foi desativada. Entre em contato com o suporte.');
    }

    const senhaCorreta = await bcrypt.compare(dados.senha, usuario.senha);
    if (!senhaCorreta) {
      throw new Error('E-mail ou senha incorretos.');
    }

    const token = jwt.sign(
      { id: usuario.id, tipo_usuario: usuario.tipo_usuario },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { id: usuario.id, tipo_usuario: usuario.tipo_usuario },
      REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );

    return {
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo_usuario: usuario.tipo_usuario,
      },
      token,
      refreshToken
    };
  }
}