import { describe, expect, it } from 'vitest';
import { getOnboardingWizardCopy } from '@/lib/i18n/onboarding-wizard-copy';
import { MEANINGFUL_REWARD_TEMPLATES } from '@/lib/reward-templates';
import type { Language } from '@/types';

const LANGUAGES: readonly Language[] = ['vi', 'en', 'zh', 'ja', 'ko', 'fr', 'de', 'it', 'es'];
const REWARD_IDS = ['experience-bedtime-story', 'experience-meal-choice', 'experience-parent-time'] as const;

function stringLeaves(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(stringLeaves);
  if (value && typeof value === 'object') return Object.values(value).flatMap(stringLeaves);
  return [];
}

describe('getOnboardingWizardCopy', () => {
  it.each(LANGUAGES)('%s has non-empty strings and working formatters', (language) => {
    const copy = getOnboardingWizardCopy(language);
    const leaves = stringLeaves(copy);
    expect(leaves.length).toBeGreaterThan(40);
    for (const leaf of leaves) expect(leaf.trim()).not.toBe('');
    expect(copy.handoff.ownDeviceSteps).toHaveLength(3);
    for (const id of REWARD_IDS) {
      expect(copy.rewardTitles[id].title.trim()).not.toBe('');
      expect(copy.rewardTitles[id].description.trim()).not.toBe('');
    }
    expect(copy.stepOf(2, 5)).toMatch(/2/);
    expect(copy.stepOf(2, 5)).toMatch(/5/);
    for (const text of [copy.rewards.estimate(30, 40, 2)]) {
      expect(text).toContain('30');
      expect(text).toContain('40');
      expect(text).toContain('2');
    }
    expect(copy.habits.counter(3, 2)).toMatch(/3/);
    expect(copy.habits.counter(3, 2)).toMatch(/2/);
    const summary = copy.confirm.summary('An', 7, 4, 2);
    for (const part of ['An', '7', '4', '2']) expect(summary).toContain(part);
  });

  it('keeps the agreed Vietnamese wording', () => {
    const copy = getOnboardingWizardCopy('vi');
    expect(copy.next).toBe('Tiếp tục');
    expect(copy.habits.approval).toBe('Ba mẹ duyệt');
    expect(copy.handoff.toDashboard).toBe('Vào bảng phụ huynh');
    expect(copy.stepOf(2, 5)).toBe('Bước 2/5');
    expect(copy.confirm.summary('An', 7, 4, 2)).toBe('An, 7 tuổi · 4 thói quen · 2 quà');
    expect(copy.handoff.ownDeviceSteps[1]).toBe('Chọn “Đây là thiết bị của bé?”.');
  });

  it('uses the meaningful reward templates verbatim for Vietnamese reward titles', () => {
    const copy = getOnboardingWizardCopy('vi');
    for (const id of REWARD_IDS) {
      const template = MEANINGFUL_REWARD_TEMPLATES.find((item) => item.id === id);
      expect(template).toBeDefined();
      expect(copy.rewardTitles[id]).toEqual({ title: template!.title, description: template!.description });
    }
  });

  it('keeps the ? and → symbols in every language', () => {
    for (const language of LANGUAGES) {
      const copy = getOnboardingWizardCopy(language);
      expect(copy.rewards.flow).toContain('→');
      expect(copy.handoff.finalExplain).toContain('→');
      expect(copy.handoff.finalExplain).toContain('?');
      expect(copy.handoff.codeError).toContain('→');
      expect(copy.rewards.estimate(30, 40, 2)).toContain('→');
      expect(copy.handoff.rewardsFailed).toContain('→');
    }
  });
});
