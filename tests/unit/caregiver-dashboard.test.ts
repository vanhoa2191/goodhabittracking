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
    expect(html).toContain(getCaregiverCopy('en').dashApproved(7));
    expect(html).toContain('Shared habit');
    expect(html).toContain('Shared description');
    expect(html).toContain('Read');
    expect(html).not.toContain('Other child habit');
    expect(html).not.toContain('Private');
    expect(html).not.toContain('<button');
  });

  it('shows the empty state after a failed or cleared projection, ignoring cached manager data', () => {
    const html = renderToStaticMarkup(createElement(CaregiverDashboard));
    expect(html).toContain(getCaregiverCopy('en').dashEmpty);
    expect(html).not.toContain('Private');
  });
});
