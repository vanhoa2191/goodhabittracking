import { describe, expect, it } from 'vitest';
import { MEANINGFUL_REWARD_TEMPLATES } from '@/lib/reward-templates';

describe('meaningful reward templates', () => {
  it('offers both non-material and material rewards', () => {
    // Given / When
    const kinds = new Set(MEANINGFUL_REWARD_TEMPLATES.map((reward) => reward.kind));

    // Then
    expect(kinds).toEqual(new Set(['experience', 'material']));
  });

  it('prioritizes connection and experience over objects', () => {
    // Given / When
    const experienceCount = MEANINGFUL_REWARD_TEMPLATES.filter(
      (reward) => reward.kind === 'experience',
    ).length;
    const materialCount = MEANINGFUL_REWARD_TEMPLATES.filter(
      (reward) => reward.kind === 'material',
    ).length;

    // Then
    expect(experienceCount).toBeGreaterThan(materialCount);
  });

  it('keeps every suggestion ready to add as a real reward', () => {
    // Given / When
    const invalid = MEANINGFUL_REWARD_TEMPLATES.filter((reward) =>
      reward.title.length === 0
      || reward.description.length === 0
      || reward.costPoints < 5,
    );

    // Then
    expect(invalid).toEqual([]);
  });
});
