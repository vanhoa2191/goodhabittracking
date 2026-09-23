import type { ExperienceState } from '@/lib/experience-state';

export function openLocalLetter(
  state: ExperienceState,
  familyId: string,
  childId: string,
  date: string,
  templateKey: string,
): ExperienceState {
  if (state.letters.some((letter) => letter.child_id === childId && letter.local_date === date)) return state;
  return {
    ...state,
    letters: [...state.letters, {
      family_id: familyId,
      child_id: childId,
      local_date: date,
      template_key: templateKey,
      read_at: null,
    }],
  };
}

export function markLocalLetterRead(
  state: ExperienceState,
  childId: string,
  date: string,
  readAt: string,
): ExperienceState {
  return {
    ...state,
    letters: state.letters.map((letter) => (
      letter.child_id === childId && letter.local_date === date && letter.read_at === null
        ? { ...letter, read_at: readAt }
        : letter
    )),
  };
}
