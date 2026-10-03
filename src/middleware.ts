import { NextResponse, type NextRequest } from 'next/server';

// Edge middleware (the Node.js proxy convention is not supported by the OpenNext Cloudflare adapter).
// A fresh nonce per request lets Next.js mark its own scripts while every other inline script
// is refused. Styles keep 'unsafe-inline' because server-rendered style attributes cannot carry a nonce.
export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const development = process.env.NODE_ENV === 'development';
  // The offline page is static, so it cannot carry a nonce; it may only load its own same-origin script.
  const staticOfflinePage = request.nextUrl.pathname === '/offline.html';
  const scriptSource = staticOfflinePage
    ? "script-src 'self'"
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ''}`;
  const policy = [
    "default-src 'self'",
    scriptSource,
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co https://api-merchant.payos.vn",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', policy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', policy);
  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!api/|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|webp|svg|ico)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
