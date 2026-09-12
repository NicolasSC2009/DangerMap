import { Router } from 'express';
import { InteracaoSocialController } from '../controllers/InteracaoSocialController.js';
import { autenticarToken } from '../middlewares/authMiddleware.js';

const router = Router();
const interacaoSocialController = new InteracaoSocialController();

router.post('/ocorrencias/:ocorrenciaId/curtir', autenticarToken, interacaoSocialController.curtir);
router.delete('/ocorrencias/:ocorrenciaId/curtir', autenticarToken, interacaoSocialController.retirarCurtida);
router.post('/ocorrencias/:ocorrenciaId/compartilhar', autenticarToken, interacaoSocialController.compartilhar);

export default router;
