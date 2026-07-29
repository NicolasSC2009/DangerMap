import { Router } from 'express';
import { UsuarioController } from '../controllers/UsuarioController.js';
import { autenticarToken } from '../middlewares/authMiddleware.js';

const router = Router();
const usuarioController = new UsuarioController();


router.get('/usuarios/me', autenticarToken, usuarioController.obterMeuPerfil);
router.put('/usuarios/me', autenticarToken, usuarioController.atualizarPerfil);
router.get('/usuarios/:id/perfil', autenticarToken, usuarioController.obterPerfilPublico);
router.post('/usuarios/:id/denunciar', autenticarToken, usuarioController.denunciarUsuario);

export default router;