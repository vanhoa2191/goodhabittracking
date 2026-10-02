'use client';

import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';
import { parseGuideHref } from '@/lib/guide/guide-sections';
import type { GuideSection } from '@/lib/guide/guide-types';

/**
 * The HTML comes from the guide files the build made out of our own Markdown; every piece of text in it was escaped
 * there, so it is safe to place as it is. Links to other guide pages move inside the app instead of reloading it.
 */
export function GuideContent({ sections, onGuideLink }: { readonly sections: readonly GuideSection[]; readonly onGuideLink?: (slug: string, anchor: string | null) => boolean }) {
  const router = useRouter();

  const follow = (event: MouseEvent<HTMLElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as HTMLElement).closest('a');
    const href = link?.getAttribute('href');
    if (!link || !href) return;
    const target = parseGuideHref(href);
    if (!target) return;
    event.preventDefault();
    if (onGuideLink?.(target.slug, target.anchor)) return;
    router.push(href);
  };

  return (
    // The wrapper only listens for clicks that bubble up from real links inside the guide text.
    <div onClick={follow}>
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-24">
          <div className="guide-prose" dangerouslySetInnerHTML={{ __html: section.html }} />
        </section>
      ))}
    </div>
  );
}
