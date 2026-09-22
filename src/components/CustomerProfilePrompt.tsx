'use client';

import { useEffect, useState } from 'react';
import { ModalShell } from '@/components/ui/ModalShell';
import { needsCustomerProfileCompletion } from '@/lib/customer-profile';

type CustomerProfilePromptProps = {
  readonly userId: string | null;
};

type CustomerProfile = {
  readonly display_name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly marketing_consent: boolean;
};

export function CustomerProfilePrompt({ userId }: CustomerProfilePromptProps) {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeferred, setIsDeferred] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    let active = true;
    queueMicrotask(() => {
      void fetch('/api/account/profile').then(async (response) => {
        if (!active || !response.ok) return;
        const body = await response.json() as { readonly profile: CustomerProfile };
        if (!active) return;
        setProfile(body.profile);
        setName(body.profile.display_name);
        setPhone(body.profile.phone ?? '');
        setMarketingConsent(body.profile.marketing_consent);
        setIsDeferred(false);
      });
    });
    return () => {
      active = false;
    };
  }, [userId]);

  const isOpen = Boolean(
    userId
    && profile
    && needsCustomerProfileCompletion({ displayName: profile.display_name, phone: profile.phone })
    && !isDeferred
  );
  const canSave = name.trim().length >= 2 && phone.trim().length >= 8 && !isSaving;

  const save = async () => {
    if (!canSave) return;
    setIsSaving(true);
    setError('');
    const response = await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ displayName: name, phone, marketingConsent }),
    });
    setIsSaving(false);
    if (!response.ok) {
      setError('Chưa lưu được thông tin. Vui lòng thử lại.');
      return;
    }
    const body: unknown = await response.json().catch(() => null);
    if (
      !body
      || typeof body !== 'object'
      || !('profile' in body)
      || !body.profile
      || typeof body.profile !== 'object'
    ) {
      setError('Máy chủ chưa xác nhận thông tin đã lưu. Vui lòng thử lại.');
      return;
    }
    const saved = body.profile as CustomerProfile;
    setProfile(saved);
    setName(saved.display_name);
    setPhone(saved.phone ?? '');
    setMarketingConsent(saved.marketing_consent);
  };

  return (
    <ModalShell isOpen={isOpen} onClose={() => setIsDeferred(true)} label="Hoàn thiện thông tin khách hàng" maxWidth="md">
      <div className="space-y-5 overflow-y-auto p-5 sm:p-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Hoàn thiện thông tin của bạn</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">KidHabit cần số điện thoại để hỗ trợ tài khoản và chăm sóc khách hàng khi bạn cần.</p>
        </div>
        <div className="grid gap-4">
          <label className="text-sm font-bold">Họ và tên
            <input autoFocus value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 font-normal dark:border-zinc-700 dark:bg-zinc-800" />
          </label>
          <label className="text-sm font-bold">Số điện thoại
            <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" placeholder="Ví dụ: 0912 345 678" className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 font-normal dark:border-zinc-700 dark:bg-zinc-800" />
          </label>
          <label className="text-sm font-bold">Email
            <input value={profile?.email ?? ''} disabled className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 font-normal text-slate-500 dark:border-zinc-700 dark:bg-zinc-800" />
          </label>
        </div>
        <label className="flex items-start gap-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} className="mt-1.5 h-4 w-4" />
          <span>Tôi đồng ý nhận hướng dẫn và ưu đãi phù hợp từ KidHabit. Có thể tắt bất kỳ lúc nào.</span>
        </label>
        {error && <p role="alert" className="text-sm font-bold text-rose-600">{error}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => setIsDeferred(true)} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold dark:border-zinc-700">Để sau</button>
          <button type="button" disabled={!canSave} onClick={() => void save()} className="min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? 'Đang lưu…' : 'Lưu và tiếp tục'}</button>
        </div>
      </div>
    </ModalShell>
  );
}
