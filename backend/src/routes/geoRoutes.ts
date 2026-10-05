import { Router } from 'express';
import { GeoController } from '../controllers/GeoController.js';
import { geoLimiter } from '../middlewares/rateLimiter.js';

const router = Router();
const geoController = new GeoController();

router.get('/geo/endereco', geoLimiter, geoController.endereco);
router.get('/geo/dentro-do-brasil', geoLimiter, geoController.dentroDoBrasil);

export default router;
