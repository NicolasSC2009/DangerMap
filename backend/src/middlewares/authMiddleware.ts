import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { BlacklistRepository } from '../repositories/BlacklistRepository.js';

const JWT_SECRET = process.env.JWT_SECRET || 'chave_secreta_e_super_segura_do_dangermap';
const blacklistRepository = new BlacklistRepository();

export interface RequisicaoAutenticada extends Request {
  usuarioId?: number;
  usuarioTipo?: string;
  tokenOriginal?: string;
}

export async function autenticarToken(req: RequisicaoAutenticada, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const tokenNaBlacklist = await blacklistRepository.buscarTokenRevogado(token);
    if (tokenNaBlacklist) {
      return res.status(401).json({ error: 'Token revogado. Faça login novamente.' });
    }

    const dadosDecodificados = jwt.verify(token, JWT_SECRET) as { id: number; tipo_usuario: string; exp: number };

    req.usuarioId = dadosDecodificados.id;
    req.usuarioTipo = dadosDecodificados.tipo_usuario;
    req.tokenOriginal = token;

    return next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido ou expirado.' });
  }
}