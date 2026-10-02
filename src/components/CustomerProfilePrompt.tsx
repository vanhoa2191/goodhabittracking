'use client';

import { useEffect, useState } from 'react';
import { ModalShell } from '@/components/ui/ModalShell';
import { isValidPhone, needsCustomerProfileCompletion } from '@/lib/customer-profile';
import {
  CustomerProfileRequestError,
  loadCustomerProfile,
  saveCustomerProfile,
} from '@/lib/customer-profile-client';
import type { CustomerProfile } from '@/lib/customer-profile-client';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { getCustomerProfilePromptCopy } from '@/lib/i18n/customer-profile-prompt-copy';

type CustomerProfilePromptProps = {
  readonly userId: string | null;
  /** True while family setup is collecting the same details; the prompt must stay out of the way. */
  readonly suppressed?: boolean;
};

export function CustomerProfilePrompt({ userId, suppressed = false }: CustomerProfilePromptProps) {
  const { language } = useTranslation();
  const copy = getCustomerProfilePromptCopy(language);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const { logout } = useAppStore();

  useEffect(() => {
    if (!userId || suppressed) return;
    let active = true;
    queueMicrotask(() => {
      void loadCustomerProfile()
        .then((loadedProfile) => {
          if (!active) return;
          setProfile(loadedProfile);
          setName(loadedProfile.display_name);
          setPhone(loadedProfile.phone ?? '');
          setMarketingConsent(loadedProfile.marketing_consent);
        })
        .catch(() => undefined);
    });
    return () => {
      active = false;
    };
  }, [userId, suppressed]);

  const isOpen = Boolean(
    userId
    && !suppressed
    && profile
    && needsCustomerProfileCompletion({ displayName: profile.display_name, phone: profile.phone })
  );
  const phoneInvalid = phone.trim().length > 0 && !isValidPhone(phone);
  const canSave = name.trim().length >= 2 && isValidPhone(phone) && !isSaving;

  const save = async () => {
    if (!canSave) return;
    setIsSaving(true);
    setError('');
    try {
      const saved = await saveCustomerProfile({ displayName: name, phone, marketingConsent });
      setProfile(saved);
      setName(saved.display_name);
      setPhone(saved.phone ?? '');
      setMarketingConsent(saved.marketing_consent);
    } catch (caught: unknown) {
      if (!(caught instanceof CustomerProfileRequestError)) {
        setError(copy.errors.service_unavailable);
        return;
      }
      const supportCode = caught.correlationId ? copy.supportCode(caught.correlationId) : '';
      setError(`${copy.errors[caught.code]}${supportCode}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    // Required once a parent is signed in: Escape and the backdrop do nothing; signing out is the only way out.
    <ModalShell isOpen={isOpen} onClose={() => undefined} label={copy.modalLabel} maxWidth="md">
      <div className="space-y-5 overflow-y-auto p-5 sm:p-6" aria-busy={isSaving}>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">{copy.title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">{copy.description}</p>
        </div>
        <div className="grid gap-4">
          <label className="text-sm font-bold">{copy.fullName}
            <input autoFocus value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" aria-invalid={name.length > 0 && name.trim().length < 2} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 font-normal dark:border-zinc-700 dark:bg-zinc-800" />
          </label>
          <label className="text-sm font-bold">{copy.phone}
            <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" placeholder={copy.phonePlaceholder} aria-invalid={phoneInvalid || undefined} aria-describedby={phoneInvalid ? 'customer-profile-phone-error' : undefined} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 font-normal dark:border-zinc-700 dark:bg-zinc-800" />
            {phoneInvalid && <span id="customer-profile-phone-error" role="alert" className="mt-1 block text-xs font-bold text-rose-600">{copy.invalidPhone}</span>}
          </label>
          <label className="text-sm font-bold">{copy.email}
            <input value={profile?.email ?? ''} disabled className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 font-normal text-slate-500 dark:border-zinc-700 dark:bg-zinc-800" />
          </label>
        </div>
        <label className="flex items-start gap-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} className="mt-1.5 h-4 w-4" />
          <span>{copy.marketingConsent}</span>
        </label>
        {error && <p role="alert" className="text-sm font-bold text-rose-600">{error}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => void logout()} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold dark:border-zinc-700">{copy.signOut}</button>
          <button type="button" disabled={!canSave} onClick={() => void save()} className="min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? copy.saving : copy.save}</button>
        </div>
      </div>
    </ModalShell>
  );
}
