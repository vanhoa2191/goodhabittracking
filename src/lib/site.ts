import type { Metadata } from 'next';

export const productionOrigin = 'https://goodhabittracking.vanhoa2191.workers.dev';

export function getSiteOrigin(): URL {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configured) return new URL(productionOrigin);

  try {
    return new URL(configured);
  } catch {
    return new URL(productionOrigin);
  }
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
