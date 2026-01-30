import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value; // Hum cookies ka istemal karenge secure auth ke liye
  const { pathname } = request.nextUrl;

  // Agar token nahi hai aur user dashboard par jana chahta hai
  if (!token && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Agar token hai aur user login page par hai, toh dashboard bhej do
  if (token && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/'],
};