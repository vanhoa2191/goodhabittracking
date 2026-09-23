import { describe, expect, it } from 'vitest';
import { emptyExperienceState, parseExperienceState } from '@/lib/experience-state';

const familyA = '11111111-1111-4111-8111-111111111111';
const familyB = '22222222-2222-4222-8222-222222222222';
const childId = '33333333-3333-4333-8333-333333333333';

describe('experience state boundary', () => {
  it('accepts absent child records for an existing family', () => {
    expect(parseExperienceState(emptyExperienceState, familyA)).toEqual(emptyExperienceState);
  });

  it('rejects a row from another family before hydration', () => {
    expect(() => parseExperienceState({
      ...emptyExperienceState,
      children: [{ family_id: familyB, child_id: childId, mascot_selected_at: null }],
    }, familyA)).toThrow();
  });
});
