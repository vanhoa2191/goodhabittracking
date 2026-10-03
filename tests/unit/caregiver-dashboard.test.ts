import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CaregiverDashboard } from '@/components/CaregiverDashboard';
import { getCaregiverCopy } from '@/lib/i18n/caregiver-copy';
import type { CaregiverProgress } from '@/lib/store/caregiver-progress';

const state = vi.hoisted(() => ({ caregiverProgress: null as CaregiverProgress | null }));
vi.mock('@/lib/store', () => ({ useAppStore: () => ({
  caregiverProgress: state.caregiverProgress,
  profiles: [{ id: 'stale', name: 'Private manager profile' }],
  activities: [{ title: 'Private manager habit' }],
  logs: [{ status: 'completed', proofNote: 'Private proof' }],
}) }));
vi.mock('@/lib/i18n/context', () => ({ useTranslation: () => ({ language: 'en' }) }));

beforeEach(() => { state.caregiverProgress = null; });

describe('caregiver dashboard', () => {
  it('renders the projection and aggregate counts independently of manager rows', () => {
    state.caregiverProgress = {
      familyId: 'family', familyRole: 'caregiver',
      profiles: [{ id: 'child', name: 'Bin', avatar: 'mascot:leo', theme_color: 'indigo' }],
      activities: [
        { id: 'shared', child_id: null, title: 'Shared habit', description: 'Shared description' },
        { id: 'own', child_id: 'child', title: 'Read', description: null },
        { id: 'other', child_id: 'other-child', title: 'Other child habit', description: null },
      ],
      completionCounts: [{ child_id: 'child', count: 7 }],
    };
    const html = renderToStaticMarkup(createElement(CaregiverDashboard));
    expect(html).toContain('Bin');
    expect(html).toContain(getCaregiverCopy('en').dashAllTime(7));
    expect(html).not.toContain('role="progressbar"');
    expect(html).not.toContain(getCaregiverCopy('en').dashTodayNone);
    expect(html).toContain('Shared habit');
    expect(html).toContain('Shared description');
    expect(html).toContain('Read');
    expect(html).not.toContain('Other child habit');
    expect(html).not.toContain('Private');
    expect(html).not.toContain('<button');
  });

  const daily = (activities: CaregiverProgress['activities'], counts: { child_id: string; day: string; count: number }[]): CaregiverProgress => ({
    familyId: 'family', familyRole: 'caregiver',
    profiles: [{ id: 'child', name: 'Bin', avatar: 'mascot:leo', theme_color: 'indigo' }],
    activities,
    completionCounts: [{ child_id: 'child', count: 162 }],
    // 2026-10-03 is a Saturday.
    daily: { from: '2026-09-27', to: '2026-10-03', counts },
  });
  const copy = getCaregiverCopy('en');

  it("shows today's progress, the week and the all-time count as a separate, lesser figure", () => {
    state.caregiverProgress = daily([
      { id: 'a', child_id: null, title: 'Read', description: null, recurrence_type: 'daily', recurrence_days: [] },
      { id: 'b', child_id: 'child', title: 'Tidy', description: null, recurrence_type: 'daily', recurrence_days: [] },
    ], [{ child_id: 'child', day: '2026-10-03', count: 1 }, { child_id: 'child', day: '2026-10-02', count: 2 }]);
    const html = renderToStaticMarkup(createElement(CaregiverDashboard));
    expect(html).toContain(copy.dashToday(1, 2));
    expect(html).toContain(copy.dashWeek(3, 14));
    expect(html).toContain(copy.dashAllTime(162));
    expect(html.match(/role="progressbar"/g)).toHaveLength(2);
    // The bar is named by its sentence, not only drawn in a colour.
    expect(html).toContain(`aria-label="${copy.dashToday(1, 2)}"`);
    expect(html).toContain('aria-valuenow="1"');
    expect(html).toContain('aria-valuemax="2"');
    expect(html).toContain('width:50%');
  });

  it('says there is nothing scheduled instead of 0 of 0 when no habit is due today', () => {
    state.caregiverProgress = daily([
      { id: 'a', child_id: null, title: 'School bag', description: null, recurrence_type: 'weekdays', recurrence_days: [] },
    ], [{ child_id: 'child', day: '2026-10-02', count: 1 }]);
    const html = renderToStaticMarkup(createElement(CaregiverDashboard));
    expect(html).toContain(copy.dashTodayNone);
    expect(html).not.toContain(copy.dashToday(0, 0));
    expect(html).toContain(copy.dashWeek(1, 5));
    expect(html.match(/role="progressbar"/g)).toHaveLength(1);
  });

  it('says nothing is scheduled for the week when the child has no habits', () => {
    state.caregiverProgress = daily([], []);
    const html = renderToStaticMarkup(createElement(CaregiverDashboard));
    expect(html).toContain(copy.dashTodayNone);
    expect(html).toContain(copy.dashWeekNone);
    expect(html).not.toContain('role="progressbar"');
    expect(html).toContain(copy.dashAllTime(162));
  });

  it('keeps showing the rest of the child when the daily part is missing', () => {
    state.caregiverProgress = { ...daily([], []), daily: undefined };
    const html = renderToStaticMarkup(createElement(CaregiverDashboard));
    expect(html).toContain('Bin');
    expect(html).toContain(copy.dashAllTime(162));
    expect(html).not.toContain('role="progressbar"');
  });

  it('shows the empty state after a failed or cleared projection, ignoring cached manager data', () => {
    const html = renderToStaticMarkup(createElement(CaregiverDashboard));
    expect(html).toContain(getCaregiverCopy('en').dashEmpty);
    expect(html).not.toContain('Private');
  });
});
