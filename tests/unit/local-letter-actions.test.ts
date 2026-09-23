import { describe, expect, it } from 'vitest';
import { emptyExperienceState } from '@/lib/experience-state';
import { markLocalLetterRead, openLocalLetter } from '@/lib/store/local-letter-actions';

const familyId = '00000000-0000-4000-8000-000000000001';
const childId = '00000000-0000-4000-8000-000000000002';

describe('local daily letter state', () => {
  it('creates one stable letter for a child and local date', () => {
    const opened = openLocalLetter(emptyExperienceState, familyId, childId, '2026-09-23', 'leo_1');
    const reopened = openLocalLetter(opened, familyId, childId, '2026-09-23', 'fox_1');
    expect(reopened.letters).toHaveLength(1);
    expect(reopened.letters[0]?.template_key).toBe('leo_1');
  });

  it('marks the same letter read only once', () => {
    const opened = openLocalLetter(emptyExperienceState, familyId, childId, '2026-09-23', 'leo_1');
    const read = markLocalLetterRead(opened, childId, '2026-09-23', '2026-09-23T08:00:00.000Z');
    const readAgain = markLocalLetterRead(read, childId, '2026-09-23', '2026-09-23T09:00:00.000Z');
    expect(readAgain.letters[0]?.read_at).toBe('2026-09-23T08:00:00.000Z');
  });
});
