import { notFound } from 'next/navigation';
import { ThinkingGameApiPreview } from '@/components/thinking-games/ThinkingGameApiPreview';

export const dynamic = 'force-dynamic';

export default function ThinkingGamesApiPreviewPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 dark:bg-slate-950">
      <ThinkingGameApiPreview />
    </main>
  );
}
