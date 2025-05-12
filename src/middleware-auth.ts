import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Lista de rotas que devem ser acessíveis por todos os usuários autenticados
const AUTH_ROUTES = [
  '/dashboard',
  '/profile',
  '/agenda',
  '/settings'
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
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  return !!token;
}

// Verificar plano do usuário
async function getUserPlan(token: any): Promise<string> {
  try {
    // Verificar se o token contém o e-mail
    const email = token?.email;
    
    console.log('Verificando plano para email:', email);
    console.log('Token completo:', JSON.stringify(token, null, 2));
    
    if (!email) {
      console.error('Token não contém email');
      return 'free';
    }
    
    // Verificar se o e-mail está na lista de e-mails premium
    if (PREMIUM_EMAILS.includes(email)) {
      console.log('Email encontrado na lista de premium');
      return 'premium';
    }
    
    // Verificar plano do token
    if (token?.plan === 'premium') {
      console.log('Token indica plano premium');
      return 'premium';
    }
    
    console.log('Usuário não é premium');
    return 'free';
  } catch (error) {
    console.error('Erro ao verificar plano do usuário:', error);
    return 'free';
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = new URL(req.url);
  console.log('\n--- Nova requisição ---');
  console.log('Pathname original:', pathname);
  
  // Remover o prefixo /(authenticated) se existir
  const cleanPath = pathname.replace(/^\/(authenticated)/, '');
  console.log('Pathname limpo:', cleanPath);
  
  // Verificar se é uma rota que requer autenticação
  const isAuthRoute = AUTH_ROUTES.some(route => cleanPath.startsWith(route));
  console.log('É rota autenticada?', isAuthRoute);
  
  if (isAuthRoute) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    console.log('Token encontrado?', !!token);
    
    if (!token) {
      console.log('Redirecionando para login - sem token');
      const url = new URL('/auth/signin', req.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    
    // Verificar se é uma rota premium
    const isPremiumRoute = PREMIUM_ROUTES.some(route => cleanPath.startsWith(route));
    console.log('É rota premium?', isPremiumRoute);
    
    if (isPremiumRoute) {
      const userPlan = await getUserPlan(token);
      console.log('Plano do usuário:', userPlan);
      
      if (userPlan !== 'premium') {
        console.log('Redirecionando para bloqueado - não é premium');
        return NextResponse.redirect(new URL('/bloqueado', req.url));
      }
    }
  }
  
  console.log('Permitindo acesso\n');
  return NextResponse.next();
}

// Configurar quais caminhos o middleware deve processar
export const config = {
  matcher: [
    '/(authenticated)/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/reports/:path*',
    '/analytics/:path*',
    '/advanced-settings/:path*'
  ]
}; 