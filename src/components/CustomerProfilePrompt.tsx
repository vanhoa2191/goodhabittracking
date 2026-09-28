'use client';

import { useEffect, useState } from 'react';
import { ModalShell } from '@/components/ui/ModalShell';
import { needsCustomerProfileCompletion } from '@/lib/customer-profile';
import {
  CustomerProfileRequestError,
  loadCustomerProfile,
  saveCustomerProfile,
} from '@/lib/customer-profile-client';
import type { CustomerProfile } from '@/lib/customer-profile-client';

type CustomerProfilePromptProps = {
  readonly userId: string | null;
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
      void loadCustomerProfile()
        .then((loadedProfile) => {
          if (!active) return;
          setProfile(loadedProfile);
          setName(loadedProfile.display_name);
          setPhone(loadedProfile.phone ?? '');
          setMarketingConsent(loadedProfile.marketing_consent);
          setIsDeferred(false);
        })
        .catch(() => undefined);
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
    try {
      const saved = await saveCustomerProfile({ displayName: name, phone, marketingConsent });
      setProfile(saved);
      setName(saved.display_name);
      setPhone(saved.phone ?? '');
      setMarketingConsent(saved.marketing_consent);
    } catch (caught: unknown) {
      if (!(caught instanceof CustomerProfileRequestError)) {
        setError('KidHabit chưa thể lưu thông tin lúc này. Vui lòng thử lại.');
        return;
      }
      const messages = {
        network_error: 'Kết nối bị gián đoạn. Kiểm tra mạng rồi thử lại.',
        invalid_response: 'KidHabit chưa xác nhận được việc lưu. Vui lòng thử lại.',
        service_unavailable: 'KidHabit chưa thể lưu thông tin lúc này. Vui lòng thử lại.',
        session_expired: 'Phiên đăng nhập đã hết hạn. Đăng nhập lại để tiếp tục.',
      } as const;
      const supportCode = caught.correlationId ? ` Mã hỗ trợ: ${caught.correlationId}.` : '';
      setError(`${messages[caught.code]}${supportCode}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={() => setIsDeferred(true)} label="Hoàn thiện thông tin khách hàng" maxWidth="md">
      <div className="space-y-5 overflow-y-auto p-5 sm:p-6" aria-busy={isSaving}>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Hoàn thiện thông tin của bạn</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">KidHabit cần số điện thoại để hỗ trợ tài khoản và chăm sóc khách hàng khi bạn cần.</p>
        </div>
        <div className="grid gap-4">
          <label className="text-sm font-bold">Họ và tên
            <input autoFocus value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" aria-invalid={name.length > 0 && name.trim().length < 2} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 font-normal dark:border-zinc-700 dark:bg-zinc-800" />
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
