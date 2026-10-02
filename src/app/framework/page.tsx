import type { Metadata } from 'next';
import { FrameworkContent } from '@/components/public/FrameworkContent';
import { publicPageMetadata } from '@/lib/site';

export const metadata: Metadata = publicPageMetadata({
  title: 'Khung thói quen KidHabit Hero',
  description: 'Khung nội dung giúp phụ huynh chọn hành động nhỏ, phù hợp độ tuổi và dễ thực hành cùng con mỗi ngày.',
  path: '/framework',
});

export default function FrameworkPage() {
  return <FrameworkContent />;
}
