import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrintSheet } from '@/components/PrintableWeek';
import { buildWeekSheet } from '@/lib/week-sheet';
import type { ActivityLog, HabitActivity } from '@/types';

const habit: HabitActivity = {
  id: 'a1', childId: null, title: 'Đánh răng', description: '', icon: '🪥', category: 'health', points: 10,
  recurrenceType: 'weekdays', recurrenceDays: [1, 2, 3, 4, 5], timeOfDay: 'morning', durationMinutes: 2,
  requiresApproval: false, isActive: true, createdAt: '2026-09-01T00:00:00.000Z',
};
const log: ActivityLog = {
  id: 'l1', activityId: 'a1', childId: 'c1', date: '2026-09-29', status: 'completed', pointsAwarded: 10, completedAt: '2026-09-29T07:00:00.000Z',
};

function render(mode: 'chart' | 'report', language: 'vi' | 'en' = 'vi') {
  const sheet = buildWeekSheet({ activities: [habit], logs: [log], childId: 'c1', today: new Date(2026, 8, 30) });
  return renderToStaticMarkup(createElement(PrintSheet, { sheet, mode, childName: 'Bé An', language }));
}

describe('printable week', () => {
  it('prints an empty chart with boxes to tick and no points column', () => {
    const html = render('chart');
    expect(html).toContain('Bảng thói quen tuần');
    expect(html).toContain('Bé An');
    expect(html).toContain('🪥 Đánh răng');
    expect(html.match(/☐/g)).toHaveLength(5);
    expect(html).not.toContain('✓');
    expect(html).not.toContain('<th scope="col">Điểm</th>');
    expect(html.match(/–<\/td>/g)).toHaveLength(2);
  });

  it('prints the week so far with ticks, points and a summary', () => {
    const html = render('report');
    expect(html).toContain('Báo cáo tuần');
    expect(html.match(/✓/g)).toHaveLength(1);
    expect(html).toContain('<th scope="col">Điểm</th>');
    expect(html).toContain('Đã làm 1/5 lượt trong tuần · 10 điểm');
  });

  it('speaks the language of the family', () => {
    expect(render('report', 'en')).toContain('1 of 5 done this week · 10 points');
  });

  it('marks columns and rows for assistive technology', () => {
    const html = render('chart');
    expect(html).toContain('scope="col"');
    expect(html).toContain('scope="row"');
  });
});
