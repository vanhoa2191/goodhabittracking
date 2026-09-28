import type { Metadata } from 'next';

export const productionOrigin = 'https://goodhabittracking.vanhoa2191.workers.dev';

function resolveOrigin(configured: string | undefined, fallback: string): URL {
  try {
    const url = new URL(configured?.trim() || fallback);
    if (url.protocol === 'https:' || url.protocol === 'http:') return new URL(url.origin);
  } catch {
    return new URL(fallback);
  }
  return new URL(fallback);
}

export function getAppOrigin(): URL {
  return resolveOrigin(process.env.NEXT_PUBLIC_APP_URL, productionOrigin);
}

export function getMarketingOrigin(): URL {
  return resolveOrigin(process.env.NEXT_PUBLIC_MARKETING_URL, getAppOrigin().origin);
}

export function getDeployTarget(): 'combined' | 'marketing' | 'app' {
  const target = process.env.NEXT_PUBLIC_DEPLOY_TARGET?.trim();
  return target === 'marketing' || target === 'app' ? target : 'combined';
}

export function getSiteOrigin(): URL {
  return getAppOrigin();
}

export function publicPageMetadata({
  title,
  description,
  path,
}: {
  readonly title: string;
  readonly description: string;
  readonly path: `/${string}`;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      title,
      description,
      url: path,
      siteName: 'KidHabit Hero',
      locale: 'vi_VN',
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'KidHabit Hero' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/opengraph-image'],
    },
  };
}
