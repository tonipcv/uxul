import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "../../middleware";

/**
 * @swagger
 * /api/mobile/auth/verify:
 *   get:
 *     summary: Verifica se o token JWT é válido
 *     description: Esse endpoint verifica a validade do token JWT enviado no cabeçalho Authorization
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido, retorna informações do usuário
 *       401:
 *         description: Token inválido ou expirado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(req: NextRequest) {
  try {
    // Validar o token usando o middleware existente
    const validation = await validateToken(req);
    
    if (!validation.isValid || !validation.user) {
      return NextResponse.json(
        { 
          valid: false,
          error: validation.error || "Token inválido ou expirado" 
        },
        { status: validation.status || 401 }
      );
    }

    // Token é válido, retornar informações do usuário
    return NextResponse.json({
      valid: true,
      user: validation.user,
      message: "Token válido"
    });
  } catch (error) {
    console.error("Erro ao verificar token:", error);
    return NextResponse.json(
      { 
        valid: false,
        error: "Erro ao processar a solicitação" 
      },
      { status: 500 }
    );
  }
} 