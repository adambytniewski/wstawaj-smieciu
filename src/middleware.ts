import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const basicAuth = request.headers.get('authorization');
  const validPassword = process.env.BASIC_AUTH_PASSWORD;

  if (basicAuth && validPassword) {
    const authValue = basicAuth.split(' ')[1];
    const decoded = atob(authValue);
    const pwd = decoded.includes(':') ? decoded.split(':')[1] : decoded;

    if (pwd === validPassword) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Protected - haslo: AI2026"',
    },
  });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
