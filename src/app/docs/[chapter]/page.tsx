import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GuideChapterView } from '@/components/guide/GuideChapterView';
import guideIndexData from '../../../../public/guide/index.json';
import { guideIndexSchema } from '@/lib/guide/guide-types';

type Props = { readonly params: Promise<{ readonly chapter: string }> };

const index = guideIndexSchema.parse(guideIndexData);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { chapter } = await params;
  const entry = index.find((candidate) => candidate.slug === chapter);
  return entry ? { title: `${entry.title} | Tài liệu sử dụng KidHabit`, description: entry.summary || undefined } : {};
}

export function generateStaticParams() {
  return index.map((entry) => ({ chapter: entry.slug }));
}

export default async function DocsChapterPage({ params }: Props) {
  const { chapter } = await params;
  const entry = index.find((candidate) => candidate.slug === chapter);
  if (!entry) notFound();
  return <GuideChapterView index={index} entry={entry} />;
}
