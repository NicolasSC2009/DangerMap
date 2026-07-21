import { Router } from 'express';
import { AdminController } from '../controllers/AdminController.js';
import { autenticarToken } from '../middlewares/authMiddleware.js';
import { autorizarAdmin } from '../middlewares/autorizarAdmin.js';

const router = Router();
const adminController = new AdminController();

router.patch('/admin/ocorrencias/:ocorrenciaId/moderar', autenticarToken, autorizarAdmin, adminController.moderarOcorrencia);
router.patch('/admin/usuarios/:usuarioId/banir', autenticarToken, autorizarAdmin, adminController.banirUsuario);

export default router;