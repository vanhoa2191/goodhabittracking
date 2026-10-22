'use client';

import { useEffect, useState } from 'react';
import { Eye, Gamepad2 } from 'lucide-react';
import { getThinkingGameParentSettings, previewThinkingGameDay, updateThinkingGameParentSettings } from '@/lib/store/thinking-games-client';
import { useAppStore } from '@/lib/store';
import { defaultExperienceFlags } from '@/lib/experience-flags';

type SettingsData = {
  enabled?: boolean;
  bonus_enabled?: boolean;
  timezone?: string;
  cutoff_local?: string;
  bedtime_start_local?: string;
  bedtime_end_local?: string;
  age_track_override?: 'age_6_8' | 'age_9_12' | null;
};

export function ThinkingGamesSettingsSection() {
  if (!defaultExperienceFlags.thinkingGames) return null;
  return <ThinkingGamesSettingsContent />;
}

function ThinkingGamesSettingsContent() {
  const { activeChild } = useAppStore();
  const [enabled, setEnabled] = useState(false);
  const [bonusEnabled, setBonusEnabled] = useState(false);
  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh');
  const [cutoffLocal, setCutoffLocal] = useState('19:00');
  const [bedtimeStartLocal, setBedtimeStartLocal] = useState('21:00');
  const [bedtimeEndLocal, setBedtimeEndLocal] = useState('07:00');
  const [ageTrackOverride, setAgeTrackOverride] = useState<'' | 'age_6_8' | 'age_9_12'>('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState('');

  useEffect(() => {
    let active = true;
    void getThinkingGameParentSettings().then((response) => {
      if (!active || !response.ok) return;
      const data = response.data as SettingsData | undefined;
      setEnabled(Boolean(data?.enabled));
      setBonusEnabled(Boolean(data?.bonus_enabled));
      if (data?.timezone) setTimezone(data.timezone);
      if (data?.cutoff_local) setCutoffLocal(data.cutoff_local.slice(0, 5));
      if (data?.bedtime_start_local) setBedtimeStartLocal(data.bedtime_start_local.slice(0, 5));
      if (data?.bedtime_end_local) setBedtimeEndLocal(data.bedtime_end_local.slice(0, 5));
      setAgeTrackOverride(data?.age_track_override ?? '');
    }).catch(() => { if (active) setStatus('Không thể tải cài đặt trò chơi.'); });
    return () => { active = false; };
  }, []);

  const save = async () => {
    setSaving(true);
    setStatus('');
    try {
      const result = await updateThinkingGameParentSettings({
        enabled, bonusEnabled, timezone, cutoffLocal, bedtimeStartLocal, bedtimeEndLocal,
        ageTrackOverride: ageTrackOverride || null, commandId: crypto.randomUUID(),
      });
      const data = result.ok ? result.data as { status?: string } | undefined : undefined;
      setStatus(result.ok
        ? data?.status === 'scheduled'
          ? 'Đã lưu. Thay đổi bật trò chơi sẽ áp dụng từ ngày địa phương tiếp theo.'
          : 'Đã lưu cài đặt trò chơi.'
        : 'Không thể lưu cài đặt.');
    } catch { setStatus('Không thể lưu cài đặt. Bé cần mã PIN của phụ huynh để thay đổi.'); }
    finally { setSaving(false); }
  };

  const loadPreview = async () => {
    if (!activeChild) return;
    try {
      const result = await previewThinkingGameDay({ childId: activeChild.id, localDay: new Date().toISOString().slice(0, 10) });
      setPreview(result.ok ? 'Đã tải bản xem trước ngày hôm nay.' : 'Chưa có bản xem trước cho ngày này.');
    } catch { setPreview('Chưa có bản xem trước cho ngày này.'); }
  };

  return (
    <section id="settings-thinking-games" className="scroll-mt-40 rounded-3xl border border-amber-200 bg-amber-50/70 p-6 dark:border-amber-900/50 dark:bg-amber-950/20" aria-labelledby="thinking-games-settings-title">
      <h4 id="thinking-games-settings-title" className="flex items-center gap-2 text-base font-black text-amber-950 dark:text-amber-100"><Gamepad2 aria-hidden="true" className="h-5 w-5" /> Trò chơi luyện tập</h4>
      <p className="mt-2 text-sm text-amber-900/80 dark:text-amber-200/80">Không thay đổi điểm, thói quen hoặc phần thưởng. Nội dung chưa được duyệt sẽ không xuất hiện trong tài khoản thật.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex min-h-11 items-center gap-3 text-sm font-bold text-slate-800 dark:text-slate-100">
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} className="h-5 w-5 accent-indigo-600" />
          Cho phép trò chơi hôm nay
        </label>
        <label className="flex min-h-11 items-center gap-3 text-sm font-bold text-slate-800 dark:text-slate-100">
          <input type="checkbox" checked={bonusEnabled} onChange={(event) => setBonusEnabled(event.target.checked)} disabled={!enabled} className="h-5 w-5 accent-indigo-600 disabled:opacity-40" />
          Cho phép thử thách phụ
        </label>
        <label className="text-sm font-bold text-slate-800 dark:text-slate-100">Múi giờ
          <input value={timezone} onChange={(event) => setTimezone(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        </label>
        <label className="text-sm font-bold text-slate-800 dark:text-slate-100">Giờ chốt ngày
          <input type="time" value={cutoffLocal} onChange={(event) => setCutoffLocal(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        </label>
        <label className="text-sm font-bold text-slate-800 dark:text-slate-100">Bắt đầu giờ ngủ
          <input type="time" value={bedtimeStartLocal} onChange={(event) => setBedtimeStartLocal(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        </label>
        <label className="text-sm font-bold text-slate-800 dark:text-slate-100">Kết thúc giờ ngủ
          <input type="time" value={bedtimeEndLocal} onChange={(event) => setBedtimeEndLocal(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        </label>
        <label className="text-sm font-bold text-slate-800 dark:text-slate-100">Độ tuổi trò chơi
          <select value={ageTrackOverride} onChange={(event) => setAgeTrackOverride(event.target.value as '' | 'age_6_8' | 'age_9_12')} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900">
            <option value="">Theo tuổi của bé</option>
            <option value="age_6_8">6–8 tuổi</option>
            <option value="age_9_12">9–12 tuổi</option>
          </select>
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => void save()} disabled={saving} className="min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60">{saving ? 'Đang lưu…' : 'Lưu cài đặt'}</button>
        <button type="button" onClick={() => void loadPreview()} disabled={!activeChild} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 text-sm font-bold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"><Eye aria-hidden="true" className="h-4 w-4" /> Xem trước</button>
      </div>
      {status && <p role="status" className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{status}</p>}
      {preview && <p role="status" className="mt-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300">{preview}</p>}
    </section>
  );
}
