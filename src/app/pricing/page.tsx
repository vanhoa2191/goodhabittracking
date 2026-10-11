import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { PricingContent } from '@/components/public/PricingContent';
import { publicPageMetadata } from '@/lib/site';

export const metadata: Metadata = publicPageMetadata({
  title: 'Bảng giá KidHabit Hero',
  description: 'Chọn Gói Cơ bản, Pro hoặc Pro Plus với gợi ý AI không giới hạn. Thêm Add-on AI cho Gói Cơ bản hoặc Pro.',
  path: '/pricing',
});

export default async function PricingPage() {
  const requestHeaders = await headers();
  const country = requestHeaders.get('cf-ipcountry')?.toUpperCase() ?? null;
  const isVietnam = country === null || country === 'VN';
  return <PricingContent isVietnam={isVietnam} />;
}
