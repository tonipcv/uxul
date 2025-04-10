import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD || !process.env.SMTP_FROM) {
  throw new Error('Missing SMTP configuration environment variables');
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

export async function POST(req: Request) {
  try {
    const { name, email, password, slug, specialty } = await req.json();

    // Basic validation
    if (!name || !email || !password || !slug) {
      return NextResponse.json(
        { message: "Nome, email, senha e slug são obrigatórios" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Este email já está em uso" },
        { status: 400 }
      );
    }

    // Check if slug is already taken
    const existingSlug = await prisma.user.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      return NextResponse.json(
        { message: "Este username já está em uso. Por favor, escolha outro." },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerified: new Date(), // Automatically verify the email
        slug,
        specialty
      },
    });

    console.log('Sending welcome email to:', email);
    // Send welcome email
    try {
      await transporter.verify();
      console.log('SMTP connection verified');

      await transporter.sendMail({
        from: {
          name: 'MED1',
          address: 'ai@booplabs.com'
        },
        to: email,
        subject: 'Bem-vindo ao MED1',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a365d; margin-bottom: 24px;">Bem-vindo ao MED1!</h1>
            <p style="color: #4a5568; font-size: 16px; line-height: 1.5;">Olá ${name},</p>
            <p style="color: #4a5568; font-size: 16px; line-height: 1.5;">Seu cadastro foi realizado com sucesso! Agora você já pode acessar sua conta e começar a usar todas as funcionalidades do MED1.</p>
            <div style="margin: 32px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/signin" 
                 style="background-color: #3b82f6; 
                        color: white; 
                        text-decoration: none; 
                        padding: 12px 24px; 
                        border-radius: 6px;
                        font-weight: 500;
                        display: inline-block;">
                Acessar minha conta
              </a>
            </div>
            <p style="color: #4a5568; font-size: 16px; line-height: 1.5;">Se tiver alguma dúvida, estamos à disposição para ajudar.</p>
            <p style="color: #4a5568; font-size: 16px; line-height: 1.5;">Atenciosamente,<br>Equipe MED1</p>
          </div>
        `
      });
      console.log('Welcome email sent successfully');
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // If email fails, delete the user
      await prisma.user.delete({
        where: { id: user.id }
      });
      throw emailError;
    }

    return NextResponse.json(
      {
        message: "Usuário criado com sucesso. Você já pode fazer login.",
        userId: user.id
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Erro ao criar usuário" },
      { status: 500 }
    );
  }
} 