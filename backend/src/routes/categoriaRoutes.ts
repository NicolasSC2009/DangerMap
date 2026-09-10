import { Router } from 'express';
import { CategoriaController } from '../controllers/CategoriaController.js';
import { autenticarToken } from '../middlewares/authMiddleware.js';
import { autorizarAdmin } from '../middlewares/autorizarAdmin.js';

const categoriaRoutes = Router();
const categoriaController = new CategoriaController();

categoriaRoutes.post('/', autenticarToken, autorizarAdmin, categoriaController.criar);
categoriaRoutes.get('/', autenticarToken, categoriaController.listar);
categoriaRoutes.get('/admin', autenticarToken, autorizarAdmin, categoriaController.listarAdmin);
categoriaRoutes.patch('/:id', autenticarToken, autorizarAdmin, categoriaController.atualizar);
categoriaRoutes.patch('/:id/status', autenticarToken, autorizarAdmin, categoriaController.definirAtivo);

export default categoriaRoutes;