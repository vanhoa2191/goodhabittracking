import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const publicRoutes = ['/', '/pricing/', '/framework/', '/science/', '/roadmaps/', '/docs/', '/blog/', '/privacy/', '/terms/', '/contact/'];
const paidPlans = ['solo_monthly', 'monthly', 'yearly'];
const forbiddenMarkers = ['/api/', 'supabase_service_role_key', 'payos_api_key', 'serviceworker.register', 'manifest.webmanifest'];

function parseOrigin(value, label) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error(`${label} must be an HTTP(S) origin without credentials, path, query, or fragment.`);
  }
  return url.origin;
}

function routeFile(directory, route) {
  return route === '/' ? resolve(directory, 'index.html') : resolve(directory, route.slice(1), 'index.html');
}

function canonicalFor(origin, route) {
  return new URL(route, `${origin}/`).href;
}

function assertHtmlContract(html, route, appOrigin, marketingOrigin) {
  const canonical = canonicalFor(marketingOrigin, route);
  if (!html.includes(`<link rel="canonical" href="${canonical}">`)) {
    throw new Error(`${route} has the wrong or missing canonical URL.`);
  }

  const normalized = html.toLowerCase();
  for (const marker of forbiddenMarkers) {
    if (normalized.includes(marker)) throw new Error(`${route} exposes forbidden marker: ${marker}`);
  }

  for (const block of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let data;
    try {
      data = JSON.parse(block[1]);
    } catch {
      throw new Error(`${route} has malformed structured data.`);
    }
    for (const offer of data.offers ?? []) {
      const url = new URL(offer.url);
      if (url.pathname === '/checkout' && url.origin !== appOrigin) {
        throw new Error(`${route} structured data sends checkout outside the configured app origin.`);
      }
    }
  }

  const absoluteLinks = [...html.matchAll(/href="(https?:\/\/[^"#]+)"/g)].map((match) => match[1]);
  for (const link of absoluteLinks) {
    const url = new URL(link);
    if (url.pathname === '/checkout' && url.origin !== appOrigin) {
      throw new Error(`${route} sends checkout outside the configured app origin.`);
    }
  }
}

/**
 * @param {{
 *   directory: string;
 *   appOrigin: string;
 *   marketingOrigin: string;
 *   liveOrigin?: string;
 *   fetchImpl?: typeof fetch;
 * }} options
 */
export async function verifyMarketingRelease({
  directory,
  appOrigin: rawAppOrigin,
  marketingOrigin: rawMarketingOrigin,
  liveOrigin = undefined,
  fetchImpl = fetch,
}) {
  const appOrigin = parseOrigin(rawAppOrigin, 'appOrigin');
  const marketingOrigin = parseOrigin(rawMarketingOrigin, 'marketingOrigin');
  const htmlByRoute = new Map();

  for (const route of publicRoutes) {
    const html = await readFile(routeFile(directory, route), 'utf8').catch(() => {
      throw new Error(`${route} is missing from the marketing artifact.`);
    });
    assertHtmlContract(html, route, appOrigin, marketingOrigin);
    htmlByRoute.set(route, html);
  }

  const salesHtml = `${htmlByRoute.get('/')}\n${htmlByRoute.get('/pricing/')}`;
  for (const plan of paidPlans) {
    const expected = `${appOrigin}/checkout?plan=${plan}`;
    if (!salesHtml.includes(`href="${expected}"`)) {
      throw new Error(`Missing checkout CTA for ${plan}.`);
    }
  }

  if (liveOrigin) {
    const origin = parseOrigin(liveOrigin, 'liveOrigin');
    const liveHtmlByRoute = new Map();
    for (const route of publicRoutes) {
      const response = await fetchImpl(new URL(route, `${origin}/`));
      if (!response.ok) throw new Error(`${route} returned HTTP ${response.status}.`);
      const html = await response.text();
      assertHtmlContract(html, route, appOrigin, marketingOrigin);
      liveHtmlByRoute.set(route, html);
    }
    const liveSalesHtml = `${liveHtmlByRoute.get('/')}\n${liveHtmlByRoute.get('/pricing/')}`;
    for (const plan of paidPlans) {
      if (!liveSalesHtml.includes(`href="${appOrigin}/checkout?plan=${plan}"`)) {
        throw new Error(`Live marketing release is missing checkout CTA for ${plan}.`);
      }
    }
  }

  return { routes: publicRoutes.length, plans: paidPlans.length };
}

function readArgument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function main() {
  const directory = resolve(readArgument('--dir') ?? 'dist/marketing');
  const appOrigin = readArgument('--app-origin') ?? process.env.NEXT_PUBLIC_APP_URL;
  const marketingOrigin = readArgument('--marketing-origin') ?? process.env.NEXT_PUBLIC_MARKETING_URL;
  const liveOrigin = readArgument('--url');
  if (!appOrigin || !marketingOrigin) {
    throw new Error('Both --app-origin and --marketing-origin are required.');
  }
  const result = await verifyMarketingRelease({ directory, appOrigin, marketingOrigin, liveOrigin });
  process.stdout.write(`Marketing release verified: ${result.routes} routes and ${result.plans} checkout plans.\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : 'Marketing release verification failed.'}\n`);
    process.exitCode = 1;
  });
}
