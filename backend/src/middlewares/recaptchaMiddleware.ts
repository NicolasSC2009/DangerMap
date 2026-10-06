import { Request, Response, NextFunction } from 'express';

// Nota mínima do reCAPTCHA v3 (0 = robô, 1 = humano). Ajustável por RECAPTCHA_SCORE_MINIMO.
function notaMinima(): number {
  const valor = Number(process.env.RECAPTCHA_SCORE_MINIMO);
  return Number.isFinite(valor) && valor >= 0 && valor <= 1 ? valor : 0.5;
}

// Confere o código do reCAPTCHA enviado em `recaptchaToken`. Funciona com v3 (nota + ação)
// e também com v2 (que não traz nota). `acao` é o nome da ação que o site usou ao gerar o código.
export function validarRecaptcha(acao?: string) {
  return async function (req: Request, res: Response, next: NextFunction) {
    const { recaptchaToken } = req.body;

    if (!process.env.RECAPTCHA_SECRET_KEY && process.env.NODE_ENV !== 'production') {
      delete req.body.recaptchaToken;
      return next();
    }

    if (!recaptchaToken) {
      return res.status(400).json({ error: 'Não foi possível confirmar que você não é um robô. Recarregue a página e tente de novo.' });
    }

    try {
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: process.env.RECAPTCHA_SECRET_KEY || '',
          response: recaptchaToken
        })
      });

      const data = await response.json();

      const acaoDivergente = Boolean(acao) && typeof data.action === 'string' && data.action !== acao;
      const notaBaixa = typeof data.score === 'number' && data.score < notaMinima();

      if (!data.success || acaoDivergente || notaBaixa) {
        return res.status(400).json({ error: 'Não conseguimos confirmar que você é uma pessoa. Tente novamente em instantes.' });
      }

      delete req.body.recaptchaToken;
      next();
    } catch (error) {
      console.error('[ERRO RECAPTCHA]:', error);
      return res.status(500).json({ error: 'Erro interno ao validar o reCAPTCHA.' });
    }
  };
}