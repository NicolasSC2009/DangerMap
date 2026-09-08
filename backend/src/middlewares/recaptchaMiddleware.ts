import { Request, Response, NextFunction } from 'express';

export async function validarRecaptcha(req: Request, res: Response, next: NextFunction) {
  const { recaptchaToken } = req.body;

  if (!process.env.RECAPTCHA_SECRET_KEY && process.env.NODE_ENV !== 'production') {
    delete req.body.recaptchaToken;
    return next();
  }

  if (!recaptchaToken) {
    return res.status(400).json({ error: 'Validação reCAPTCHA é obrigatória.' });
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

    if (!data.success) {
      return res.status(400).json({ error: 'Falha no reCAPTCHA: atividade suspeita ou bot detectado.' });
    }

    delete req.body.recaptchaToken;
    next();
  } catch (error) {
    console.error('[ERRO RECAPTCHA]:', error);
    return res.status(500).json({ error: 'Erro interno ao validar o reCAPTCHA.' });
  }
}