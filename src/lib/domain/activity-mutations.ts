import { z } from 'zod';

const activityCategorySchema = z.enum([
  'wisdom',
  'mindset',
  'personality',
  'virtue',
  'capacity',
  'giving',
  'nutrition',
  'physical',
  'study',
  'chores',
  'health',
  'selfcare',
  'kindness',
]);
const recurrenceTypeSchema = z.enum(['daily', 'weekdays', 'weekends', 'custom']);
const timeOfDaySchema = z.enum(['morning', 'afternoon', 'evening', 'anytime']);
const ageStageSchema = z.enum(['0-3', '3-6', '6-12', '12-18', 'all']);
const givingKeySchema = z.enum(['nhan', 'nhan_mat', 'ngon', 'tam', 'phong', 'than', 'toa']);
const optionalInstructionsSchema = z.string()
  .trim()
  .max(2000)
  .transform((value) => value || undefined)
  .optional();

const mutableActivityFieldsSchema = z.object({
  childId: z.string().uuid().nullable(),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).optional(),
  instructions: optionalInstructionsSchema,
  icon: z.string().min(1).max(16),
  category: activityCategorySchema,
  points: z.number().int().min(0).max(10000),
  recurrenceType: recurrenceTypeSchema,
  recurrenceDays: z.array(z.number().int().min(0).max(6)).max(7),
  timeOfDay: timeOfDaySchema,
  durationMinutes: z.number().int().min(0).max(1440).optional(),
  requiresApproval: z.boolean(),
  isActive: z.boolean(),
  targetAgeStage: ageStageSchema.optional(),
  isParentRole: z.boolean().optional(),
  portrait16Key: z.string().trim().min(1).max(100).optional(),
  boThi7Key: givingKeySchema.optional(),
  frameworkHabitId: z.string().regex(/^GD[1-5]-(NT|SK|MQH|HT|TC)-\d{2}$/).optional(),
  frameworkContentVersion: z.string().trim().min(1).max(40).optional(),
}).strict();

const activitySchema = mutableActivityFieldsSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
}).strict();

const activityUpdatesSchema = mutableActivityFieldsSchema.partial().refine(
  (updates) => Object.keys(updates).length > 0,
  { message: 'At least one activity field is required.' },
);

export const activityMutationSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('create'), activity: activitySchema }).strict(),
  z.object({
    type: z.literal('createMany'),
    activities: z.array(activitySchema).min(1).max(50),
  }).strict(),
  z.object({
    type: z.literal('update'),
    activityId: z.string().uuid(),
    updates: activityUpdatesSchema,
  }).strict(),
  z.object({ type: z.literal('delete'), activityId: z.string().uuid() }).strict(),
]);

export type ActivityMutation = z.infer<typeof activityMutationSchema>;
