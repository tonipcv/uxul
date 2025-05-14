import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-jwt-secret';

// Rotas que não precisam de autenticação
const publicRoutes = [
  '/auth/signin',
  '/auth/register',
  '/auth/forgot-password',
  '/api/auth',
  '/api/patient/magic-link',
  '/api/patient/verify',
  '/patient/access/verify'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar se é uma rota pública
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Verificar se é uma rota do portal do paciente
  if (pathname.startsWith('/portal')) {
    const patientSession = request.cookies.get('patient_session');

    if (!patientSession?.value) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    try {
      // Verificar o token de sessão
      const decoded = verify(patientSession.value, JWT_SECRET) as {
        patientId: string;
        email: string;
        type: string;
      };

      if (decoded.type !== 'session') {
        throw new Error('Token inválido');
      }

      return NextResponse.next();
    } catch (error) {
      // Se o token for inválido, redirecionar para login
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 