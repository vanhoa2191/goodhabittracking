import type { JourneyPlan, Language } from '@/types';
import { translatedJourneyHabits } from './journey-content-translations';

type HabitText = { title: string; description: string };

const englishHabits: Record<string, HabitText[]> = {
  'week-1': [
    { title: 'Kind smile: Greet family warmly', description: 'Smile and greet grandparents and parents each morning.' },
    { title: 'Brush teeth for two minutes, morning and night', description: 'Keep teeth clean and fresh before school.' },
    { title: 'Invite the family to eat before the meal', description: 'Politely invite grandparents and parents to join the meal.' },
    { title: 'Go to bed on time before 9:30 PM', description: 'Keep the bedtime promise and rest early for a healthy tomorrow.' },
  ],
  'week-2': [
    { title: 'Wash both hands with soap before eating', description: 'Clean away germs before every meal.' },
    { title: 'Sit properly and eat without a phone or TV', description: 'Focus on the food and talk with the family.' },
    { title: 'Eat neatly and finish the vegetables', description: 'Try every food and keep the table clean.' },
    { title: 'Put dishes in the sink after eating', description: 'Build independence by cleaning up after the meal.' },
  ],
  'week-3': [
    { title: 'Make the bed neatly', description: 'Take responsibility for keeping the bedroom tidy.' },
    { title: 'Put toys neatly in the basket after play', description: 'Keep toys from being left around.' },
    { title: 'Help wipe the dining table after the meal', description: 'Help keep the family home clean.' },
    { title: 'Share three things you are grateful for before bed', description: 'Notice the good things received during the day.' },
  ],
  'week-4': [
    { title: 'Read an enriching book for 15 minutes', description: 'Read useful books that broaden understanding.' },
    { title: 'Complete homework independently', description: 'Study without waiting for reminders.' },
    { title: 'Share one meaningful lesson from the day', description: 'Reflect on a lesson and tell it to your parents.' },
    { title: 'Practice music or drawing for 20 minutes', description: 'Persevere and finish the practice.' },
  ],
  'month-1': [
    { title: 'Brush teeth for two minutes, morning and night', description: 'Keep teeth clean and fresh.' },
    { title: 'Make the bed neatly', description: 'Fold the blanket and arrange the pillows after waking.' },
    { title: 'Wash hands and invite the family to eat', description: 'Practice polite table manners.' },
    { title: 'Eat without screens and finish the vegetables', description: 'Protect the stomach and eyes.' },
    { title: 'Put dishes in the sink', description: 'Practice taking care of personal tasks.' },
    { title: 'Go to bed before 9:30 PM', description: 'Support healthy growth with enough sleep.' },
  ],
  'month-2': [
    { title: 'Kind smile: Greet family warmly', description: 'Start the day with a smile.' },
    { title: 'Encouraging words: Offer praise and thanks', description: 'Use kind words that build confidence.' },
    { title: 'Tolerance: Forgive a friend’s mistake', description: 'Let go of anger and get along cheerfully.' },
    { title: 'Helpful hands: Help parents with housework', description: 'Support the family through practical action.' },
    { title: 'Gratitude: Share three appreciations each night', description: 'Nurture a daily habit of gratitude.' },
  ],
  'month-3': [
    { title: 'Respect: Greet adults politely', description: 'Show good manners to adults.' },
    { title: 'Kindness: Share something delicious', description: 'Think about the needs of others.' },
    { title: 'Wisdom: Ask thoughtful questions and explore', description: 'Explore science with curiosity and creativity.' },
    { title: 'Responsibility: Complete assigned work', description: 'Work carefully and do not leave tasks unfinished.' },
    { title: 'Trustworthiness: Keep promises and be punctual', description: 'Build trust through small daily actions.' },
  ],
  'month-4': [
    { title: 'Read an enriching book for 20 minutes', description: 'Expand the horizon of knowledge.' },
    { title: 'Complete homework independently', description: 'Study without needing reminders.' },
    { title: 'Daily insight: Share one new realization', description: 'Reflect on one lesson for personal growth each day.' },
    { title: 'Admit mistakes and make sincere changes', description: 'Grow through honesty and courage.' },
    { title: 'Courage to change: Leave one poor habit behind', description: 'Commit to change and become better.' },
  ],
};

export function getJourneyHabitText(plan: JourneyPlan, habitIndex: number, language: Language): HabitText {
  const habit = plan.habits[habitIndex];
  if (language === 'vi') return { title: habit.title, description: habit.description };
  if (language === 'en') {
    return englishHabits[plan.id]?.[habitIndex] ?? { title: habit.title, description: habit.description };
  }
  return translatedJourneyHabits[language]?.[plan.id]?.[habitIndex]
    ?? englishHabits[plan.id]?.[habitIndex]
    ?? { title: habit.title, description: habit.description };
}
