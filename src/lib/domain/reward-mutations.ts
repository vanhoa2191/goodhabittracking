import { z } from 'zod';

const mutableRewardFieldsSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).optional(),
  icon: z.string().min(1).max(16),
  costPoints: z.number().int().min(1).max(1_000_000),
  stock: z.number().int().min(-1).max(1_000_000),
  isActive: z.boolean(),
}).strict();

const rewardSchema = mutableRewardFieldsSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
}).strict();

const rewardUpdatesSchema = mutableRewardFieldsSchema.partial().refine(
  (updates) => Object.keys(updates).length > 0,
  { message: 'At least one reward field is required.' },
);

export const rewardMutationSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('create'), reward: rewardSchema }).strict(),
  z.object({
    type: z.literal('update'),
    rewardId: z.string().uuid(),
    updates: rewardUpdatesSchema,
  }).strict(),
  z.object({ type: z.literal('delete'), rewardId: z.string().uuid() }).strict(),
]);

export type RewardMutation = z.infer<typeof rewardMutationSchema>;
