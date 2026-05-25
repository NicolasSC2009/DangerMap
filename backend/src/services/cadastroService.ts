import { UsuarioRepository } from '../repositories/usuarioRepository.js';
import bcrypt from 'bcryptjs';

const usuarioRepository = new UsuarioRepository();

export class CadastroService {
  async executar(dados: any) {
    const usuarioExiste = await usuarioRepository.buscarPorEmail(dados.email);
    if (usuarioExiste) {
      throw new Error('Este e-mail já está cadastrado no sistema.');
    }

    const senhaCriptografada = await bcrypt.hash(dados.senha, 10);

    const novoUsuario = await usuarioRepository.criar({
      nome: dados.nome,
      email: dados.email,
      senha: senhaCriptografada,
    });

    const { senha, senha_reset_token, senha_reset_expira, google_id, ...usuarioSeguro } = novoUsuario;

    return usuarioSeguro;
  }
}