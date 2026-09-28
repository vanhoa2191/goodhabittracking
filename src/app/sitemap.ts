import type { MetadataRoute } from 'next';
import { getSiteOrigin } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteOrigin();
  const now = new Date();
  return ['/', '/pricing', '/framework', '/roadmaps', '/docs'].map((path) => ({
    url: new URL(path, origin).toString(),
    lastModified: now,
    changeFrequency: path === '/' ? 'weekly' as const : 'monthly' as const,
    priority: path === '/' ? 1 : 0.8,
  }));
}
