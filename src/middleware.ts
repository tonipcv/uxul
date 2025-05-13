import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export const runtime = 'nodejs';

const PUBLIC_PATHS = [
  '/patient/login',
  '/patient/register',
  '/patient/reset-password',
  '/patient/setup-password',
  '/patient/access',
  '/auth/signin',
  '/auth/register',
  '/auth/reset-password',
  '/api/patient/register',
  '/api/patient/login',
  '/api/patient/reset-password',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check for authentication token
  const token = await getToken({ req: request });

  if (!token) {
    // Redirect to appropriate login page based on path
    const loginPath = pathname.startsWith('/patient/') ? '/patient/login' : '/auth/signin';
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  return NextResponse.next();
} 

export const config = {
  matcher: [
    '/patient/:path*',
    '/api/patient/:path*',
    '/dashboard/:path*',
    '/api/dashboard/:path*'
  ],
}; 