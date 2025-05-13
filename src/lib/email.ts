import { createTransport } from 'nodemailer';

if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD || !process.env.SMTP_FROM) {
  throw new Error('Missing SMTP configuration environment variables');
}

const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // Port 2525 is not secure by default
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false // Accept self-signed certificates
  }
});

// Verificar a conexão antes de exportar
transporter.verify((error, success) => {
  if (error) {
    console.error('Erro na configuração do SMTP:', error);
  } else {
    console.log('Servidor SMTP está pronto para enviar emails');
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

export async function sendWelcomeEmail(
  patientName: string,
  patientEmail: string,
  temporaryPassword: string,
  doctorName: string
) {
  const emailContent = `
    <h1>Bem-vindo(a) ao Portal do Paciente</h1>
    <p>Olá ${patientName},</p>
    <p>Seu médico ${doctorName} criou um acesso para você no portal do paciente.</p>
    <p>Para acessar, use as seguintes credenciais:</p>
    <ul>
      <li>Email: ${patientEmail}</li>
      <li>Senha temporária: ${temporaryPassword}</li>
    </ul>
    <p>Por favor, acesse o portal e altere sua senha no primeiro acesso.</p>
    <p>Link para acesso: ${process.env.NEXT_PUBLIC_APP_URL}/patient/login</p>
    <p>Atenciosamente,<br>Equipe do Portal</p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: patientEmail,
      subject: 'Bem-vindo ao Portal do Paciente',
      html: emailContent,
    });
    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return false;
  }
}

interface SendPasswordResetEmailProps {
  to: string;
  name: string;
  resetLink: string;
}

export async function sendPasswordResetEmail({ to, name, resetLink }: SendPasswordResetEmailProps) {
  try {
    await transporter.sendMail({
      from: {
        name: 'MED1',
        address: process.env.SMTP_FROM as string
      },
      to,
      subject: 'Recuperação de senha - MED1',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a365d;">Olá, ${name}!</h2>
          <p>Recebemos uma solicitação para redefinir sua senha no MED1.</p>
          <p>Clique no botão abaixo para criar uma nova senha:</p>
          <div style="margin: 20px 0;">
            <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Redefinir senha
            </a>
          </div>
          <p>Se você não solicitou esta alteração, ignore este email.</p>
          <p>Este link expira em 1 hora.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">Este é um email automático, por favor não responda.</p>
        </div>
      `
    });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Erro ao enviar email de recuperação de senha');
  }
} 