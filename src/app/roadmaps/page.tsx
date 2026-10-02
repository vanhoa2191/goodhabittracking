import type { Metadata } from 'next';
import { RoadmapsContent } from '@/components/public/RoadmapsContent';
import { publicPageMetadata } from '@/lib/site';

export const metadata: Metadata = publicPageMetadata({
  title: 'Lộ trình thói quen KidHabit Hero',
  description: 'Khám phá lộ trình theo tuần và theo tháng để bắt đầu vừa sức, theo dõi đều đặn và điều chỉnh cùng con.',
  path: '/roadmaps',
});

export default function RoadmapsPage() {
  return <RoadmapsContent />;
}
