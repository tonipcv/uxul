import { NextRequest, NextResponse } from 'next/server'

// Verificamos apenas se é uma tentativa de acesso à rota de paciente 
// e redirecionamos para a página inicial
export async function middleware(req: NextRequest) {
  const { pathname } = new URL(req.url);
  
  // Se estiver tentando acessar rotas do paciente, redirecionar para a página inicial
  if (pathname.startsWith('/patient/')) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

// Configurar quais caminhos o middleware deve processar
export const config = {
  matcher: [
    // Rotas do paciente
    '/patient/:path*'
  ],
}; 