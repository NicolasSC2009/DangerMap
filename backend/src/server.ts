import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { PrismaClient } from '@prisma/client';
import { corsOptions } from './config/cors.js';
import { openApiSpec } from './docs/openapi.js';
import authRoutes from './routes/authRoutes.js';
import categoriaRoutes from './routes/categoriaRoutes.js';
import ocorrenciaRoutes from './routes/ocorrenciaRoutes.js';
import confirmacaoRoutes from './routes/confirmacaoRoutes.js';
import denunciaRoutes from './routes/denunciaRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import usuarioRoutes from './routes/usuarioRoutes.js';
import notificacaoRoutes from './routes/notificacaoRoutes.js';
import climaRoutes from './routes/climaRoutes.js';
import interacaoRoutes from './routes/interacaoRoutes.js';
import { iniciarJobLimpeza } from './utils/LimpezaOcorrencias.js';
import { DIRETORIO_UPLOADS } from './utils/arquivoUpload.js';

const app = express();
const prisma = new PrismaClient();

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(DIRETORIO_UPLOADS));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, { customSiteTitle: 'DangerMap API Docs' }));

app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/notificacoes', notificacaoRoutes);
app.use('/api', ocorrenciaRoutes);
app.use('/api', confirmacaoRoutes);
app.use('/api', denunciaRoutes);
app.use('/api', adminRoutes);
app.use('/api', usuarioRoutes);
app.use('/api', climaRoutes);
app.use('/api', interacaoRoutes);

app.get('/api/status', async function (req: Request, res: Response) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'online',
      mensagem: 'DangerMap API voando baixo com TypeScript!',
      banco_dados: 'Conectado com sucesso no Docker!'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({
      status: 'erro',
      mensagem: 'O servidor rodou, mas não conseguiu falar com o banco',
      erro: errorMessage
    });
  }
});

iniciarJobLimpeza();

const PORT = process.env.PORT || 3000;

app.listen(PORT, function () {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});