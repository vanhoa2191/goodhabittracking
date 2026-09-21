import { z } from 'zod';

export const paidPlanSchema = z.enum(['monthly', 'yearly', 'lifetime']);

export const createPaymentRequestSchema = z
  .object({
    planId: paidPlanSchema,
  })
  .strict();

export const paymentStatusRequestSchema = z
  .object({
    orderCode: z.coerce.number().int().positive(),
  })
  .strict();

export const payOSWebhookSchema = z
  .object({
    code: z.string(),
    desc: z.string(),
    success: z.boolean().optional(),
    signature: z.string().min(1),
    data: z
      .object({
        orderCode: z.number().int().positive(),
        amount: z.number().int().positive(),
        description: z.string().min(1),
        accountNumber: z.string().optional().default(''),
        reference: z.string().min(1),
        transactionDateTime: z.string().optional().default(''),
        currency: z.string().optional().default('VND'),
        paymentLinkId: z.string().optional().default(''),
        code: z.string(),
        desc: z.string(),
        counterAccountBankId: z.string().optional().default(''),
        counterAccountBankName: z.string().optional().default(''),
        counterAccountName: z.string().optional().default(''),
        counterAccountNumber: z.string().optional().default(''),
        virtualAccountName: z.string().optional().default(''),
        virtualAccountNumber: z.string().optional().default(''),
      })
      .passthrough(),
  })
  .strict();

export type PaidPlan = z.infer<typeof paidPlanSchema>;
export type PayOSWebhook = z.infer<typeof payOSWebhookSchema>;
