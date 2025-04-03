import { NextRequest, NextResponse } from "next/server";
import * as jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function validateToken(req: NextRequest) {
  try {
    // Obter o token do cabeçalho de autorização
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        isValid: false,
        error: "Acesso não autorizado",
        status: 401,
      };
    }

    const token = authHeader.split(" ")[1];
    
    // Verificar o token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || "seu_jwt_secret"
    ) as { id: string; email: string };
    
    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        specialty: true,
        slug: true,
        image: true,
      },
    });
    
    if (!user) {
      return {
        isValid: false,
        error: "Usuário não encontrado",
        status: 401,
      };
    }
    
    return {
      isValid: true,
      user,
    };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return {
        isValid: false,
        error: "Token inválido ou expirado",
        status: 401,
      };
    }
    
    return {
      isValid: false,
      error: "Erro na autenticação",
      status: 500,
    };
  }
}
