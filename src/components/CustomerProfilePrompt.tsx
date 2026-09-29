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

type CustomerProfilePromptProps = {
  readonly userId: string | null;
  /** True while family setup is collecting the same details; the prompt must stay out of the way. */
  readonly suppressed?: boolean;
};

export function CustomerProfilePrompt({ userId, suppressed = false }: CustomerProfilePromptProps) {
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
    // Required once a parent is signed in: Escape and the backdrop do nothing; signing out is the only way out.
    <ModalShell isOpen={isOpen} onClose={() => undefined} label="Hoàn thiện thông tin khách hàng" maxWidth="md">
      <div className="space-y-5 overflow-y-auto p-5 sm:p-6" aria-busy={isSaving}>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Hoàn thiện thông tin của bạn</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">KidHabit cần họ tên và số điện thoại để hỗ trợ tài khoản và chăm sóc khách hàng khi bạn cần. Bạn chỉ phải nhập một lần.</p>
        </div>
        <div className="grid gap-4">
          <label className="text-sm font-bold">Họ và tên
            <input autoFocus value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" aria-invalid={name.length > 0 && name.trim().length < 2} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 font-normal dark:border-zinc-700 dark:bg-zinc-800" />
          </label>
          <label className="text-sm font-bold">Số điện thoại
            <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" placeholder="Ví dụ: 0912 345 678" aria-invalid={phoneInvalid || undefined} aria-describedby={phoneInvalid ? 'customer-profile-phone-error' : undefined} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 font-normal dark:border-zinc-700 dark:bg-zinc-800" />
            {phoneInvalid && <span id="customer-profile-phone-error" role="alert" className="mt-1 block text-xs font-bold text-rose-600">Số điện thoại chưa hợp lệ. Hãy nhập 9 đến 15 chữ số.</span>}
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
          <button type="button" onClick={() => void logout()} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold dark:border-zinc-700">Đăng xuất</button>
          <button type="button" disabled={!canSave} onClick={() => void save()} className="min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? 'Đang lưu…' : 'Lưu và tiếp tục'}</button>
        </div>
      </div>
    </ModalShell>
  );
}
