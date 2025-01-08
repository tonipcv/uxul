import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequestWithAuth } from 'next-auth/middleware'

export default async function middleware(request: NextRequestWithAuth) {
  const token = await getToken({ req: request })
  const isAuthenticated = !!token

  // Lista de rotas protegidas
  const protectedRoutes = ['/checklist', '/oneweek', '/circles']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute) {
    if (!isAuthenticated) {
      const redirectUrl = new URL('/auth/signin', request.url)
      redirectUrl.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/checklist/:path*',
    '/oneweek/:path*',
    '/circles/:path*',
  ]
} 