import type { Dispatch, SetStateAction } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  findMatchingDailyLivingActivities,
  resolveDailyLivingCardState,
} from '@/components/DailyLivingHabitLibrary';
import {
  calculateSelectedTotalPoints,
  clampHabitPoints,
  defaultSelectedSetItemIds,
} from '@/components/DailyLivingSetModal';
import {
  getDailyLivingTemplate,
  getTemplatesForSet,
  toHabitActivity,
} from '@/lib/daily-living-habits';
import { emptyExperienceState } from '@/lib/experience-state';
import { nextLowerStarStep } from '@/lib/habit-programs/star-step';
import { summarizeChildHabits } from '@/lib/habit-programs/summary';
import { getDailyLivingCopy } from '@/lib/i18n/daily-living-copy';
import { createActivityActions, overlapsDailyLivingAssignment } from '@/lib/store/activity-actions';
import { toggleLocalHabit } from '@/lib/store/local-habit-actions';
import type { ActivityLog, ChildProfile, HabitActivity } from '@/types';

const familyId = '11111111-1111-4111-8111-111111111111';
const childA = '22222222-2222-4222-8222-222222222222';
const childB = '33333333-3333-4333-8333-333333333333';

function makeActivity(overrides: Partial<HabitActivity> = {}): HabitActivity {
  return {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    childId: childA,
    title: 'Đánh răng buổi sáng',
    icon: '🪥',
    category: 'selfcare',
    points: 5,
    recurrenceType: 'daily',
    recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
    timeOfDay: 'morning',
    requiresApproval: false,
    isActive: true,
    targetAgeStage: 'all',
    isParentRole: false,
    legacyTemplateId: 'WIT-DLY-01',
    createdAt: '2026-10-24T00:00:00.000Z',
    ...overrides,
  };
}

