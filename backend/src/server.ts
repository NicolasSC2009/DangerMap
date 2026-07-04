import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/authRoutes.js';
import categoriaRoutes from './routes/categoriaRoutes.js';
import ocorrenciaRoutes from './routes/ocorrenciaRoutes.js';
import confirmacaoRoutes from './routes/confirmacaoRoutes.js';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api', ocorrenciaRoutes);
app.use('/api', confirmacaoRoutes);

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, function () {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});