import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { blogRoutes, loadPosts, renderBlogIndex, renderBlogPost, renderFeed } from '../apps/marketing/blog.mjs';
import { renderHome, renderInfoPage, renderPricingPage } from '../apps/marketing/render-site.mjs';
import { renderHeadersFile } from '../apps/marketing/security-headers.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const routes = ['framework', 'science', 'roadmaps', 'docs', 'privacy', 'terms', 'contact'];

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

export async function buildMarketingSite({ appOrigin, marketingOrigin, outputDir, supportEmail = '', release = process.env.MARKETING_RELEASE ?? process.env.GITHUB_SHA ?? 'development', blogDirectory = join(projectRoot, 'apps', 'marketing', 'blog') }) {
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

  const posts = await loadPosts(blogDirectory);
  const blogOptions = { appOrigin: app, marketingOrigin: marketing };
  await writeRoute(target, 'blog', renderBlogIndex({ posts, ...blogOptions }));
  await Promise.all(posts.map((post) => writeRoute(target, `blog/${post.slug}`, renderBlogPost({ post, posts, ...blogOptions }))));
  const tags = [...new Set(posts.flatMap((post) => post.tags))];
  await Promise.all(tags.map((tag) => writeRoute(target, `blog/tag/${tag}`, renderBlogIndex({ posts: posts.filter((post) => post.tags.includes(tag)), allPosts: posts, tag, ...blogOptions }))));
  await writeFile(join(target, 'blog', 'feed.xml'), renderFeed({ posts, marketingOrigin: marketing }), 'utf8');

  await Promise.all([
    cp(join(projectRoot, 'public', 'logo.svg'), join(target, 'logo.svg')),
    cp(join(projectRoot, 'apps', 'marketing', 'styles.css'), join(target, 'styles.css')),
    cp(join(projectRoot, 'apps', 'marketing', 'client.js'), join(target, 'client.js')),
    cp(join(projectRoot, 'apps', 'marketing', 'assets'), target, { recursive: true }),
  ]);

  const sitemapEntries = [
    ...['', 'pricing', ...routes].map((route) => ({ route })),
    ...blogRoutes(posts),
  ];
  const sitemapUrl = ({ route, lastmod }) => `  <url><loc>${new URL(route ? `/${route}/` : '/', `${marketing}/`).href}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
  await writeFile(join(target, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries.map(sitemapUrl).join('\n')}\n</urlset>\n`, 'utf8');
  await writeFile(join(target, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${marketing}/sitemap.xml\n`, 'utf8');

  // The app deploy waits for this value to appear on the live site before it ships.
  await writeFile(join(target, 'release.json'), `${JSON.stringify({ release })}\n`, 'utf8');

  const pageFiles = (await readdir(target, { recursive: true })).filter((file) => file.endsWith('.html'));
  const documents = await Promise.all(pageFiles.map((file) => readFile(join(target, file), 'utf8')));
  await writeFile(join(target, '_headers'), renderHeadersFile(documents), 'utf8');

  const homepage = await readFile(join(target, 'index.html'), 'utf8');
  if (homepage.includes('/api/') || /supabase/i.test(homepage) || homepage.includes('serviceWorker')) {
    throw new Error('Marketing artifact contains app-only capabilities.');
  }
  return { outputDir: target, pages: sitemapEntries.length };
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
