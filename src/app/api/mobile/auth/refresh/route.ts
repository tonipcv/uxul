import { NextRequest, NextResponse } from "next/server";
import * as jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/mobile/auth/refresh:
 *   post:
 *     summary: Renova um token JWT
 *     description: Esse endpoint verifica e renova um token JWT prestes a expirar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token renovado com sucesso
 *       401:
 *         description: Token inválido ou não renovável
 *       500:
 *         description: Erro interno do servidor
 */
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar o token sem validar a expiração
    let decoded;
    try {
      // Verificar se o token é válido, mesmo que expirado
      decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || "seu_jwt_secret",
        { ignoreExpiration: true }
      ) as { id: string; email: string; exp: number };
    } catch (error) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

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
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 401 }
      );
    }

    // Verificar se o token está expirado ou próximo de expirar (menos de 24h)
    const now = Math.floor(Date.now() / 1000);
    const expirationTime = decoded.exp;
    const oneDay = 24 * 60 * 60; // 24 horas em segundos
    
    // Se o token não estiver expirado ou próximo de expirar, retornar o mesmo token
    if (expirationTime > now + oneDay) {
      return NextResponse.json({
        message: "Token ainda é válido",
        token,
        user
      });
    }

    // Gerar novo token JWT
    const newToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET || "seu_jwt_secret",
      { expiresIn: "30d" }
    );

    return NextResponse.json({
      message: "Token renovado com sucesso",
      token: newToken,
      user
    });
  } catch (error) {
    console.error("Erro ao renovar token:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
} 