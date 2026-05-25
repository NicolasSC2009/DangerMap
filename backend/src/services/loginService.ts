import { UsuarioRepository } from '../repositories/usuarioRepository.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const usuarioRepository = new UsuarioRepository();

const JWT_SECRET = process.env.JWT_SECRET || 'chave_secreta_e_super_segura_do_dangermap';

export class LoginService {
  async executar(dados: any) {
    const usuario = await usuarioRepository.buscarPorEmail(dados.email);
    if (!usuario) {
      throw new Error('E-mail ou senha inválidos.');
    }

    const senhaCorreta = await bcrypt.compare(dados.senha, usuario.senha);
    if (!senhaCorreta) {
      throw new Error('E-mail ou senha inválidos.');
    }

    const token = jwt.sign(
      { id: usuario.id, tipo_usuario: usuario.tipo_usuario },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const { senha, senha_reset_token, senha_reset_expira, google_id, ...usuarioSeguro } = usuario;

    return {
      usuario: usuarioSeguro,
      token
    };
  }
}