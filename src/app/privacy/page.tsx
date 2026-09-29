import type { Metadata } from 'next';
import { buildLegalPages, legalUpdatedLabel } from '../../../apps/marketing/legal-content.mjs';
import { LegalDocument } from '@/components/LegalDocument';
import { PublicInfoPage } from '@/components/PublicInfoPage';
import { getPublicPolicyConfig } from '@/lib/public-policy';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const { approved } = getPublicPolicyConfig();
  return {
    title: 'Chính sách quyền riêng tư | KidHabit Hero',
    description: 'KidHabit Hero thu thập và sử dụng dữ liệu gia đình như thế nào, cùng các lựa chọn dành cho phụ huynh.',
    robots: { index: approved, follow: approved },
  };
}

export default function PrivacyPage() {
  const { approved, supportEmail } = getPublicPolicyConfig();
  const { privacy } = buildLegalPages({ supportEmail: supportEmail ?? '' });
  return (
    <PublicInfoPage title={privacy.title} description={privacy.description} approved={approved}>
      <LegalDocument sections={privacy.sections} updatedLabel={legalUpdatedLabel} supportEmail={supportEmail ?? ''} />
    </PublicInfoPage>
  );
}
