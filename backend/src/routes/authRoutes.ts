import { Router, Response } from 'express';
import { CadastroController } from '../controllers/CadastroController.js';
import { LoginController } from '../controllers/LoginController.js';
import { RecuperacaoSenhaController } from '../controllers/RecuperacaoSenhaController.js';
import { autenticarToken, RequisicaoAutenticada } from '../middlewares/authMiddleware.js';
import { BlacklistRepository } from '../repositories/BlacklistRepository.js';
import jwt from 'jsonwebtoken';
import { UsuarioController } from '../controllers/UsuarioController.js';

const usuarioController = new UsuarioController();
const authRoutes = Router();
const cadastroController = new CadastroController();
const loginController = new LoginController();
const recuperacaoSenhaController = new RecuperacaoSenhaController();
const blacklistRepository = new BlacklistRepository();

authRoutes.delete('/usuarios/excluir', autenticarToken, usuarioController.excluirMinhaConta);
authRoutes.post('/cadastro', cadastroController.lidar);
authRoutes.post('/login', loginController.lidar);
authRoutes.post('/esqueci-senha', recuperacaoSenhaController.solicitar);
authRoutes.post('/resetar-senha', recuperacaoSenhaController.resetar);
authRoutes.patch('/admin/usuarios/reativar', autenticarToken, usuarioController.reativarContaPorAdmin);

authRoutes.post('/logout', autenticarToken, async function (req: RequisicaoAutenticada, res: Response) {
  try {
    const token = req.tokenOriginal;
    
    if (!token) {
      return res.status(400).json({ error: 'Token não encontrado na requisição.' });
    }

    const dadosDecodificados = jwt.decode(token) as { exp: number };
    
    const dataExpiracao = new Date(dadosDecodificados.exp * 1000);

    await blacklistRepository.revogarToken(token, dataExpiracao);

    return res.status(200).json({ mensagem: 'Logout realizado com sucesso. Token invalidado!' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao processar o logout.' });
  }
});

authRoutes.get('/perfil', autenticarToken, function (req: RequisicaoAutenticada, res: Response) {
  return res.json({
    mensagem: 'Você acessou uma rota protegida com sucesso!',
    seu_usuario_id_vindo_do_token: req.usuarioId,
    seu_tipo_usuario_vindo_do_token: req.usuarioTipo
  });
});

export default authRoutes;