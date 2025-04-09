import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Lista de rotas que devem ser acessíveis por todos os usuários autenticados
const AUTH_ROUTES = [
  '/profile',
  '/dashboard',
  '/dashboard/indications',
  '/dashboard/leads',
  '/dashboard/pipeline'
];

// Lista de rotas que requerem plano premium
const PREMIUM_ROUTES = [
  '/reports',
  '/analytics',
  '/dashboard/analytics',
  '/advanced-settings'
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
  } catch (error) {
    console.error('Erro ao verificar plano do usuário:', error);
    return 'free';
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = new URL(req.url);
  
  // Verificar se é uma rota autenticada
  if (pathname.startsWith('/(authenticated)/')) {
    // Verificar autenticação
    const isLoggedIn = await isAuthenticated(req);
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    // Verificar se é uma rota premium
    const isPremiumRoute = PREMIUM_ROUTES.some(route => pathname.startsWith(`/(authenticated)${route}`));
    if (isPremiumRoute) {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      
      if (!token) {
        return NextResponse.redirect(new URL('/auth/signin', req.url));
      }
      
      const userPlan = await getUserPlan(token, req);
      
      if (userPlan !== 'premium') {
        return NextResponse.redirect(new URL('/bloqueado', req.url));
      }
    }
    
    return NextResponse.next();
  }

  // Verificar se é uma rota premium
  const isPremiumRoute = PREMIUM_ROUTES.some(route => pathname.startsWith(route));
  if (isPremiumRoute) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
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

  return NextResponse.next();
}

// Configurar quais caminhos o middleware deve processar
export const config = {
  matcher: [
    // Rotas autenticadas
    '/(authenticated)/:path*',
    // Rotas protegidas que requerem autenticação
    '/dashboard/:path*',
    '/profile/:path*',
    // Rotas premium
    '/reports/:path*',
    '/analytics/:path*',
    '/dashboard/analytics',
    '/advanced-settings/:path*',
  ],
}; 