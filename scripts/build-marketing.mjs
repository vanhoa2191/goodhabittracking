import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { renderHome, renderInfoPage, renderPricingPage } from '../apps/marketing/render-site.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const routes = ['framework', 'roadmaps', 'docs', 'privacy', 'terms', 'contact'];

function validateOrigin(value, name) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid HTTPS origin.`);
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error(`${name} must be a valid HTTPS origin without a path.`);
  }
  return url.origin;
}

const emailPattern = /^[^\s@"'<>]+@[^\s@"'<>]+\.[^\s@"'<>]+$/;

function validateSupportEmail(value) {
  const candidate = typeof value === 'string' ? value.trim() : '';
  if (!candidate) return null;
  if (!emailPattern.test(candidate)) throw new Error('supportEmail must be a valid email address.');
  return candidate;
}

async function writeRoute(outputDir, route, content) {
  const directory = route ? join(outputDir, route) : outputDir;
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'index.html'), content, 'utf8');
}

export async function buildMarketingSite({ appOrigin, marketingOrigin, outputDir, supportEmail = '' }) {
  const app = validateOrigin(appOrigin, 'appOrigin');
  const marketing = validateOrigin(marketingOrigin, 'marketingOrigin');
  const support = validateSupportEmail(supportEmail);
  const target = resolve(outputDir);

  if (target === projectRoot || target === dirname(projectRoot)) {
    throw new Error('outputDir must not replace the project directory.');
  }

  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  await writeRoute(target, '', renderHome({ appOrigin: app, marketingOrigin: marketing, supportEmail: support }));
  await writeRoute(target, 'pricing', renderPricingPage({ appOrigin: app, marketingOrigin: marketing }));
  await Promise.all(routes.map((slug) => writeRoute(target, slug, renderInfoPage({ slug, appOrigin: app, marketingOrigin: marketing, supportEmail: support }))));

  await Promise.all([
    cp(join(projectRoot, 'public', 'logo.svg'), join(target, 'logo.svg')),
    cp(join(projectRoot, 'apps', 'marketing', 'styles.css'), join(target, 'styles.css')),
    cp(join(projectRoot, 'apps', 'marketing', 'client.js'), join(target, 'client.js')),
    cp(join(projectRoot, 'apps', 'marketing', 'assets'), target, { recursive: true }),
  ]);

  const sitemapRoutes = ['', 'pricing', ...routes];
  await writeFile(join(target, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapRoutes.map((route) => `  <url><loc>${new URL(route ? `/${route}/` : '/', `${marketing}/`).href}</loc></url>`).join('\n')}\n</urlset>\n`, 'utf8');
  await writeFile(join(target, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${marketing}/sitemap.xml\n`, 'utf8');

  const homepage = await readFile(join(target, 'index.html'), 'utf8');
  if (homepage.includes('/api/') || /supabase/i.test(homepage) || homepage.includes('serviceWorker')) {
    throw new Error('Marketing artifact contains app-only capabilities.');
  }
  return { outputDir: target, pages: sitemapRoutes.length };
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invokedDirectly) {
  const result = await buildMarketingSite({
    appOrigin: process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.kidhabithero.com',
    marketingOrigin: process.env.NEXT_PUBLIC_MARKETING_URL ?? 'https://kidhabithero.com',
    outputDir: process.env.MARKETING_OUTPUT_DIR ?? join(projectRoot, 'dist', 'marketing'),
    supportEmail: process.env.SUPPORT_EMAIL,
  });
  process.stdout.write(`Built ${result.pages} marketing pages in ${result.outputDir}\n`);
}
