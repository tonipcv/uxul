import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';
import { getToken } from 'next-auth/jwt';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-jwt-secret';

// Rotas que não precisam de autenticação
const publicRoutes = [
  '/auth/signin',
  '/auth/register',
  '/auth/forgot-password',
  '/api/auth',
  '/api/patient/magic-link',
  '/api/patient/verify',
  '/patient/access/verify',
  '/bloqueado'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Verificar se o usuário está autenticado
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;

  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  if (isPublicRoute) {
    // Se estiver autenticado e tentando acessar página de login/registro, redireciona para dashboard
    if (isAuthenticated && (pathname.startsWith('/auth/signin') || pathname.startsWith('/auth/register'))) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Redirecionar para o dashboard para raiz quando estiver autenticado
  if (pathname === '/' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Verificar se é uma rota que precisa de autenticação
  if (!isAuthenticated && !isPublicRoute && pathname !== '/') {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
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