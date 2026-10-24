'use client';

import { useMemo, useRef, useState } from 'react';
import { ModalShell } from '@/components/ui/ModalShell';
import {
  dailyLivingStatus,
  getTemplatesForSet,
  toHabitActivity,
  type DailyLivingSet,
  type DailyLivingTemplate,
} from '@/lib/daily-living-habits';
import { localDayKey } from '@/lib/habit-fire';
import { newHabitLimit } from '@/lib/habit-programs/config';
import { settleWithin } from '@/lib/habit-programs/settle-within';
import { fillTemplate } from '@/lib/habit-programs/suggestion-display';
import { childAgeYears } from '@/lib/habit-programs/summary';
import { useTranslation } from '@/lib/i18n/context';
import { getDailyLivingCopy } from '@/lib/i18n/daily-living-copy';
import { useAppStore } from '@/lib/store';
import type { HabitActivity, TimeOfDay } from '@/types';

const REQUEST_LIMIT_MS = 20_000;
const TIME_OF_DAY_OPTIONS: readonly TimeOfDay[] = ['morning', 'afternoon', 'evening', 'anytime'];

export type SetItemOverride = {
  readonly timeOfDay: TimeOfDay;
  readonly points: number;
};

export function clampHabitPoints(raw: number): number {
  if (!Number.isFinite(raw)) return 0;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

export function defaultSelectedSetItemIds(
  templates: readonly DailyLivingTemplate[],
  childId: string,
  ageYears: number,
  activities: readonly HabitActivity[],
): string[] {
  if (!childId) return [];
  const limit = newHabitLimit(ageYears);
  return templates
    .filter((template) => dailyLivingStatus(template, childId, activities) === 'available')
    .slice(0, limit)
    .map((template) => template.id);
}

export function calculateSelectedTotalPoints(
  templates: readonly DailyLivingTemplate[],
  selectedIds: readonly string[],
  overrides: Readonly<Record<string, Partial<SetItemOverride>>>,
): number {
  const selectedSet = new Set(selectedIds);
  return templates.reduce((sum, template) => {
    if (!selectedSet.has(template.id)) return sum;
    const rawPoints = overrides[template.id]?.points ?? template.points;
    return sum + clampHabitPoints(rawPoints);
  }, 0);
}

type DailyLivingSetModalProps = {
  readonly set: DailyLivingSet;
  readonly onClose: () => void;
  readonly onStarted: (childId: string) => void;
  readonly onNotConfirmed: () => void;
};

export function DailyLivingSetModal({
  set,
  onClose,
  onStarted,
  onNotConfirmed,
}: DailyLivingSetModalProps) {
  const { activities, profiles, activeChildId, familyId, createActivities } = useAppStore();
  const { language } = useTranslation();
  const copy = getDailyLivingCopy(language);
  const templates = useMemo(() => getTemplatesForSet(set.id), [set.id]);
  const today = localDayKey(new Date());

  const initialChildId =
    activeChildId && profiles.some((profile) => profile.id === activeChildId)
      ? activeChildId
      : (profiles[0]?.id ?? '');
  const initialChild = profiles.find((profile) => profile.id === initialChildId);
  const initialAgeYears = initialChild ? childAgeYears(initialChild, today) : 9;

  const [selectedChildId, setSelectedChildId] = useState<string>(initialChildId);
  const [selectedIds, setSelectedIds] = useState<readonly string[]>(() => (
    defaultSelectedSetItemIds(templates, initialChildId, initialAgeYears, activities)
  ));
  const [overrides, setOverrides] = useState<Readonly<Record<string, SetItemOverride>>>(() => (
    Object.fromEntries(
      templates.map((template) => [
        template.id,
        { timeOfDay: template.timeOfDay, points: template.points },
      ]),
    )
  ));
  const [busy, setBusy] = useState(false);
  const savingRef = useRef(false);

  const selectedChild = profiles.find((profile) => profile.id === selectedChildId);
  const ageYears = selectedChild ? childAgeYears(selectedChild, today) : 9;
  const limit = newHabitLimit(ageYears);

  const availableTemplates = templates.filter(
    (template) => selectedChildId && dailyLivingStatus(template, selectedChildId, activities) === 'available',
  );
  const chosenTemplates = availableTemplates.filter((template) => selectedIds.includes(template.id));
  const totalPoints = calculateSelectedTotalPoints(
    templates,
    chosenTemplates.map((template) => template.id),
    overrides,
  );

  const handleChildChange = (nextChildId: string) => {
    setSelectedChildId(nextChildId);
    const nextChild = profiles.find((profile) => profile.id === nextChildId);
    const nextAgeYears = nextChild ? childAgeYears(nextChild, today) : 9;
    setSelectedIds(defaultSelectedSetItemIds(templates, nextChildId, nextAgeYears, activities));
  };

  const handleToggleItem = (templateId: string, checked: boolean) => {
    setSelectedIds((previous) => (
      checked
        ? (previous.includes(templateId) ? previous : [...previous, templateId])
        : previous.filter((id) => id !== templateId)
    ));
  };

  const handleTimeChange = (template: DailyLivingTemplate, timeOfDay: TimeOfDay) => {
    setOverrides((previous) => ({
      ...previous,
      [template.id]: {
        points: previous[template.id]?.points ?? template.points,
        timeOfDay,
      },
    }));
  };

  const handlePointsChange = (template: DailyLivingTemplate, rawValue: string) => {
    const parsed = rawValue === '' ? 0 : Number(rawValue);
    const points = clampHabitPoints(parsed);
    setOverrides((previous) => ({
      ...previous,
      [template.id]: {
        timeOfDay: previous[template.id]?.timeOfDay ?? template.timeOfDay,
        points,
      },
    }));
  };

  const handleConfirm = async () => {
    if (savingRef.current || busy || !selectedChildId || chosenTemplates.length === 0) return;
    savingRef.current = true;
    setBusy(true);
    try {
      const additions = await Promise.all(
        chosenTemplates.map((template) => {
          const override = overrides[template.id];
          return toHabitActivity(template, familyId ?? 'local-family', {
            childId: selectedChildId,
            timeOfDay: override?.timeOfDay ?? template.timeOfDay,
            points: clampHabitPoints(override?.points ?? template.points),
          });
        }),
      );
      const created = await settleWithin(createActivities(additions), REQUEST_LIMIT_MS);
      if (!created) {
        onNotConfirmed();
        return;
      }
      onStarted(selectedChildId);
    } catch {
      onNotConfirmed();
    } finally {
      savingRef.current = false;
      setBusy(false);
    }
  };

  return (
    <ModalShell
      isOpen
      onClose={busy ? () => undefined : onClose}
      label={set.title}
      titleId="daily-living-set-modal-title"
      maxWidth="md"
    >
      <div className="space-y-4 overflow-y-auto p-5 sm:p-6" aria-busy={busy}>
        <div className="space-y-1">
          <h2 id="daily-living-set-modal-title" className="text-lg font-black text-slate-900 dark:text-white">
            {set.title}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {set.description}
          </p>
        </div>

        <div>
          <label htmlFor="daily-living-set-child" className="block text-sm font-bold text-slate-700 dark:text-slate-200">
            {copy.setModalChildLabel}
          </label>
          <select
            id="daily-living-set-child"
            data-testid="daily-living-set-child-select"
            value={selectedChildId}
            disabled={busy}
            onChange={(event) => handleChildChange(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100"
          >
            <option value="">{copy.childSelectPlaceholder}</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
        </div>

        {selectedChild && (
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {fillTemplate(copy.setModalLimitHint, {
              child: selectedChild.nickname || selectedChild.name,
              limit: String(limit),
            })}
          </p>
        )}

        {selectedChildId && availableTemplates.length === 0 && (
          <p
            role="status"
            data-testid="daily-living-set-all-added"
            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
          >
            {copy.setAllItemsAddedNotice}
          </p>
        )}

        <ul className="space-y-3">
          {templates.map((template) => {
            const status = selectedChildId
              ? dailyLivingStatus(template, selectedChildId, activities)
              : 'available';
            const isAvailable = status === 'available';
            const isSelected = isAvailable && selectedIds.includes(template.id);
            const override = overrides[template.id] ?? {
              timeOfDay: template.timeOfDay,
              points: template.points,
            };
            const itemTitle = template.source === 'legacy' ? template.shortTitle : template.title;

            return (
              <li
                key={template.id}
                data-testid="daily-living-set-item"
                data-template-id={template.id}
                className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-zinc-700 dark:bg-zinc-800/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <label className="flex min-h-11 flex-1 cursor-pointer items-start gap-2.5 text-sm">
                    <input
                      type="checkbox"
                      data-testid={`set-item-checkbox-${template.id}`}
                      data-template-id={template.id}
                      checked={isSelected}
                      disabled={!isAvailable || !selectedChildId || busy}
                      onChange={(event) => handleToggleItem(template.id, event.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed"
                    />
                    <span className="min-w-0 flex-1 text-slate-800 dark:text-slate-100">
                      <span className="font-bold">
                        <span aria-hidden="true" className="mr-1.5">{template.icon}</span>
                        {itemTitle}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-300">
                        {template.description}
                      </span>
                    </span>
                  </label>

                  {!isAvailable && (
                    <span
                      data-testid={`set-item-status-${template.id}`}
                      className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                    >
                      {status === 'sharedCovers'
                        ? copy.setItemSharedAdded
                        : status === 'graduated'
                        ? `${copy.setItemAlreadyAdded} · ${copy.graduatedLabel}`
                        : copy.setItemAlreadyAdded}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                    {copy.setItemTimeLabel}
                    <select
                      data-testid={`set-item-time-${template.id}`}
                      aria-label={`${copy.setItemTimeLabel}: ${itemTitle}`}
                      value={override.timeOfDay}
                      disabled={!isAvailable || busy}
                      onChange={(event) => handleTimeChange(template, event.target.value as TimeOfDay)}
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100"
                    >
                      {TIME_OF_DAY_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {copy.timeOfDayLabels[option]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                    {copy.setItemPointsLabel}
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      data-testid={`set-item-points-${template.id}`}
                      aria-label={`${copy.setItemPointsLabel}: ${itemTitle}`}
                      value={override.points}
                      disabled={!isAvailable || busy}
                      onChange={(event) => handlePointsChange(template, event.target.value)}
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100"
                    />
                  </label>
                </div>
              </li>
            );
          })}
        </ul>

        {chosenTemplates.length > limit && (
          <p
            role="status"
            data-testid="daily-living-set-over-limit"
            className="text-xs font-bold text-amber-700 dark:text-amber-300"
          >
            {fillTemplate(copy.setModalOverLimitHint, {
              selected: String(chosenTemplates.length),
              limit: String(limit),
            })}
          </p>
        )}

        <p
          data-testid="daily-living-set-total-points"
          className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm font-bold text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
        >
          {fillTemplate(copy.setTotalPointsLabel, {
            points: String(totalPoints),
            count: String(chosenTemplates.length),
          })}
        </p>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            data-testid="daily-living-set-cancel"
            disabled={busy}
            onClick={onClose}
            className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-slate-200 dark:hover:bg-zinc-800"
          >
            {copy.setCancelButton}
          </button>
          <button
            type="button"
            data-testid="daily-living-set-confirm"
            disabled={busy || !selectedChildId || chosenTemplates.length === 0}
            onClick={() => void handleConfirm()}
            className="min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? copy.savingButton : copy.setConfirmButton}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
