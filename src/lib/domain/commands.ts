import { z } from 'zod';

const uuid = z.string().uuid();

export const MAX_BATCH_REVIEW = 50;

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
    type: z.literal('reviewHabits'),
    logIds: z.array(uuid).min(1).max(MAX_BATCH_REVIEW),
    decision: z.enum(['approve', 'reject']),
  }).strict(),
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
  z.object({
    type: z.literal('adjustPoints'),
    childId: uuid,
    amount: z.number().int().min(-1000).max(1000).refine((value) => value !== 0),
    reason: z.string().trim().max(120),
    commandId: uuid,
  }).strict(),
]);

export type DomainCommand = z.infer<typeof domainCommandSchema>;

export const childDomainCommandSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('completeHabit'),
    activityId: uuid,
    date: z.iso.date(),
    commandId: uuid,
  }).strict(),
  z.object({ type: z.literal('undoHabit'), logId: uuid }).strict(),
  z.object({
    type: z.literal('redeemReward'),
    rewardId: uuid,
    commandId: uuid,
  }).strict(),
]);

export type ChildDomainCommand = z.infer<typeof childDomainCommandSchema>;

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
