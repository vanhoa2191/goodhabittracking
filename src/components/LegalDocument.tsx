'use client';

import { Fragment } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { getPublicShellCopy } from '@/lib/i18n/public-shell-copy';

type Block = string | readonly string[];

export type LegalSection = {
  readonly title: string;
  readonly blocks: readonly Block[];
};

function InlineText({ text, supportEmail }: { readonly text: string; readonly supportEmail: string }) {
  if (!supportEmail || !text.includes(supportEmail)) return <>{text}</>;
  const parts = text.split(supportEmail);
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {part}
          {index < parts.length - 1 && <a href={`mailto:${supportEmail}`}>{supportEmail}</a>}
        </Fragment>
      ))}
    </>
  );
}

export function LegalDocument({
  sections,
  updatedLabel,
  supportEmail,
}: {
  readonly sections: readonly LegalSection[];
  readonly updatedLabel: string;
  readonly supportEmail: string;
}) {
  const { language } = useTranslation();
  const copy = getPublicShellCopy(language);
  return (
    <>
      <p className="text-sm font-semibold">{copy.updated} {updatedLabel}</p>
      {sections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          {section.blocks.map((block, index) => (typeof block === 'string'
            ? <p key={index}><InlineText text={block} supportEmail={supportEmail} /></p>
            : (
              <ul key={index}>
                {block.map((item) => <li key={item}><InlineText text={item} supportEmail={supportEmail} /></li>)}
              </ul>
            )))}
        </section>
      ))}
    </>
  );
}
