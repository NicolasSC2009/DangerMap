import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';

// RN23 - limite por usuário E IP: a chave combina os dois para que um NAT
// compartilhado (ex: mesma rede/escritório) não puna um usuário pelo volume
// de outro, e para que trocar de IP não burle o limite por usuário.
// Rotas /geo são públicas (o mapa abre sem login) e uma delas chama um serviço
// externo — limita por IP pra ninguém usar a API como proxy do Nominatim.
export const geoLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 90,
  message: { error: 'Muitas consultas de localização. Aguarde um instante.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Recuperação de senha: segura tentativa e erro no código de 6 dígitos.
export const recuperacaoSenhaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' },
  standardHeaders: true,
  legacyHeaders: false,
});

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