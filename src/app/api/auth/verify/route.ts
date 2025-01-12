import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { message: "Email e código são obrigatórios" },
        { status: 400 }
      );
    }

    // Find verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: email,
          token: code
        }
      }
    });

    if (!verificationToken || verificationToken.expires < new Date()) {
      return NextResponse.json(
        { message: "Código inválido ou expirado" },
        { status: 400 }
      );
    }

    // Update user as verified
    await prisma.user.update({
      where: { email },
      data: {
        emailVerified: new Date()
      }
    });

    // Delete used token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token: code
        }
      }
    });

    return NextResponse.json(
      { message: "Email verificado com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { message: "Erro ao verificar email" },
      { status: 500 }
    );
  }
} 