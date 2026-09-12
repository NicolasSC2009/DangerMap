import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';

// RN23 - limite por usuário E IP: a chave combina os dois para que um NAT
// compartilhado (ex: mesma rede/escritório) não puna um usuário pelo volume
// de outro, e para que trocar de IP não burle o limite por usuário.
export const criarOcorrenciaLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: {
    erro: 'Limite de criação de ocorrências atingido. Tente novamente em 10 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: function (req: Request) {
    const usuarioId = (req as any).usuarioId;
    const chaveIp = ipKeyGenerator(req.ip || '');
    return usuarioId ? `${chaveIp}:${usuarioId}` : chaveIp;
  }
});