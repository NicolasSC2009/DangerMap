import { Router } from 'express';
import { NotificacaoController } from '../controllers/NotificacaoController.js';
import { autenticarToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(autenticarToken);

router.get('/', NotificacaoController.listar);
router.patch('/ler-todas', NotificacaoController.lerTodas);
router.patch('/:id/ler', NotificacaoController.lerUma);
router.delete('/:id', NotificacaoController.deletar);

export default router;