import { NextResponse } from 'next/server';

// Forçar rota dinâmica
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Criar resposta para limpar o cookie
    const response = NextResponse.json({ success: true });
    
    // Remover o cookie de autenticação
    response.cookies.set({
      name: 'patient_token',
      value: '',
      expires: new Date(0), // Data no passado para expirar imediatamente
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer logout' },
      { status: 500 }
    );
  }
} 