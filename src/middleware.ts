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
  console.log('Middleware - Pathname:', pathname);
  
  // Verificar se o usuário está autenticado
  const token = await getToken({ req: request });
  console.log('Middleware - Token existe:', !!token);

  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  console.log('Middleware - É rota pública:', isPublicRoute);

  if (isPublicRoute) {
    // Se estiver autenticado e tentando acessar página de login/registro, redireciona para dashboard
    if (token && (pathname.startsWith('/auth/signin') || pathname.startsWith('/auth/register'))) {
      console.log('Middleware - Usuário autenticado tentando acessar rota pública, redirecionando para dashboard');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Redirecionar para o dashboard para raiz quando estiver autenticado
  if (pathname === '/' && token) {
    console.log('Middleware - Redirecionando raiz para dashboard');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Verificar se é uma rota que precisa de autenticação
  if (!token && !isPublicRoute && pathname !== '/') {
    console.log('Middleware - Usuário não autenticado tentando acessar rota protegida');
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
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

  console.log('Middleware - Permitindo acesso');
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