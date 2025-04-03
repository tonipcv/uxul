import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { slugify } from "@/lib/utils";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, specialty, phone } = await req.json();

    // Validar campos obrigatórios
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nome, e-mail e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o email já está em uso
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este e-mail já está em uso" },
        { status: 409 }
      );
    }

    // Gerar slug único baseado no nome
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let counter = 1;
    
    // Verificar se o slug já existe e incrementar se necessário
    while (true) {
      const existingSlug = await prisma.user.findUnique({
        where: { slug },
      });
      
      if (!existingSlug) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar o novo usuário
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        specialty: specialty || null,
        phone: phone || null,
        slug,
      },
      select: {
        id: true,
        name: true,
        email: true,
        specialty: true,
        slug: true,
        image: true,
      },
    });

    // Gerar token JWT
    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
      },
      process.env.JWT_SECRET || "seu_jwt_secret",
      { expiresIn: "30d" }
    );

    return NextResponse.json({
      user: newUser,
      token,
    }, { status: 201 });
  } catch (error) {
    console.error("Erro no registro:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}
