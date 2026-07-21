import { Response, NextFunction } from 'express';
import { RequisicaoAutenticada } from './authMiddleware.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function autorizarAdmin(
  req: RequisicaoAutenticada,
  res: Response,
  next: NextFunction
) {
  try {
    const usuarioId = req.usuarioId;

    if (!usuarioId) {
      return res.status(401).json({ error: 'Acesso negado. Usuário não autenticado' });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId }
    });

    if (!usuario || usuario.tipo_usuario !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Requer privilégios de administrador' });
    }

    next();
  } catch (error: unknown) {
    return res.status(500).json({ error: 'Erro ao verificar permissões de administrador' });
  }
}