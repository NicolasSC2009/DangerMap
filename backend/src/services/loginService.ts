import { UsuarioRepository } from '../repositories/usuarioRepository.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const usuarioRepository = new UsuarioRepository();
const JWT_SECRET = process.env.JWT_SECRET || 'chave_secreta_e_super_segura_do_dangermap';

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
      { expiresIn: '24h' }
    );

    return {
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo_usuario: usuario.tipo_usuario,
      },
      token
    };
  }
}