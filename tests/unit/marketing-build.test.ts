import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildMarketingSite } from '../../scripts/build-marketing.mjs';

const outputs: string[] = [];

afterEach(async () => {
  await Promise.all(outputs.splice(0).map((output) => rm(output, { recursive: true, force: true })));
});

async function buildFixture() {
  const outputDir = await makeOutput('kidhabit-marketing-');
  await buildMarketingSite({
    appOrigin: 'https://app.example',
    marketingOrigin: 'https://www.example',
    outputDir,
  });
  return {
    outputDir,
    html: await readFile(join(outputDir, 'index.html'), 'utf8'),
  };
}

async function makeOutput(prefix: string) {
  const outputDir = await mkdtemp(join(tmpdir(), prefix));
  outputs.push(outputDir);
  return outputDir;
}

describe('marketing static artifact', () => {
  it('renders outcome-led selling points without the removed internal-navigation phrase', async () => {
    const { html } = await buildFixture();
    expect(html).toContain('Biết nên rèn gì cho con');
    expect(html).toContain('Giao việc rõ, con dễ làm');
    expect(html).toContain('Thấy tiến bộ mỗi ngày');
    expect(html).not.toContain('Xem đúng phần bạn cần, không phải đọc một trang thật dài');
  });

  it('renders the three paid plans with exact checkout links and no removed sales card', async () => {
    const { html } = await buildFixture();
    expect(html).toContain('29.000');
    expect(html).toContain('49.000');
    expect(html).toContain('399.000');
    for (const plan of ['solo_monthly', 'monthly', 'yearly']) {
      expect(html).toContain(`https://app.example/checkout?plan=${plan}`);
    }
    expect(html).not.toMatch(/data-plan=["']trial["']/);
    expect(html).not.toMatch(/data-plan=["']lifetime["']/);
  });

  it('owns public discovery metadata and excludes app-only capabilities', async () => {
    const { outputDir, html } = await buildFixture();
    expect(html).toContain('<link rel="canonical" href="https://www.example/">');
    expect(html).toContain('<meta property="og:url" content="https://www.example/">');
    expect(await readFile(join(outputDir, 'robots.txt'), 'utf8')).toContain('Sitemap: https://www.example/sitemap.xml');
    expect(await readFile(join(outputDir, 'sitemap.xml'), 'utf8')).toContain('<loc>https://www.example/pricing/</loc>');
    expect(html).not.toContain('/api/');
    expect(html).not.toMatch(/supabase/i);
    expect(html).not.toContain('serviceWorker');
    expect(html).not.toContain('manifest.webmanifest');
  });

  it('builds every public information route as a self-contained static page', async () => {
    const { outputDir } = await buildFixture();
    for (const route of ['pricing', 'framework', 'roadmaps', 'docs', 'privacy', 'terms', 'contact']) {
      const html = await readFile(join(outputDir, route, 'index.html'), 'utf8');
      expect(html).toContain(`<link rel="canonical" href="https://www.example/${route}/">`);
      expect(html).toContain('<main');
      expect(html).not.toContain('/api/');
      expect(html).not.toMatch(/supabase/i);
    }
  });

  it('provides semantic landmarks, viewport metadata and keyboard-focusable calls to action', async () => {
    const { html } = await buildFixture();
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">');
    expect(html).toMatch(/<header[ >]/);
    expect(html).toMatch(/<nav[ >]/);
    expect(html).toMatch(/<main[ >]/);
    expect(html).toMatch(/<footer[ >]/);
    expect(html).toContain('class="button');
    expect(html).toContain('href="https://app.example/checkout?plan=monthly"');
    expect(html).toContain('href="https://app.example/" class="nav-login"');
    expect(html).not.toContain('https://app.example/login');
  });

  it('rejects non-HTTPS or non-origin deployment inputs', async () => {
    await expect(buildMarketingSite({
      appOrigin: 'http://app.example',
      marketingOrigin: 'https://www.example',
      outputDir: await makeOutput('kidhabit-marketing-invalid-'),
    })).rejects.toThrow('appOrigin');
    await expect(buildMarketingSite({
      appOrigin: 'https://app.example/path',
      marketingOrigin: 'https://www.example',
      outputDir: await makeOutput('kidhabit-marketing-invalid-'),
    })).rejects.toThrow('appOrigin');
  });
});
