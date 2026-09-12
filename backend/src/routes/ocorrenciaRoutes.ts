import { Router } from 'express';
import { OcorrenciaController } from '../controllers/OcorrenciaController.js';
import { autenticarToken } from '../middlewares/authMiddleware.js';
import { autorizarAdmin } from '../middlewares/autorizarAdmin.js';
import { criarOcorrenciaLimiter } from '../middlewares/rateLimiter.js';
import { validarRecaptcha } from '../middlewares/recaptchaMiddleware.js';
import { processarUploadFotoOcorrencia, processarUploadImagemAnalise } from '../middlewares/uploadMiddleware.js';

const router = Router();
const ocorrenciaController = new OcorrenciaController();

router.post('/ocorrencias', autenticarToken, criarOcorrenciaLimiter, validarRecaptcha, ocorrenciaController.cadastrar);
router.get('/ocorrencias', ocorrenciaController.listar);
router.get('/ocorrencias/clusters', ocorrenciaController.listarClusters);
router.post('/ocorrencias/sugerir-categoria', autenticarToken, ocorrenciaController.sugerirCategoria);
router.post('/ocorrencias/sugerir-categoria-imagem', autenticarToken, processarUploadImagemAnalise, ocorrenciaController.sugerirCategoriaPorImagem);
router.post('/ocorrencias/:id/foto', autenticarToken, processarUploadFotoOcorrencia, ocorrenciaController.uploadFoto);
router.delete('/ocorrencias/:id/foto', autenticarToken, autorizarAdmin, ocorrenciaController.removerFoto);
router.get('/ocorrencias/:id', ocorrenciaController.detalhar);

export default router;