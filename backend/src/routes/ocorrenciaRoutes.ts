import { Router } from 'express';
import { OcorrenciaController } from '../controllers/OcorrenciaController.js';
import { autenticarToken } from '../middlewares/authMiddleware.js';
import { autorizarAdmin } from '../middlewares/autorizarAdmin.js';
import { criarOcorrenciaLimiter } from '../middlewares/rateLimiter.js';
import { validarRecaptcha } from '../middlewares/recaptchaMiddleware.js';

const router = Router();
const ocorrenciaController = new OcorrenciaController();

router.post('/ocorrencias', autenticarToken, criarOcorrenciaLimiter, validarRecaptcha, ocorrenciaController.cadastrar);
router.get('/ocorrencias', ocorrenciaController.listar);
router.delete('/ocorrencias/:id/foto', autenticarToken, autorizarAdmin, ocorrenciaController.removerFoto);

export default router;