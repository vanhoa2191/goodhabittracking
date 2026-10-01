import type { JourneyPlan, Language } from '@/types';

type HabitText = { title: string; description: string };

// Vietnamese is the authored text; every other language reads the English text, as the programme and
// framework copy do, until a language has its own translation.
export function getJourneyHabitText(plan: JourneyPlan, habitIndex: number, language: Language): HabitText {
  const habit = plan.habits[habitIndex];
  if (language === 'vi') return { title: habit.title, description: habit.description };
  return habit.en ?? { title: habit.title, description: habit.description };
}
