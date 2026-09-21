import { z } from 'zod';

const uuid = z.string().uuid();

export const domainCommandSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('completeHabit'),
    activityId: uuid,
    childId: uuid,
    date: z.iso.date(),
    commandId: uuid,
  }).strict(),
  z.object({ type: z.literal('undoHabit'), logId: uuid }).strict(),
  z.object({ type: z.literal('reviewHabit'), logId: uuid, decision: z.enum(['approve', 'reject']) }).strict(),
  z.object({
    type: z.literal('redeemReward'),
    rewardId: uuid,
    childId: uuid,
    commandId: uuid,
  }).strict(),
  z.object({
    type: z.literal('transitionRedemption'),
    redemptionId: uuid,
    decision: z.enum(['approve', 'deliver', 'reject']),
  }).strict(),
]);

export type DomainCommand = z.infer<typeof domainCommandSchema>;

export const ACTIVITY_LOG_TRANSITIONS = {
  pending_approval: ['approved', 'rejected'],
  completed: [],
  approved: [],
  rejected: [],
} as const;

export const REDEMPTION_TRANSITIONS = {
  pending: ['approved', 'rejected'],
  approved: ['delivered', 'rejected'],
  delivered: [],
  rejected: [],
} as const;
