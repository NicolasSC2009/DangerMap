import { Router } from 'express';
import { DenunciaController } from '../controllers/DenunciaController.js';
import { autenticarToken } from '../middlewares/authMiddleware.js';
import { autorizarAdmin } from '../middlewares/autorizarAdmin.js';

const router = Router();
const denunciaController = new DenunciaController();

router.post('/ocorrencias/:ocorrenciaId/denunciar', autenticarToken, denunciaController.criar);

router.get('/denuncias', autenticarToken, autorizarAdmin, denunciaController.listar);

export default router;