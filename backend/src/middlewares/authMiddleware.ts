import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'chave_secreta_e_super_segura_do_dangermap';

export interface RequisicaoAutenticada extends Request {
  usuarioId?: number;
  usuarioTipo?: string;
}

export function autenticarToken(req: RequisicaoAutenticada, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const dadosDecodificados = jwt.verify(token, JWT_SECRET) as { id: number; tipo_usuario: string };

    req.usuarioId = dadosDecodificados.id;
    req.usuarioTipo = dadosDecodificados.tipo_usuario;

    return next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido ou expirado.' });
  }
}