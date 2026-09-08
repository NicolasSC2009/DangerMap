import rateLimit from 'express-rate-limit';

export const criarOcorrenciaLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: {
    erro: 'Limite de criação de ocorrências atingido. Tente novamente em 10 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false
});