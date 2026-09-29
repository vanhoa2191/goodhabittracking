import { sessionHintCookie, sessionHintMaxAgeSeconds } from '../../apps/marketing/session-hint.mjs';

// Shared hosting suffixes where a cookie Domain would be rejected or, worse, shared with strangers.
const blockedDomains = new Set([
  'workers.dev', 'pages.dev', 'vercel.app', 'netlify.app', 'github.io', 'herokuapp.com', 'web.app', 'firebaseapp.com',
]);

const domainPattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/u;

export function parseSessionHintDomain(value: string | undefined): string | null {
  const domain = value?.trim().toLowerCase().replace(/^\./u, '') ?? '';
  if (!domainPattern.test(domain) || blockedDomains.has(domain)) return null;
  return domain;
}

export function buildSessionHintCookie(signedIn: boolean, domain: string): string {
  const base = `${sessionHintCookie}=${signedIn ? '1' : ''}; Domain=${domain}; Path=/; SameSite=Lax; Secure`;
  return signedIn ? `${base}; Max-Age=${sessionHintMaxAgeSeconds}` : `${base}; Max-Age=0`;
}

export interface SessionHintTarget {
  cookie: string;
}

export function syncSessionHint(
  signedIn: boolean,
  {
    domain = parseSessionHintDomain(process.env.NEXT_PUBLIC_SESSION_HINT_DOMAIN),
    hostname = typeof location === 'undefined' ? '' : location.hostname,
    secure = typeof location !== 'undefined' && location.protocol === 'https:',
    target = typeof document === 'undefined' ? null : document,
  }: {
    readonly domain?: string | null;
    readonly hostname?: string;
    readonly secure?: boolean;
    readonly target?: SessionHintTarget | null;
  } = {},
): boolean {
  if (!domain || !target || !secure) return false;
  if (hostname !== domain && !hostname.endsWith(`.${domain}`)) return false;
  target.cookie = buildSessionHintCookie(signedIn, domain);
  return true;
}
