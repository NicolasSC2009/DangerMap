import nodemailer from 'nodemailer';

const contaTeste = await nodemailer.createTestAccount();

export const mailTransporter = nodemailer.createTransport({
  host: contaTeste.smtp.host,
  port: contaTeste.smtp.port,
  secure: contaTeste.smtp.secure,
  auth: {
    user: contaTeste.user,
    pass: contaTeste.pass
  }
});

mailTransporter.on('token', () => {});