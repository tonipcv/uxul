import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Log the request
  console.log('Request:', {
    url: request.url,
    method: request.method,
    pathname: request.nextUrl.pathname,
  });

  // Continue with the request
  return NextResponse.next();
} 