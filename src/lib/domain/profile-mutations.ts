import { z } from 'zod';
import { activityMutationSchema } from './activity-mutations';

const ageStageSchema = z.enum(['0-3', '3-6', '6-12', '12-18']);
const leagueTierSchema = z.enum(['bronze', 'silver', 'gold', 'diamond']);

const editableProfileFieldsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  nickname: z.string().trim().max(120).optional(),
  showRealNameOnLeaderboard: z.boolean().optional(),
  isPublicOnLeaderboard: z.boolean().optional(),
  avatar: z.string().min(1).max(16),
  themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  birthYear: z.number().int().min(1900).max(2200).optional(),
  ageStage: ageStageSchema.optional(),
}).strict();

const profileSchema = editableProfileFieldsSchema.extend({
  id: z.string().uuid(),
  points: z.union([z.literal(0), z.literal(20)]),
  totalEarned: z.union([z.literal(0), z.literal(20)]),
  level: z.literal(1),
  streak: z.union([z.literal(0), z.literal(1)]),
  leagueTier: leagueTierSchema.optional(),
  createdAt: z.string().datetime(),
}).strict().refine(
  (profile) => profile.points === profile.totalEarned,
  { message: 'Initial points and total earned must match.' },
);

const profileUpdatesSchema = editableProfileFieldsSchema.partial().refine(
  (updates) => Object.keys(updates).length > 0,
  { message: 'At least one profile field is required.' },
);

const createdActivitySchema = activityMutationSchema.options[0].shape.activity;

export const profileMutationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('create'),
    profile: profileSchema,
    starterActivities: z.array(createdActivitySchema).max(50),
  }).strict(),
  z.object({
    type: z.literal('update'),
    profileId: z.string().uuid(),
    updates: profileUpdatesSchema,
  }).strict(),
  z.object({ type: z.literal('delete'), profileId: z.string().uuid() }).strict(),
]);

export type ProfileMutation = z.infer<typeof profileMutationSchema>;
