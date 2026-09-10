import nodemailer from 'nodemailer';

async function criarTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  const contaTeste = await nodemailer.createTestAccount();
  console.warn('[MAIL] SMTP_HOST não definido - usando conta de teste Ethereal (e-mails não são entregues de verdade).');

  return nodemailer.createTransport({
    host: contaTeste.smtp.host,
    port: contaTeste.smtp.port,
    secure: contaTeste.smtp.secure,
    auth: {
      user: contaTeste.user,
      pass: contaTeste.pass
    }
  });
}

export const mailTransporter = await criarTransporter();
export const MAIL_FROM = process.env.MAIL_FROM || '"DangerMap Suporte" <suporte@dangermap.com>';
