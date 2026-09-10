import { Router } from 'express';
import { AdminController } from '../controllers/AdminController.js';
import { autenticarToken } from '../middlewares/authMiddleware.js';
import { autorizarAdmin } from '../middlewares/autorizarAdmin.js';

const router = Router();
const adminController = new AdminController();

router.patch('/admin/usuarios/:usuarioId/desbanir', autenticarToken, autorizarAdmin, adminController.desbanirUsuario);
router.patch('/admin/ocorrencias/:ocorrenciaId/moderar', autenticarToken, autorizarAdmin, adminController.moderarOcorrencia);
router.patch('/admin/usuarios/:usuarioId/banir', autenticarToken, autorizarAdmin, adminController.banirUsuario);
router.get('/admin/relatorio-regiao', autenticarToken, autorizarAdmin, adminController.relatorioAreaGeografica);

router.get('/admin/dashboard/estatisticas', autenticarToken, autorizarAdmin, adminController.obterEstatisticas);
router.get('/admin/dashboard/relatorio.pdf', autenticarToken, autorizarAdmin, adminController.exportarRelatorioPdf);

router.get('/admin/ocorrencias/fila-moderacao', autenticarToken, autorizarAdmin, adminController.filaModeracaoOcorrencias);
router.get('/admin/usuarios/fila-denunciados', autenticarToken, autorizarAdmin, adminController.filaUsuariosDenunciados);

router.get('/admin/parametros', autenticarToken, autorizarAdmin, adminController.listarParametros);
router.patch('/admin/parametros/:chave', autenticarToken, autorizarAdmin, adminController.atualizarParametro);

export default router;