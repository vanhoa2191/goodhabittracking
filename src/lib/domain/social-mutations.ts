import { z } from 'zod';

const childIdSchema = z.string().uuid();
const groupIdSchema = z.string().uuid();
const rewardTypeSchema = z.enum(['badge', 'stars', 'mystery_box', 'custom']);

const groupFieldsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  icon: z.string().min(1).max(16),
  createdByChildId: childIdSchema.optional(),
  weeklyTargetPoints: z.number().int().min(0).max(1_000_000),
  rewardType: rewardTypeSchema,
  customRewardText: z.string().trim().max(500).optional(),
}).strict();

export const socialMutationSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('createGroup'), group: groupFieldsSchema }).strict(),
  z.object({
    type: z.literal('joinGroup'),
    inviteCode: z.string().trim().min(6).max(32),
    childId: childIdSchema,
  }).strict(),
  z.object({
    type: z.literal('updateGroupReward'),
    groupId: groupIdSchema,
    rewardType: rewardTypeSchema,
    customRewardText: z.string().trim().max(500).optional(),
  }).strict(),
  z.object({
    type: z.literal('sendKudo'),
    fromChildId: childIdSchema,
    toChildId: childIdSchema,
    emoji: z.string().min(1).max(16),
  }).strict().refine(
    (mutation) => mutation.fromChildId !== mutation.toChildId,
    { message: 'A child cannot send a kudo to themselves.' },
  ),
]);

export type SocialMutation = z.infer<typeof socialMutationSchema>;
