import type { Metadata } from 'next';
import { GuideHome } from '@/components/guide/GuideHome';
import guideIndexData from '../../../public/guide/index.json';
import { guideIndexSchema } from '@/lib/guide/guide-types';

export const metadata: Metadata = {
  title: 'Tài liệu sử dụng KidHabit',
  description: 'Hướng dẫn từng tính năng của KidHabit Hero cho ba mẹ.',
};

export default function DocsPage() {
  return <GuideHome index={guideIndexSchema.parse(guideIndexData)} />;
}
