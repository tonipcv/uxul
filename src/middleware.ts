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

// Lista de e-mails com acesso premium
const PREMIUM_EMAILS = [
  'xppsalvador@gmail.com',
  'tonitypebot@gmail.com'
];

// Verificar se o usuário está autenticado
async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const session = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  return !!session;
}

// Modificar a função para verificar por e-mail em vez de ID
async function getUserPlan(token: any, req?: NextRequest): Promise<string> {
  try {
    // Verificar se o token contém o e-mail
    const email = token?.email;
    
    if (!email) {
      // Fallback para verificação por ID se e-mail não estiver disponível
      const premiumUserIds = [
        'cm8zamrep0000lb0420xkta5z',
        'cm94hhzds0000jo044c9hupfo'
      ];
      
      if (premiumUserIds.includes(token?.sub)) {
        return 'premium';
      }
      
      return 'free';
    }
    
    // Verificar se o e-mail está na lista de e-mails premium
    if (PREMIUM_EMAILS.includes(email)) {
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
  
  // Verificar se é uma rota premium
  const isPremiumRoute = PREMIUM_ROUTES.some(route => pathname.startsWith(route));
  if (isPremiumRoute) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) { // Verificar se o token existe
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
    
    const userPlan = await getUserPlan(token, req);
    
    if (userPlan !== 'premium') {
      return NextResponse.redirect(new URL('/bloqueado', req.url));
    }
    
    return NextResponse.next();
  }
  
  // Verificar se é uma rota protegida que requer apenas autenticação
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route)) || 
                     pathname.startsWith('/profile');
  
  if (isAuthRoute) {
    const isLoggedIn = await isAuthenticated(req);
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
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