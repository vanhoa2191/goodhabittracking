import { z } from 'zod';
import frameworkData from '@/data/habit-framework-v1.vi.json';
import type { ActivityCategory, AgeStage, HabitActivity } from '@/types';

const frameworkStageIdSchema = z.enum(['GD1', 'GD2', 'GD3', 'GD4', 'GD5']);
const frameworkDomainSchema = z.enum(['NT', 'SK', 'MQH', 'HT', 'TC']);

const frameworkDataSchema = z.strictObject({
  schemaVersion: z.literal('1.0.0'),
  contentVersion: z.string().min(1),
  language: z.literal('vi'),
  source: z.strictObject({
    file: z.string().min(1),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
  }),
  review: z.strictObject({
    structureStatus: z.literal('approved'),
    approvalBasis: z.literal('user-directed'),
    evidenceStatus: z.literal('source-only'),
    recordedAt: z.iso.date(),
  }),
  stages: z.array(z.strictObject({
    id: frameworkStageIdSchema,
    ageRange: z.enum(['0-3', '3-6', '6-12', '12-15', '15-18']),
    title: z.string().min(1),
    adultRole: z.string().min(1),
  })).length(5),
  habits: z.array(z.strictObject({
    id: z.string().regex(/^GD[1-5]-(NT|SK|MQH|HT|TC)-\d{2}$/),
    sourceAliases: z.array(z.string()),
    stageId: frameworkStageIdSchema,
    ageRange: z.enum(['0-3', '3-6', '6-12', '12-15', '15-18']),
    primaryDomain: frameworkDomainSchema,
    name: z.string().min(1),
    childMeaning: z.string().min(1),
    successSignal: z.string().min(1),
    activities: z.array(z.string().min(1)).min(1),
    parentGuidance: z.string().min(1),
    measurement: z.string().min(1),
    conceptTags: z.array(z.string().min(1)),
  })).length(47),
});

export type FrameworkStageId = z.infer<typeof frameworkStageIdSchema>;
export type FrameworkDomain = z.infer<typeof frameworkDomainSchema>;
export type FrameworkStage = Readonly<{
  id: FrameworkStageId;
  ageRange: '0-3' | '3-6' | '6-12' | '12-15' | '15-18';
  title: string;
  adultRole: string;
}>;
export type FrameworkHabit = Readonly<{
  id: string;
  sourceAliases: readonly string[];
  stageId: FrameworkStageId;
  ageRange: FrameworkStage['ageRange'];
  primaryDomain: FrameworkDomain;
  name: string;
  childMeaning: string;
  successSignal: string;
  activities: readonly string[];
  parentGuidance: string;
  measurement: string;
  conceptTags: readonly string[];
  reviewStatus: 'source-reconciled';
  evidenceStatus: 'source-only';
}>;

const parsed = frameworkDataSchema.parse(frameworkData);

export const HABIT_FRAMEWORK_VERSION = parsed.contentVersion;
export const HABIT_FRAMEWORK_STAGES: readonly FrameworkStage[] = parsed.stages;
export const HABIT_FRAMEWORK_CATALOG: readonly FrameworkHabit[] = parsed.habits.map((habit) => ({
  ...habit,
  reviewStatus: 'source-reconciled',
  evidenceStatus: 'source-only',
}));

const CATEGORY_BY_DOMAIN: Readonly<Record<FrameworkDomain, ActivityCategory>> = {
  NT: 'mindset',
  SK: 'health',
  MQH: 'kindness',
  HT: 'study',
  TC: 'capacity',
};

const LEGACY_STAGE_BY_FRAMEWORK: Readonly<Record<FrameworkStageId, AgeStage>> = {
  GD1: '0-3',
  GD2: '3-6',
  GD3: '6-12',
  GD4: '12-18',
  GD5: '12-18',
};

export function getFrameworkHabitsByStage(
  stageId: FrameworkStageId,
): readonly FrameworkHabit[] {
  return HABIT_FRAMEWORK_CATALOG.filter((habit) => habit.stageId === stageId);
}

export function getFrameworkStageIdFromAge(age: number): FrameworkStageId {
  if (age < 3) return 'GD1';
  if (age < 6) return 'GD2';
  if (age < 12) return 'GD3';
  if (age < 15) return 'GD4';
  return 'GD5';
}

export function createActivityFromFrameworkHabit(
  habit: FrameworkHabit,
  childId: string | null,
): Omit<HabitActivity, 'id' | 'createdAt'> {
  return {
    childId,
    title: habit.name,
    description: habit.childMeaning,
    instructions: [
      ...habit.activities.slice(0, 3).map((activity, index) => `${index + 1}. ${activity}`),
      `Người lớn đồng hành: ${habit.parentGuidance}`,
    ].join('\n'),
    icon: '✓',
    category: CATEGORY_BY_DOMAIN[habit.primaryDomain],
    points: 10,
    recurrenceType: 'daily',
    recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
    timeOfDay: 'anytime',
    durationMinutes: 0,
    requiresApproval: false,
    isActive: true,
    targetAgeStage: LEGACY_STAGE_BY_FRAMEWORK[habit.stageId],
    isParentRole: habit.stageId === 'GD1',
    frameworkHabitId: habit.id,
    frameworkContentVersion: HABIT_FRAMEWORK_VERSION,
  };
}
