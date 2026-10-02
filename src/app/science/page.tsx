import type { Metadata } from 'next';
import { ScienceContent } from '@/components/public/ScienceContent';
import { publicPageMetadata } from '@/lib/site';

export const metadata: Metadata = publicPageMetadata({
  title: 'Cơ sở khoa học của KidHabit Hero',
  description: 'Những điều nghiên cứu về thói quen cho biết, những điều chưa biết, và cách KidHabit Hero dùng chúng một cách thận trọng.',
  path: '/science',
});

export default function SciencePage() {
  return <ScienceContent />;
}
