import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import manifest from '@/app/manifest';

const publicPath = (...parts: string[]) => join(process.cwd(), 'public', ...parts);

describe('PWA safety boundaries', () => {
  it('publishes installable raster icons and a scoped standalone manifest', () => {
    const value = manifest();
    expect(value.id).toBe('/');
    expect(value.start_url).toBe('/');
    expect(value.scope).toBe('/');
    expect(value.display).toBe('standalone');
    expect(value.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ src: '/pwa/icon-192.png', sizes: '192x192' }),
      expect.objectContaining({ src: '/pwa/icon-512.png', sizes: '512x512' }),
    ]));
    expect(existsSync(publicPath('pwa', 'icon-192.png'))).toBe(true);
    expect(existsSync(publicPath('pwa', 'icon-512.png'))).toBe(true);
    expect(existsSync(publicPath('pwa', 'apple-touch-icon.png'))).toBe(true);
  });

  it('uses an allowlist cache and never stores authenticated or sensitive responses', () => {
    const worker = readFileSync(publicPath('sw.js'), 'utf8');
    expect(worker).toContain("const PUBLIC_CACHE_URLS = [");
    expect(worker).toContain("request.destination === 'style'");
    expect(worker).toContain("request.destination === 'script'");
    expect(worker).toContain("request.destination === 'font'");
    expect(worker).toContain("url.pathname.startsWith('/api/')");
    expect(worker).toContain("url.pathname.startsWith('/admin')");
    expect(worker).toContain("url.pathname.startsWith('/invite/')");
    expect(worker).toContain("request.mode === 'navigate'");
    expect(worker).toContain("url.pathname.startsWith('/_next/static/')");
    expect(worker).toContain('function isCacheablePublicRequest');
  });

  it('provides a public offline recovery page', () => {
    const offline = readFileSync(publicPath('offline.html'), 'utf8');
    expect(offline).toContain('Bạn đang ngoại tuyến');
    expect(offline).not.toMatch(/profile|payment|admin|child/i);
  });
});
