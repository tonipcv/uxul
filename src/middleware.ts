import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
// Comentar a importação do prisma que não funciona no Edge Runtime
// import { prisma } from './lib/prisma'

// Regex para detectar URLs no formato /{slug}/{indicador}
const INDICATION_REGEX = /^\/([^\/]+)\/([^\/]+)$/;

// Lista de rotas que requerem plano premium
const PREMIUM_ROUTES = [
  '/reports',
  '/analytics',
  '/dashboard', // Adicionado novamente para bloquear acesso ao dashboard para usuários free
  '/dashboard/analytics',
  '/advanced-settings',
  '/dashboard/indications',
  '/dashboard/leads',
  '/dashboard/pipeline'
];

// Lista de rotas que devem ser acessíveis por todos os usuários autenticados
const AUTH_ROUTES = [
  '/profile'
  // Dashboard removido para que seja verificado apenas como rota premium
];

// Verificar se o usuário está autenticado
async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const session = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  return !!session;
}

// Modificar a função para incluir o parâmetro req
async function getUserPlan(userId: string, req?: NextRequest): Promise<string> {
  try {
    // Para teste, verificamos se é o email específico que deve ser premium
    if (userId === 'cm8zamrep0000lb0420xkta5z') { // ID do xppsalvador@gmail.com
      return 'premium';
    }
    
    // Para todos os outros, retornar free
    return 'free';
    
    /* Código original com Prisma que não funciona no Edge Runtime
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        plan: true,
        planExpiresAt: true
      }
    });

    if (!user) return 'free';

    // Verificar se o plano premium expirou
    if (user.plan === 'premium' && 
        user.planExpiresAt && 
        new Date(user.planExpiresAt) < new Date()) {
      // Atualizar usuário para plano gratuito (será feito pela API, não aqui para evitar atrasos)
      return 'free';
    }

    return user.plan || 'free';
    */
  } catch (error) {
    console.error('Erro ao verificar plano do usuário:', error);
    return 'free'; // Em caso de erro, assumir free para segurança
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = new URL(req.url);
  console.log('Middleware: Processando rota', pathname);
  
  // Verificar se é uma rota premium
  const isPremiumRoute = PREMIUM_ROUTES.some(route => pathname.startsWith(route));
  if (isPremiumRoute) {
    console.log('Middleware: Rota premium detectada', pathname);
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token?.sub) { // sub contém o ID do usuário
      console.log('Middleware: Usuário não autenticado, redirecionando para login');
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
    
    const userPlan = await getUserPlan(token.sub, req);
    console.log('Middleware: Plano do usuário:', userPlan);
    
    if (userPlan !== 'premium') {
      console.log('Middleware: Usuário não é premium, redirecionando para página de bloqueio');
      return NextResponse.redirect(new URL('/bloqueado', req.url));
    }
    
    console.log('Middleware: Usuário premium, permitindo acesso');
    return NextResponse.next();
  }
  
  // Verificar se é uma rota protegida que requer apenas autenticação
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route)) || 
                     pathname.startsWith('/profile');
  
  if (isAuthRoute) {
    console.log('Middleware: Rota autenticada detectada', pathname);
    const isLoggedIn = await isAuthenticated(req);
    if (!isLoggedIn) {
      console.log('Middleware: Usuário não autenticado, redirecionando para login');
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
    console.log('Middleware: Usuário autenticado, permitindo acesso');
    return NextResponse.next();
  }
  
  // Verificar se é uma rota de indicação para rastreamento
  const match = pathname.match(INDICATION_REGEX);
  if (match) {
    const userSlug = match[1];
    const indicationSlug = match[2];

    // Ignorar rotas conhecidas como api, _next, etc.
    const isSystemRoute = userSlug.startsWith('api') || 
                          userSlug.startsWith('_next') || 
                          userSlug.startsWith('static') || 
                          userSlug === 'favicon.ico';
    
    if (!isSystemRoute && userSlug && indicationSlug) {
      try {
        // Não aguardar a resposta para não atrasar o carregamento da página
        fetch(`${req.nextUrl.origin}/api/track`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': req.headers.get('x-forwarded-for') || 'unknown',
            'User-Agent': req.headers.get('user-agent') || 'unknown',
          },
          body: JSON.stringify({
            type: 'click',
            userSlug,
            indicationSlug,
          }),
        }).catch(err => {
          // Ignorar erros de rastreamento para não impactar a experiência do usuário
          console.error('Erro ao rastrear clique:', err);
        });
      } catch (error) {
        // Ignorar erros no middleware para garantir que a navegação continue
        console.error('Erro no middleware:', error);
      }
    }
  }

  // Sempre permitir que a navegação continue
  return NextResponse.next();
}

// Configurar quais caminhos o middleware deve processar
export const config = {
  matcher: [
    // Rotas protegidas que requerem autenticação
    '/dashboard/:path*',
    '/profile/:path*',
    // Rotas premium
    '/reports/:path*',
    '/analytics/:path*',
    '/dashboard/analytics',
    '/advanced-settings/:path*',
    // Qualquer rota para capturar padrões de indicação
    '/:slug/:indication',
  ],
}; 