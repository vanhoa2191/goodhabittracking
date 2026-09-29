import type { Metadata } from 'next';
import { buildLegalPages, legalUpdatedLabel } from '../../../apps/marketing/legal-content.mjs';
import { LegalDocument } from '@/components/LegalDocument';
import { PublicInfoPage } from '@/components/PublicInfoPage';
import { getPublicPolicyConfig } from '@/lib/public-policy';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const { approved } = getPublicPolicyConfig();
  return {
    title: 'Điều khoản sử dụng | KidHabit Hero',
    description: 'Điều kiện sử dụng, dùng thử, thanh toán và hoàn tiền của KidHabit Hero.',
    robots: { index: approved, follow: approved },
  };
}

export default function TermsPage() {
  const { approved, supportEmail } = getPublicPolicyConfig();
  const { terms } = buildLegalPages({ supportEmail: supportEmail ?? '' });
  return (
    <PublicInfoPage title={terms.title} description={terms.description} approved={approved}>
      <LegalDocument sections={terms.sections} updatedLabel={legalUpdatedLabel} supportEmail={supportEmail ?? ''} />
    </PublicInfoPage>
  );
}
