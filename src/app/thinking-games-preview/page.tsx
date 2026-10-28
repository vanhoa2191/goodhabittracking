import { notFound } from 'next/navigation';
import { ThinkingGamePreview } from '@/components/thinking-games/ThinkingGamePreview';

export const dynamic = 'force-dynamic';

export default function ThinkingGamesPreviewPage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }

  return <ThinkingGamePreview />;
}
