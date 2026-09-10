import { Router } from 'express';
import { ClimaController } from '../controllers/ClimaController.js';

const router = Router();
const climaController = new ClimaController();

router.get('/clima', climaController.obterAtual);

export default router;
