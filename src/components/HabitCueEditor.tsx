'use client';

import { useId, useState } from 'react';
import { ModalShell } from '@/components/ui/ModalShell';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { getHabitProgramsCopy } from '@/lib/i18n/habit-programs-copy';
import { cuePlanInputSchema } from '@/lib/habit-programs/cue-plan-input';
import { fillTemplate } from '@/lib/habit-programs/suggestion-display';
import type { CuePlan } from '@/lib/experience-state';
import type { HabitActivity } from '@/types';

type HabitCueEditorProps = {
  readonly activity: HabitActivity;
  readonly title: string;
  readonly childId: string;
  readonly existing: CuePlan | undefined;
  readonly onClose: () => void;
};

/** Where a parent and child agree on the "if this, then that" cue that starts a habit. */
export function HabitCueEditor({ activity, title, childId, existing, onClose }: HabitCueEditorProps) {
  const { saveHabitCuePlan } = useAppStore();
  const { language } = useTranslation();
  const copy = getHabitProgramsCopy(language);
  const ids = useId();
  const [kind, setKind] = useState<'event' | 'time'>(existing?.cue_kind ?? 'event');
  const [text, setText] = useState(existing?.cue_text ?? '');
  const [time, setTime] = useState(existing?.cue_time?.slice(0, 5) ?? '19:00');
  const [place, setPlace] = useState(existing?.place_text ?? '');
  const [weekend, setWeekend] = useState(existing?.weekend_variant_text ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const save = async () => {
    const parsed = cuePlanInputSchema.safeParse({
      cueKind: kind,
      cueText: text,
      cueTime: kind === 'time' ? time : null,
      placeText: place.trim() === '' ? null : place,
      weekendVariantText: weekend.trim() === '' ? null : weekend,
    });
    if (!parsed.success) {
      setFailed(true);
      return;
    }
    setFailed(false);
    setIsSaving(true);
    const saved = await saveHabitCuePlan(activity.id, parsed.data, childId);
    setIsSaving(false);
    if (saved) onClose();
    else setFailed(true);
  };

  const fieldClass = 'mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100';

  return (
    <ModalShell isOpen onClose={onClose} label={fillTemplate(copy.cueTitle, { habit: title })} maxWidth="md">
      <div className="space-y-4 overflow-y-auto p-5 sm:p-6" aria-busy={isSaving}>
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">{fillTemplate(copy.cueTitle, { habit: title })}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{copy.cueIntro}</p>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-bold text-slate-700 dark:text-slate-200">{copy.cueKindLabel}</legend>
          {(['event', 'time'] as const).map((option) => (
            <label key={option} className="flex min-h-11 items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input type="radio" name={`${ids}-kind`} checked={kind === option} onChange={() => setKind(option)} className="h-4 w-4" />
              {option === 'event' ? copy.cueKindEvent : copy.cueKindTime}
            </label>
          ))}
        </fieldset>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
          {copy.cueTextLabel}
          <input value={text} onChange={(event) => setText(event.target.value)} maxLength={200} placeholder={kind === 'event' ? copy.cueTextPlaceholderEvent : copy.cueTextPlaceholderTime} className={fieldClass} />
        </label>
        {kind === 'time' && (
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
            {copy.cueTimeLabel}
            <input type="time" value={time} onChange={(event) => setTime(event.target.value)} className={fieldClass} />
          </label>
        )}
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
          {copy.cuePlaceLabel}
          <input value={place} onChange={(event) => setPlace(event.target.value)} maxLength={120} className={fieldClass} />
        </label>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
          {copy.cueWeekendLabel}
          <input value={weekend} onChange={(event) => setWeekend(event.target.value)} maxLength={200} className={fieldClass} />
        </label>
        {failed && <p role="alert" className="text-sm font-bold text-rose-600">{copy.cueSaveFailed}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold dark:border-zinc-700">{copy.cueCancel}</button>
          <button type="button" disabled={isSaving} onClick={() => void save()} className="min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
            {isSaving ? copy.cueSaving : copy.cueSave}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
