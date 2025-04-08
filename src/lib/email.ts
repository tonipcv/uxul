import nodemailer from 'nodemailer';

if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD || !process.env.SMTP_FROM) {
  throw new Error('Missing SMTP configuration environment variables');
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

interface SendPatientConfirmationEmailParams {
  to: string;
  patientName: string;
  doctorName: string;
  accessLink: string;
}

export async function sendPatientConfirmationEmail({
  to,
  patientName,
  doctorName,
  accessLink
}: SendPatientConfirmationEmailParams) {
  await transporter.verify();
  console.log('SMTP connection verified');

  await transporter.sendMail({
    from: {
      name: 'MED1',
      address: process.env.SMTP_FROM as string
    },
    to,
    subject: 'Acesso à sua área do paciente',
    html: `
      <h1>Olá ${patientName}!</h1>
      <p>Você solicitou acesso à sua área do paciente. Clique no link abaixo para acessar:</p>
      <a href="${accessLink}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">
        Acessar minha área
      </a>
      <p>Se você não solicitou este acesso, ignore este email.</p>
      <p>Este link é válido por 24 horas.</p>
    `
  });
  console.log('Email sent successfully');
} 