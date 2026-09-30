import { NextResponse } from 'next/server';
import { getAppOrigin } from '@/lib/site';

const readOnlyMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

function hostOrigin(request: Request): string | null {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!host) return null;
  const protocol = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
    ?? new URL(request.url).protocol.replace(':', '');
  return `${protocol}://${host}`;
}

export function isSameOriginRequest(request: Request): boolean {
  if (readOnlyMethods.has(request.method)) return true;

  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') return false;

  const origin = request.headers.get('origin');
  if (origin === null) return true;
  if (origin === 'null') return false;

  const allowed = new Set([new URL(request.url).origin, hostOrigin(request), getAppOrigin().origin].filter(Boolean));
  return allowed.has(origin);
}

// Cookie-authenticated writes must come from this application's own pages. Browsers always
// send Origin on a cross-site POST, and Sec-Fetch-Site says whether the caller is another
// site, so a form on any other origin cannot act with a parent's or a child's cookie.
// Server-to-server callers (payment and mail webhooks, the scheduler) send neither header.
export function rejectCrossSiteRequest(request: Request): NextResponse | null {
  if (isSameOriginRequest(request)) return null;
  return NextResponse.json({ error: 'Cross-site request refused.' }, { status: 403 });
}
