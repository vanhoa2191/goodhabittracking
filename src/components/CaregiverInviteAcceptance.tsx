'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HeartHandshake } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

type State = 'checking' | 'signed-out' | 'accepting' | 'accepted' | 'error';
const TOKEN_SESSION_KEY = 'kidhabit_caregiver_invite';

export function CaregiverInviteAcceptance() {
  const [state, setState] = useState<State>('checking');

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      const hashToken = new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '';
      const savedToken = sessionStorage.getItem(TOKEN_SESSION_KEY) ?? '';
      const candidate = hashToken || savedToken;
      window.history.replaceState(window.history.state, '', '/invite/caregiver');
      if (candidate.length !== 72) {
        if (active) setState('error');
        return;
      }
      sessionStorage.setItem(TOKEN_SESSION_KEY, candidate);
      const client = getSupabase();
      if (!client) {
        if (active) setState('signed-out');
        return;
      }
      void client.auth.getUser().then(({ data }) => {
        if (!active) return;
        if (!data.user) {
          setState('signed-out');
          return;
        }
        setState('accepting');
        return fetch('/api/caregiver/invites/accept', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ token: candidate }),
        }).then((response) => {
          if (!active) return;
          if (response.ok) sessionStorage.removeItem(TOKEN_SESSION_KEY);
          setState(response.ok ? 'accepted' : 'error');
        });
      }).catch(() => active && setState('signed-out'));
    });
    return () => { active = false; };
  }, []);

  const signIn = async () => {
    const client = getSupabase();
    if (!client) {
      setState('error');
      return;
    }
    await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/invite/caregiver` },
    });
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10 dark:bg-zinc-950">
      <section className="w-full max-w-lg rounded-3xl border border-indigo-100 bg-white p-7 text-center shadow-xl dark:border-indigo-900 dark:bg-zinc-900">
        <HeartHandshake aria-hidden="true" className="mx-auto h-12 w-12 text-indigo-600" />
        <h1 className="mt-4 text-2xl font-black text-slate-900 dark:text-white">Tham gia với vai trò người chăm sóc</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Bạn sẽ có quyền xem tiến độ gia đình. Quyền chỉnh sửa vẫn thuộc về phụ huynh quản lý.</p>
        {state === 'checking' || state === 'accepting' ? <p role="status" className="mt-5 font-semibold text-indigo-700 dark:text-indigo-300">Đang kiểm tra lời mời…</p> : null}
        {state === 'signed-out' && <button type="button" onClick={() => void signIn()} className="mt-6 min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700">Đăng nhập Google để tiếp tục</button>}
        {state === 'accepted' && <div role="status" className="mt-6"><p className="font-bold text-emerald-700 dark:text-emerald-300">Đã tham gia gia đình thành công.</p><Link href="/" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white">Mở góc người chăm sóc</Link></div>}
        {state === 'error' && <p role="alert" className="mt-6 font-semibold text-rose-700 dark:text-rose-300">Lời mời không hợp lệ, đã hết hạn hoặc tài khoản đã thuộc một gia đình khác.</p>}
      </section>
    </main>
  );
}
