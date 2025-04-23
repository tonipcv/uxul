import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Teste simples de conexão com o banco de dados
    const userCount = await prisma.user.count();
    
    return NextResponse.json({
      success: true,
      message: "API funcionando corretamente",
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro no teste de API:', error);
    return NextResponse.json(
      { 
        error: "Erro ao testar a API",
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 