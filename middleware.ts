import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production-please-use-env-variable';

// 認証不要のパス
const publicPaths = ['/login', '/api/auth/login'];

// 静的ファイルとNext.js内部パスを除外
const isPublicFile = (pathname: string) => {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('/favicon.ico') ||
    pathname.includes('.')
  );
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静的ファイルとNext.js内部パスはスキップ
  if (isPublicFile(pathname)) {
    return NextResponse.next();
  }

  // 認証不要のパスはスキップ
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // トークンを取得
  const token = request.cookies.get('auth-token')?.value;

  // デバッグログ
  console.log('[Middleware] Path:', pathname, 'Has token:', !!token);

  if (!token) {
    // トークンがない場合、ログインページにリダイレクト
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    console.log('[Middleware] Redirecting to login:', loginUrl.toString());
    return NextResponse.redirect(loginUrl);
  }

  try {
    // トークンを検証
    const secret = new TextEncoder().encode(JWT_SECRET);
    await jwtVerify(token, secret);

    // 検証成功、リクエストを続行
    return NextResponse.next();
  } catch (error) {
    // トークンが無効な場合、ログインページにリダイレクト
    console.error('JWT verification failed:', error);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);

    // 無効なトークンを削除
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('auth-token');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
