import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { PricingContent } from '@/components/public/PricingContent';
import { publicPageMetadata } from '@/lib/site';

export const metadata: Metadata = publicPageMetadata({
  title: 'Bảng giá KidHabit Hero',
  description: 'Ba gói rõ ràng cho một bé hoặc cả gia đình, kèm 7 ngày trải nghiệm trước khi quyết định.',
  path: '/pricing',
});

export default async function PricingPage() {
  const requestHeaders = await headers();
  const country = requestHeaders.get('cf-ipcountry')?.toUpperCase() ?? null;
  const isVietnam = country === null || country === 'VN';
  return <PricingContent isVietnam={isVietnam} />;
}
