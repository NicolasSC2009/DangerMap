import { Router, Response } from 'express';
import { CadastroController } from '../controllers/cadastroController.js';
import { LoginController } from '../controllers/loginController.js';
import { RecuperacaoSenhaController } from '../controllers/recuperacaoSenhaController.js'; // Novo
import { autenticarToken, RequisicaoAutenticada } from '../middlewares/authMiddleware.js';

const authRoutes = Router();
const cadastroController = new CadastroController();
const loginController = new LoginController();
const recuperacaoSenhaController = new RecuperacaoSenhaController();

authRoutes.post('/cadastro', cadastroController.lidar);
authRoutes.post('/login', loginController.lidar);
authRoutes.post('/esqueci-senha', recuperacaoSenhaController.solicitar);
authRoutes.post('/resetar-senha', recuperacaoSenhaController.resetar);
authRoutes.get('/perfil', autenticarToken, (req: RequisicaoAutenticada, res: Response) => {
  return res.json({
    mensagem: 'Você acessou uma rota protegida com sucesso!',
    seu_usuario_id_vindo_do_token: req.usuarioId,
    seu_tipo_usuario_vindo_do_token: req.usuarioTipo
  });
});

export default authRoutes;