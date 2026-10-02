'use client';

import { useState } from 'react';
import { Share2, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { buildSafeAchievementShare } from '@/lib/safe-achievement-share';
import { ModalShell } from '@/components/ui/ModalShell';

export function AchievementShareDialog() {
  const { language } = useTranslation();
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const share = buildSafeAchievementShare(language);

  const confirmShare = async () => {
    const payload = { ...share, url: new URL(share.url, window.location.origin).toString() };
    try {
      if (navigator.share) await navigator.share(payload);
      else {
        await navigator.clipboard.writeText(`${payload.text} ${payload.url}`);
        setNotice('Đã sao chép nội dung để bạn tự chia sẻ.');
      }
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setNotice('Chưa thể mở bảng chia sẻ. Vui lòng thử lại.');
    }
  };

  return (
    <>
      <section className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 to-amber-50 p-6 dark:border-violet-900 dark:from-violet-950/30 dark:to-amber-950/20">
        <h4 className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white"><Share2 className="h-5 w-5 text-violet-600" aria-hidden="true" />Lan tỏa một cột mốc tích cực</h4>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">Nội dung mặc định không có tên, tuổi, ảnh hoặc nhiệm vụ của trẻ. KidHabit không thêm mã theo dõi cá nhân.</p>
        <button type="button" onClick={() => { setNotice(''); setOpen(true); }} className="mt-4 min-h-11 rounded-xl bg-violet-700 px-4 text-sm font-bold text-white hover:bg-violet-800">Chia sẻ cột mốc gia đình</button>
      </section>

      <ModalShell isOpen={open} label="Xem trước nội dung chia sẻ" titleId="achievement-share-title" onClose={() => setOpen(false)} maxWidth="lg" mobileSheet={false}>
        <div className="overflow-y-auto p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-violet-700 dark:text-violet-300">Xem trước</p><h3 id="achievement-share-title" className="mt-1 text-xl font-black text-slate-900 dark:text-white">{share.title}</h3></div><button type="button" aria-label="Đóng" onClick={() => setOpen(false)} className="grid min-h-11 min-w-11 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-zinc-800"><X aria-hidden="true" /></button></div>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-base font-semibold leading-relaxed text-slate-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100">{share.text}</div>
          <p className="mt-3 text-xs font-semibold text-slate-500">Bạn chủ động xác nhận trước khi hệ thống mở bảng chia sẻ của thiết bị.</p>
          <div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => void confirmShare()} className="min-h-11 rounded-xl bg-violet-700 px-5 text-sm font-bold text-white hover:bg-violet-800">Xác nhận chia sẻ</button><button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 dark:border-zinc-700 dark:text-slate-200">Hủy</button></div>
          {notice && <p role="status" className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{notice}</p>}
        </div>
      </ModalShell>
    </>
  );
}
