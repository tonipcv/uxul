import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// Regex para detectar URLs no formato /{userSlug}/{referralSlug}
const REFERRAL_REGEX = /^\/([^\/]+)\/([^\/]+)$/;

// Verificar se o paciente está autenticado
async function isPatientAuthenticated(req: NextRequest): Promise<{ isAuthenticated: boolean; patientId?: string }> {
  const cookie = req.cookies.get('patient_token');
  if (!cookie?.value) return { isAuthenticated: false };

  try {
    const token = cookie.value;
    const decoded = verify(token, process.env.JWT_SECRET || 'fallback-secret-for-development') as any;
    
    if (!decoded || decoded.type !== 'patient') {
      return { isAuthenticated: false };
    }

    // Retornar o ID do paciente do token JWT
    return { 
      isAuthenticated: true,
      patientId: decoded.id
    };
  } catch (error) {
    console.error('Erro ao verificar token do paciente:', error);
    return { isAuthenticated: false };
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = new URL(req.url);
  
  // Verificar se é uma rota do paciente
  if (pathname.startsWith('/patient/')) {
    // Permitir acesso às rotas públicas do paciente
    if (pathname === '/patient/login' || 
        pathname === '/patient/register' || 
        pathname === '/patient/access' ||
        pathname === '/patient/reset-password' ||
        pathname.startsWith('/patient/reset-password/') ||
        pathname === '/patient/validate') {
      return NextResponse.next();
    }

    // Verificar autenticação para rotas protegidas do paciente
    const authResult = await isPatientAuthenticated(req);
    
    // Se o paciente já estiver logado e tentar acessar uma rota pública, redirecionar para a página do paciente
    if ((pathname === '/patient/login' || pathname === '/patient/register') && authResult.isAuthenticated && authResult.patientId) {
      return NextResponse.redirect(new URL(`/patient/${authResult.patientId}`, req.url));
    }

    // Se estiver tentando acessar uma rota protegida e não estiver autenticado
    if (!authResult.isAuthenticated) {
      const response = NextResponse.redirect(new URL('/patient/login', req.url));
      response.cookies.delete('patient_token');
      return response;
    }

    // Se estiver tentando acessar a rota raiz de paciente (/patient), redirecionar para a página específica do paciente
    if (pathname === '/patient') {
      return NextResponse.redirect(new URL(`/patient/${authResult.patientId}`, req.url));
    }

    return NextResponse.next();
  }

  // Verificar se é uma rota de referência para rastreamento
  const match = pathname.match(REFERRAL_REGEX);
  if (match) {
    const userSlug = match[1];
    const referralSlug = match[2];

    // Ignorar rotas conhecidas como api, _next, etc.
    const isSystemRoute = userSlug.startsWith('api') || 
                          userSlug.startsWith('_next') || 
                          userSlug.startsWith('static') || 
                          userSlug === 'favicon.ico';
    
    if (!isSystemRoute && userSlug && referralSlug) {
      try {
        // Buscar o usuário e a referência
        const user = await prisma.user.findUnique({
          where: { slug: userSlug }
        });

        if (user) {
          const referral = await prisma.patientReferral.findFirst({
            where: {
              slug: referralSlug,
              patient: {
                userId: user.id
              }
            }
          });

          if (referral) {
            // Incrementar contador de visitas
            await prisma.patientReferral.update({
              where: { id: referral.id },
              data: { visits: { increment: 1 } }
            });

            // Registrar evento de visualização
            await prisma.event.create({
              data: {
                type: 'REFERRAL_VIEW',
                userId: user.id,
                ip: req.headers.get('x-forwarded-for') || 'unknown',
                userAgent: req.headers.get('user-agent') || 'unknown'
              }
            });
          }
        }
      } catch (error) {
        console.error('Erro no middleware:', error);
      }
    }
  }

  return NextResponse.next();
}

// Configurar quais caminhos o middleware deve processar
export const config = {
  matcher: [
    // Rotas do paciente
    '/patient/:path*',
    // Qualquer rota para capturar padrões de referência
    '/:userSlug/:referral',
  ],
}; 