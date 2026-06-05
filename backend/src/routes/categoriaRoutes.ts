import { Router } from 'express';
import { CategoriaController } from '../controllers/categoriaController.js';
import { autenticarToken } from '../middlewares/authMiddleware.js';

const categoriaRoutes = Router();
const categoriaController = new CategoriaController();

categoriaRoutes.post('/', autenticarToken, categoriaController.criar);
categoriaRoutes.get('/', autenticarToken, categoriaController.listar);

export default categoriaRoutes;