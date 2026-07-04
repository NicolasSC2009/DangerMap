import { Router } from 'express';
import { ConfirmacaoController } from '../controllers/ConfirmacaoController.js';
import { autenticarToken } from '../middlewares/authMiddleware.js';

const router = Router();
const confirmacaoController = new ConfirmacaoController();

router.post('/ocorrencias/:ocorrenciaId/confirmar', autenticarToken, confirmacaoController.confirmar);
router.delete('/ocorrencias/:ocorrenciaId/confirmar', autenticarToken, confirmacaoController.retirar);

export default router;