describe('DailyLivingSetModal pure helpers', () => {
  it('selects at most newHabitLimit(ageYears) available items in set order', () => {
    const dls02 = getTemplatesForSet('DLS-02'); // 5 items: DLY-01, DLY-03, DLY-05, DLY-04, WIT-CAP-01
    expect(defaultSelectedSetItemIds(dls02, childA, 2, [])).toEqual(['WIT-DLY-01']);
    expect(defaultSelectedSetItemIds(dls02, childA, 4, [])).toEqual(['WIT-DLY-01', 'WIT-DLY-03']);
    expect(defaultSelectedSetItemIds(dls02, childA, 8, [])).toEqual(['WIT-DLY-01', 'WIT-DLY-03', 'WIT-DLY-05']);
    expect(defaultSelectedSetItemIds(dls02, childA, 16, [])).toEqual([
      'WIT-DLY-01',
      'WIT-DLY-03',
      'WIT-DLY-05',
      'WIT-DLY-04',
    ]);
  });

  it('skips items already added or covered by shared for the selected child, but not another child', () => {
    const dls02 = getTemplatesForSet('DLS-02');
    const existing: HabitActivity[] = [
      makeActivity({ legacyTemplateId: 'WIT-DLY-01', childId: childA, isActive: true }),
      makeActivity({ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', legacyTemplateId: 'WIT-DLY-03', childId: null, isActive: true }),
      makeActivity({ id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', legacyTemplateId: 'WIT-DLY-05', childId: childB, isActive: true }),
    ];

    // For childA (age 4 -> limit 2): DLY-01 is added, DLY-03 is sharedCovers, DLY-05 is only on childB so available for childA!
    expect(defaultSelectedSetItemIds(dls02, childA, 4, existing)).toEqual(['WIT-DLY-05', 'WIT-DLY-04']);
    // For childB (age 4 -> limit 2): DLY-01 is available, DLY-03 is sharedCovers, DLY-05 is added on childB -> picks DLY-01, DLY-04
    expect(defaultSelectedSetItemIds(dls02, childB, 4, existing)).toEqual(['WIT-DLY-01', 'WIT-DLY-04']);
  });

  it('returns empty array when no child is selected or all set items are already added', () => {
    const dls01 = getTemplatesForSet('DLS-01');
    expect(defaultSelectedSetItemIds(dls01, '', 5, [])).toEqual([]);
    const allAdded = [
      makeActivity({ legacyTemplateId: 'WIT-DLY-01', childId: childA }),
      makeActivity({ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', legacyTemplateId: 'WIT-DLY-03', childId: childA }),
    ];
    expect(defaultSelectedSetItemIds(dls01, childA, 5, allAdded)).toEqual([]);
  });

  it('clamps points to integer 0..100 and sums total stars only for selected items', () => {
    expect(clampHabitPoints(-5)).toBe(0);
    expect(clampHabitPoints(0)).toBe(0);
    expect(clampHabitPoints(12.6)).toBe(13);
    expect(clampHabitPoints(150)).toBe(100);
    expect(clampHabitPoints(Number.NaN)).toBe(0);

    const dls04 = getTemplatesForSet('DLS-04'); // DLY-01 (5), DLY-02 (5), DLY-03 (5), WIT-NUT-01 (10), DLY-06 (5)
    expect(calculateSelectedTotalPoints(dls04, ['WIT-DLY-01', 'WIT-DLY-02', 'WIT-NUT-01'], {})).toBe(20);
    expect(
      calculateSelectedTotalPoints(dls04, ['WIT-DLY-01', 'WIT-DLY-02'], {
        'WIT-DLY-01': { points: 0 },
        'WIT-DLY-02': { points: 15 },
      }),
    ).toBe(15);
  });
});

describe('DailyLivingHabitLibrary card state resolution', () => {
  const dly01 = getDailyLivingTemplate('WIT-DLY-01')!;

  it('resolves available, added, sharedCovers, archived, and graduated states with targetActivity', () => {
    expect(resolveDailyLivingCardState(dly01, '', [])).toEqual({ status: 'available' });

    const addedAct = makeActivity({ id: 'act-added', childId: childA, isActive: true });
    expect(resolveDailyLivingCardState(dly01, childA, [addedAct])).toEqual({
      status: 'added',
      targetActivity: addedAct,
    });

    const sharedAct = makeActivity({ id: 'act-shared', childId: null, isActive: true });
    expect(resolveDailyLivingCardState(dly01, childA, [sharedAct])).toEqual({
      status: 'sharedCovers',
      targetActivity: sharedAct,
    });
    expect(resolveDailyLivingCardState(dly01, 'shared', [sharedAct])).toEqual({
      status: 'added',
      targetActivity: sharedAct,
    });

    const archivedAct = makeActivity({ id: 'act-archived', childId: childA, isActive: false, graduatedAt: null });
    expect(resolveDailyLivingCardState(dly01, childA, [archivedAct])).toEqual({
      status: 'archived',
      targetActivity: archivedAct,
    });

    const graduatedAct = makeActivity({
      id: 'act-graduated',
      childId: childA,
      isActive: false,
      graduatedAt: '2026-10-10T00:00:00.000Z',
    });
    expect(resolveDailyLivingCardState(dly01, childA, [graduatedAct])).toEqual({
      status: 'graduated',
      targetActivity: graduatedAct,
    });
  });

  it('finds matching activities for both daily and legacy templates', () => {
    const nut = getDailyLivingTemplate('WIT-NUT-01')!;
    const nutAct = makeActivity({ id: 'act-nut', legacyTemplateId: 'WIT-NUT-01' });
    expect(findMatchingDailyLivingActivities(nut, [nutAct])).toEqual([nutAct]);
  });

  it('exposes Vietnamese copy for hand washing note and library/modal labels', () => {
    const copy = getDailyLivingCopy('vi');
    expect(copy.tabLabel).toBe('Sinh hoạt hằng ngày');
    expect(copy.frameworkTabLabel).toBe('Theo khung phát triển');
    expect(copy.handWashingNote).toContain('tổng kết theo ngày');
    expect(copy.saveUnconfirmedNotice).toBe('Lưu chưa được xác nhận');
  });
});

describe('Client-side duplicate prevention in createActivityActions', () => {
  it('prevents duplicate WIT-DLY-* and WIT-NUT-01/WIT-CAP-01 in demo mode within the same tab', async () => {
    let state: HabitActivity[] = [];
    const setActivities: Dispatch<SetStateAction<HabitActivity[]>> = (action) => {
      state = typeof action === 'function' ? action(state) : action;
    };
    const actions = createActivityActions({
      currentUser: null,
      familyId,
      getActivities: () => state,
      setActivities,
      setCloudSyncActive: () => undefined,
      isDemoSession: true,
      syncCloudFamily: vi.fn(async () => true),
    });

    const dly01 = await toHabitActivity(getDailyLivingTemplate('WIT-DLY-01')!, familyId, { childId: childA });
    const nut01First = await toHabitActivity(getDailyLivingTemplate('WIT-NUT-01')!, familyId, { childId: childA });
    const nut01Second = await toHabitActivity(getDailyLivingTemplate('WIT-NUT-01')!, familyId, { childId: childA });

    await actions.createActivities([dly01, dly01, nut01First, nut01Second]);
    await actions.createActivities([dly01, nut01Second]);

    expect(state).toHaveLength(2);
    expect(state.map((a) => a.legacyTemplateId)).toEqual(['WIT-DLY-01', 'WIT-NUT-01']);

    // Child B can still receive WIT-DLY-01 and WIT-NUT-01
    const dly01ChildB = await toHabitActivity(getDailyLivingTemplate('WIT-DLY-01')!, familyId, { childId: childB });
    expect(overlapsDailyLivingAssignment(dly01ChildB, state)).toBe(false);
    await actions.createActivities([dly01ChildB]);
    expect(state).toHaveLength(3);
  });
});

describe('Kid timeOfDay separation and graduation compatibility for WIT-DLY-*', () => {
  it('keeps morning and evening brushing in separate timeOfDay buckets and toggles them independently', async () => {
    const morning = {
      ...(await toHabitActivity(getDailyLivingTemplate('WIT-DLY-01')!, familyId, { childId: childA })),
      createdAt: '2026-10-24T00:00:00.000Z',
    };
    const evening = {
      ...(await toHabitActivity(getDailyLivingTemplate('WIT-DLY-02')!, familyId, { childId: childA })),
      createdAt: '2026-10-24T00:00:00.000Z',
    };

    expect(morning.timeOfDay).toBe('morning');
    expect(evening.timeOfDay).toBe('evening');
    expect(morning.id).not.toBe(evening.id);

    const profile: ChildProfile = {
      id: childA,
      name: 'Bé An',
      avatar: 'mascot:leo',
      themeColor: 'amber',
      points: 0,
      totalEarned: 0,
      level: 1,
      streak: 0,
      createdAt: '2026-10-01T00:00:00.000Z',
    };

    // Completing morning brushing does not complete evening brushing
    const afterMorning = toggleLocalHabit({
      profiles: [profile],
      logs: [],
      childBadges: [],
      badges: [],
      activity: morning,
      childId: childA,
      date: '2026-10-24',
      today: '2026-10-24',
      logId: 'log-morning',
      completedAt: '2026-10-24T07:00:00.000Z',
    });
    expect(afterMorning.kind).toBe('completed');
    expect(afterMorning.profiles[0].points).toBe(5);
    expect(afterMorning.logs.map((l) => l.activityId)).toEqual([morning.id]);

    // Completing evening brushing adds its own log and points
    const afterEvening = toggleLocalHabit({
      profiles: afterMorning.profiles,
      logs: afterMorning.logs,
      childBadges: [],
      badges: [],
      activity: evening,
      childId: childA,
      date: '2026-10-24',
      today: '2026-10-24',
      logId: 'log-evening',
      completedAt: '2026-10-24T20:00:00.000Z',
    });
    expect(afterEvening.profiles[0].points).toBe(10);
    expect(afterEvening.logs.map((l) => l.activityId)).toEqual([evening.id, morning.id]);

    // Undoing morning brushing leaves evening brushing completed
    const afterUndoMorning = toggleLocalHabit({
      profiles: afterEvening.profiles,
      logs: afterEvening.logs,
      childBadges: [],
      badges: [],
      activity: morning,
      childId: childA,
      date: '2026-10-24',
      today: '2026-10-24',
      logId: 'log-undo',
      completedAt: '2026-10-24T20:05:00.000Z',
    });
    expect(afterUndoMorning.kind).toBe('undone');
    expect(afterUndoMorning.profiles[0].points).toBe(5);
    expect(afterUndoMorning.logs.map((l) => l.activityId)).toEqual([evening.id]);
  });

  it('includes WIT-DLY-* habits in summarizeChildHabits graduation and star-step reduction', async () => {
    const dly01: HabitActivity = {
      ...(await toHabitActivity(getDailyLivingTemplate('WIT-DLY-01')!, familyId, { childId: childA })),
      createdAt: '2026-09-01T00:00:00.000Z',
    };
    const dates = Array.from({ length: 45 }, (_, i) => {
      const d = new Date(Date.UTC(2026, 8, 2 + i, 12));
      return d.toISOString().slice(0, 10);
    });
    const logs: ActivityLog[] = dates.map((date) => ({
      id: `log-${date}`,
      activityId: dly01.id,
      childId: childA,
      date,
      status: 'completed',
      pointsAwarded: 5,
      completedAt: `${date}T07:00:00.000Z`,
    }));
    const supportObservations = logs.map((entry) => ({
      log_id: entry.id,
      family_id: familyId,
      child_id: childA,
      activity_id: dly01.id,
      support_level: 'alone' as const,
      recorded_by: 'parent' as const,
      recorded_at: `${entry.date}T08:00:00.000Z`,
    }));
    const summary = summarizeChildHabits({
      child: { id: childA, age: 6 },
      activities: [dly01],
      logs,
      experience: {
        ...emptyExperienceState,
        cuePlans: [
          {
            family_id: familyId,
            child_id: childA,
            activity_id: dly01.id,
            cue_kind: 'event',
            cue_text: 'Sau khi thức dậy',
            cue_time: null,
            place_text: null,
            weekend_variant_text: null,
            created_at: '2026-09-01T00:00:00.000Z',
            updated_at: '2026-09-01T00:00:00.000Z',
          },
        ],
        supportObservations,
      },
      pausePeriods: [],
      today: '2026-10-18',
    });

    expect(summary.habits).toHaveLength(1);
    expect(summary.habits[0].activityId).toBe(dly01.id);
    expect(summary.habits[0].readyToGraduate).toBe(true);
    expect(nextLowerStarStep(dly01.points, dly01.basePoints)).toEqual({
      step: 50,
      points: 3,
      basePoints: 5,
    });
  });
});
