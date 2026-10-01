'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { startEnrollment, verifyCode, type MfaClient } from '@/lib/auth/admin-mfa-flow';
import { getBrowserSupabase } from '@/lib/supabase/browser';

type MfaState = 'loading' | 'needs_enrollment' | 'needs_challenge' | 'verified' | 'error';

export function AdminMfaPanel() {
  const router = useRouter();
  const [state, setState] = useState<MfaState>('loading');
  const [factorId, setFactorId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const client = getBrowserSupabase();
    if (!client) {
      setMessage('Dịch vụ đăng nhập chưa được cấu hình.');
      setState('error');
      return;
    }
    const [{ data: assurance, error: assuranceError }, { data: factors, error: factorError }] = await Promise.all([
      client.auth.mfa.getAuthenticatorAssuranceLevel(),
      client.auth.mfa.listFactors(),
    ]);
    if (assuranceError || factorError) {
      setMessage('Không đọc được trạng thái xác minh hai bước.');
      setState('error');
      return;
    }
    if (assurance.currentLevel === 'aal2') {
      setState('verified');
      return;
    }
    const verifiedFactor = factors.totp.find((factor) => factor.status === 'verified');
    if (verifiedFactor) {
      setFactorId(verifiedFactor.id);
      setState('needs_challenge');
      return;
    }
    setState('needs_enrollment');
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  const enroll = async () => {
    const client = getBrowserSupabase();
    if (!client) return;
    setBusy(true);
    setMessage('');
    const result = await startEnrollment(client as unknown as MfaClient, 'KidHabit Admin');
    setBusy(false);
    if (!result.ok) {
      setMessage('Không thể bắt đầu thiết lập. Hãy thử lại.');
      return;
    }
    setFactorId(result.factorId);
    setQrCode(result.qrCode);
    setSecret(result.secret);
  };

  const verify = async () => {
    const client = getBrowserSupabase();
    if (!client) return;
    setBusy(true);
    setMessage('');
    const result = await verifyCode(client as unknown as MfaClient, factorId, code);
    setBusy(false);
    if (!result.ok) {
      setMessage(result.reason === 'format'
        ? 'Nhập mã gồm 6 chữ số từ ứng dụng xác thực.'
        : result.reason === 'rejected'
          ? 'Mã xác minh không đúng hoặc đã hết hạn. Đợi mã mới trong ứng dụng rồi nhập lại.'
          : 'Chưa kết nối được dịch vụ xác minh. Hãy thử lại.');
      return;
    }
    // This page is already /admin/security, so staying put would change nothing on screen: show the result now,
    // then go on to the admin page, refreshing so the server renders with the upgraded session.
    setState('verified');
    window.setTimeout(() => {
      router.push('/admin');
      router.refresh();
    }, 600);
  };

  if (state === 'loading') return <p className="text-sm text-slate-600">Đang kiểm tra bảo mật…</p>;
  if (state === 'verified') {
    return (
      <div className="rounded-2xl bg-emerald-50 p-5 text-emerald-900">
        <h2 className="text-xl font-black">Đã xác minh hai bước</h2>
        <p className="mt-2 text-sm">Phiên này có thể thực hiện các thao tác quản trị nhạy cảm.</p>
        <a href="/admin" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white">Quay lại quản trị</a>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {message && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{message}</p>}
      {state === 'needs_enrollment' && !factorId && (
        <div>
          <h2 className="text-xl font-black">Bật xác minh hai bước</h2>
          <p className="mt-2 text-sm text-slate-600">Dùng Google Authenticator, 1Password, Authy hoặc ứng dụng TOTP tương thích.</p>
          <button type="button" disabled={busy} onClick={() => void enroll()} className="mt-4 min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white disabled:opacity-50">Tạo mã thiết lập</button>
        </div>
      )}
      {qrCode && (
        <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
          <Image src={qrCode} alt="Mã QR thiết lập ứng dụng xác thực" width={224} height={224} unoptimized className="mx-auto size-56 max-w-full" />
          <details className="text-sm">
            <summary className="cursor-pointer font-bold">Không quét được QR?</summary>
            <p className="mt-2 break-all rounded-lg bg-slate-100 p-3 font-mono text-xs">{secret}</p>
          </details>
        </div>
      )}
      {(state === 'needs_challenge' || factorId) && (
        <div className="space-y-3">
          <label className="block text-sm font-bold">Mã xác minh 6 chữ số
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-lg tracking-[0.35em]"
            />
          </label>
          <button type="button" disabled={busy} onClick={() => void verify()} className="min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white disabled:opacity-50">Xác minh và tiếp tục</button>
        </div>
      )}
    </div>
  );
}
