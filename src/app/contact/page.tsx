import type { Metadata } from 'next';
import { ContactContent } from '@/components/public/ContactContent';
import { getPublicPolicyConfig } from '@/lib/public-policy';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const { approved } = getPublicPolicyConfig();
  return {
    title: 'Liên hệ hỗ trợ | KidHabit Hero',
    description: 'Cách gửi yêu cầu hỗ trợ tài khoản, thanh toán và quyền riêng tư cho KidHabit Hero.',
    robots: { index: approved, follow: approved },
  };
}

export default function ContactPage() {
  const { approved, supportEmail } = getPublicPolicyConfig();
  return <ContactContent approved={approved} supportEmail={supportEmail} />;
}
