'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { isValidPhone, needsCustomerProfileCompletion } from '@/lib/customer-profile';
import { CustomerProfileRequestError, saveCustomerProfile } from '@/lib/customer-profile-client';
import type { CustomerProfile } from '@/lib/customer-profile-client';
import { useTranslation } from '@/lib/i18n/context';
import { getCustomerProfilePromptCopy } from '@/lib/i18n/customer-profile-prompt-copy';

type CustomerProfileFormProps = {
  readonly profile: CustomerProfile;
  readonly onSaved: (profile: CustomerProfile) => void;
};

export function CustomerProfileForm({ profile, onSaved }: CustomerProfileFormProps) {
  const { language } = useTranslation();
  const copy = getCustomerProfilePromptCopy(language);
  const id = useId();
  const [name, setName] = useState(profile.display_name);
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const active = useRef(false);
  const saving = useRef(false);

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  const nameInvalid = name.length > 0 && name.trim().length < 2;
  const phoneInvalid = phone.length > 0 && !isValidPhone(phone);
  const canSave = name.trim().length >= 2 && isValidPhone(phone) && !isSaving;

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSave || saving.current) return;
    saving.current = true;
    setIsSaving(true);
    setError('');
    try {
      const saved = await saveCustomerProfile({ displayName: name, phone, marketingConsent });
      if (needsCustomerProfileCompletion({ displayName: saved.display_name, phone: saved.phone })) throw new CustomerProfileRequestError('invalid_response');
      if (active.current) onSaved(saved);
    } catch (caught: unknown) {
      if (!active.current) return;
      const message = caught instanceof CustomerProfileRequestError ? copy.errors[caught.code] : copy.errors.service_unavailable;
      const supportCode = caught instanceof CustomerProfileRequestError && caught.correlationId ? copy.supportCode(caught.correlationId) : '';
      setError(`${message}${supportCode}`);
    } finally {
      saving.current = false;
      if (active.current) setIsSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-5" aria-busy={isSaving}>
      <div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white">{copy.title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{copy.description}</p>
      </div>
      <fieldset disabled={isSaving} className="grid gap-4">
        <div>
          <label htmlFor={`${id}-name`} className="text-sm font-bold">{copy.fullName}</label>
          <input id={`${id}-name`} required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" aria-invalid={nameInvalid || undefined} aria-describedby={nameInvalid ? `${id}-name-error` : undefined} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 dark:border-zinc-700 dark:bg-zinc-800" />
          {nameInvalid && <p id={`${id}-name-error`} role="alert" className="mt-1 text-sm font-bold text-rose-700 dark:text-rose-300">{copy.invalidName}</p>}
        </div>
        <div>
          <label htmlFor={`${id}-phone`} className="text-sm font-bold">{copy.phone}</label>
          <input id={`${id}-phone`} required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" placeholder={copy.phonePlaceholder} aria-invalid={phoneInvalid || undefined} aria-describedby={phoneInvalid ? `${id}-phone-error` : undefined} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 dark:border-zinc-700 dark:bg-zinc-800" />
          {phoneInvalid && <p id={`${id}-phone-error`} role="alert" className="mt-1 text-sm font-bold text-rose-700 dark:text-rose-300">{copy.invalidPhone}</p>}
        </div>
        <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
          <input type="checkbox" checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-indigo-600" />
          <span>{copy.marketingConsent}</span>
        </label>
      </fieldset>
      {error && <p role="alert" className="text-sm font-bold text-rose-700 dark:text-rose-300">{error}</p>}
      <button type="submit" disabled={!canSave} className="min-h-11 w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? copy.saving : error ? copy.retry : copy.save}</button>
    </form>
  );
}
