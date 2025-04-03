import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import nodemailer from "nodemailer";

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

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    console.log('Looking up user:', email);
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('User not found:', email);
      // Return success even if user doesn't exist for security
      return NextResponse.json(
        { message: "If an account exists, you will receive a password reset email" },
        { status: 200 }
      );
    }

    console.log('Generating reset token');
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    console.log('Updating user with reset token');
    // Save reset token
    await prisma.user.update({
      where: { email },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
      },
    });

    // Get base URL from environment variables
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.NEXTAUTH_URL || 
                   'http://localhost:3000';
    
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;
    console.log('Reset URL generated:', resetUrl);

    console.log('Attempting to send email');
    try {
      // Verify SMTP connection
      await transporter.verify();
      console.log('SMTP connection verified');

      // Send email with reset link
      await transporter.sendMail({
        from: {
          name: 'MED1',
          address: process.env.SMTP_FROM as string
        },
        to: email,
        subject: 'Recuperação de Senha',
        html: `
          <h1>Recuperação de Senha</h1>
          <p>Você solicitou a recuperação de senha. Clique no link abaixo para definir uma nova senha:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">
            Redefinir Senha
          </a>
          <p>Se você não solicitou a recuperação de senha, ignore este email.</p>
          <p>Este link é válido por 1 hora.</p>
        `
      });
      console.log('Email sent successfully');
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      throw emailError;
    }

    return NextResponse.json(
      { message: "If an account exists, you will receive a password reset email" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset error details:", {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        message: "Something went wrong",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 