/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// testMail.ts

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST as string,
  port: parseInt(process.env.SMTP_PORT as string, 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER as string,
    pass: process.env.SMTP_PASS as string,
  },
});

const mailOptions = {
  from: `"Test Mailtrap" <${process.env.SMTP_USER}>`,
  to: 'destinatario@ejemplo.com',
  subject: 'Correo de prueba',
  html: '<p>Este es un correo de prueba enviado desde Mailtrap.</p>',
};

transporter.sendMail(mailOptions, (error: Error | null, info: nodemailer.SentMessageInfo) => {
  if (error) {
    return console.error('Error al enviar correo:', error);
  }
  console.log('Correo enviado:', info.response);
});
