'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('ui_boundary', { digest: error.digest ?? 'unavailable' });
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-black">Ứng dụng vừa gặp sự cố</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Dữ liệu của bạn vẫn được giữ nguyên. Hãy thử tải lại khu vực này; nếu lỗi lặp lại, gửi mã hỗ trợ bên dưới cho đội vận hành.
      </p>
      <code className="rounded-lg bg-slate-100 px-3 py-2 text-xs dark:bg-zinc-800">{error.digest ?? 'LOCAL-ERROR'}</code>
      <button type="button" onClick={reset} className="min-h-11 rounded-xl bg-indigo-600 px-5 font-bold text-white hover:bg-indigo-700">
        Thử lại
      </button>
    </main>
  );
}
