import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { validateToken } from "../../middleware";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  // Validar o token de autenticação
  const validation = await validateToken(req);
  
  if (!validation.isValid || !validation.user) {
    return NextResponse.json(
      { error: validation.error || "Usuário não autenticado" },
      { status: validation.status || 401 }
    );
  }

  try {
    // Buscar dados completos do perfil do médico
    const doctorProfile = await prisma.user.findUnique({
      where: { id: validation.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        specialty: true,
        slug: true,
        phone: true,
        image: true,
        createdAt: true,
      }
    });

    if (!doctorProfile) {
      return NextResponse.json(
        { error: "Perfil não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(doctorProfile);
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  // Validar o token de autenticação
  const validation = await validateToken(req);
  
  if (!validation.isValid || !validation.user) {
    return NextResponse.json(
      { error: validation.error || "Usuário não autenticado" },
      { status: validation.status || 401 }
    );
  }

  try {
    const { name, specialty, phone, image } = await req.json();

    // Atualizar o perfil do médico
    const updatedProfile = await prisma.user.update({
      where: { id: validation.user.id },
      data: {
        name: name || undefined,
        specialty: specialty || undefined,
        phone: phone || undefined,
        image: image || undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        specialty: true,
        slug: true,
        phone: true,
        image: true,
        createdAt: true,
      }
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}
