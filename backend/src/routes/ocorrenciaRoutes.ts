import { Router } from 'express';
import { OcorrenciaController } from '../controllers/OcorrenciaController.js';
import { autenticarToken } from '../middlewares/authMiddleware.js';

const router = Router();
const ocorrenciaController = new OcorrenciaController();

router.post('/ocorrencias', autenticarToken, ocorrenciaController.cadastrar);
router.get('/ocorrencias', ocorrenciaController.listar);

export default router;