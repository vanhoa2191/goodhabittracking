'use client';

import { useEffect, useState } from 'react';
import { CustomerProfileForm } from '@/components/CustomerProfileForm';
import { needsCustomerProfileCompletion } from '@/lib/customer-profile';
import { CustomerProfileRequestError, loadCustomerProfile } from '@/lib/customer-profile-client';
import type { CustomerProfile } from '@/lib/customer-profile-client';
import { useTranslation } from '@/lib/i18n/context';
import { getCustomerProfilePromptCopy } from '@/lib/i18n/customer-profile-prompt-copy';

export function CheckoutCustomerProfileStep({ onComplete }: { readonly onComplete: () => void }) {
  const { language } = useTranslation();
  const copy = getCustomerProfilePromptCopy(language);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [error, setError] = useState<CustomerProfileRequestError | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    void loadCustomerProfile().then((loaded) => {
      if (!active) return;
      if (needsCustomerProfileCompletion({ displayName: loaded.display_name, phone: loaded.phone })) setProfile(loaded);
      else onComplete();
    }).catch((caught: unknown) => {
      if (active) setError(caught instanceof CustomerProfileRequestError ? caught : new CustomerProfileRequestError('service_unavailable'));
    });
    return () => { active = false; };
  }, [attempt, onComplete]);

  if (error) {
    const message = error.code === 'network_error' || error.code === 'session_expired' ? copy.errors[error.code] : copy.loadFailed;
    return <div className="space-y-4">
      <p role="alert" className="text-sm font-bold text-rose-700 dark:text-rose-300">{message}{error.correlationId ? copy.supportCode(error.correlationId) : ''}</p>
      <button type="button" onClick={() => { setError(null); setAttempt((value) => value + 1); }} className="min-h-11 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">{copy.retry}</button>
    </div>;
  }
  if (!profile) return <p role="status" className="py-12 text-center text-sm font-bold text-slate-700 dark:text-slate-300">{copy.loading}</p>;
  return <CustomerProfileForm profile={profile} onSaved={onComplete} />;
}
