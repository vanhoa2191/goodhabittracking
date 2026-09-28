import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  adminAuthorizationResponse,
  adminJsonResponse,
  authorizeAdmin,
} from '@/lib/auth/admin-access';
import { recordAdminAudit } from '@/lib/auth/admin-audit-server';
import { createCorrelationId } from '@/lib/observability/logger';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

const roles = ['finance', 'super_admin'] as const;

export async function GET() {
  const correlationId = createCorrelationId();
  const access = await authorizeAdmin({ roles });
  if (!access.authorized) return adminAuthorizationResponse(access, correlationId);
  const { data, error } = await createAdminSupabaseClient()
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });
  return error
    ? adminJsonResponse({ error: 'Could not load coupons.', correlationId }, correlationId, 503)
    : adminJsonResponse({ coupons: data, correlationId }, correlationId);
}

const schema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,32}$/),
  description: z.string().trim().max(200),
  discountPercent: z.number().int().min(1).max(100).nullable(),
  bonusDays: z.number().int().min(1).max(3650).nullable(),
  maxRedemptions: z.number().int().positive().nullable(),
  expiresAt: z.string().datetime().nullable(),
  active: z.boolean(),
  reason: z.string().trim().min(5).max(500),
}).strict().refine((value) => value.discountPercent !== null || value.bonusDays !== null);

export async function POST(request: NextRequest) {
  const correlationId = createCorrelationId();
  const access = await authorizeAdmin({ roles, requireAal2: true });
  if (!access.authorized) return adminAuthorizationResponse(access, correlationId);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return adminJsonResponse({ error: 'Invalid coupon.', correlationId }, correlationId, 400);

  const value = parsed.data;
  const admin = createAdminSupabaseClient();
  const { data: current, error: currentError } = await admin
    .from('coupons')
    .select('id,active,discount_percent,bonus_days,max_redemptions,expires_at')
    .eq('code', value.code)
    .maybeSingle();
  if (currentError) return adminJsonResponse({ error: 'Could not inspect coupon.', correlationId }, correlationId, 503);
  const targetId = current?.id ?? crypto.randomUUID();
  const before = current
    ? {
      active: current.active,
      discountPercent: current.discount_percent,
      bonusDays: current.bonus_days,
      maxRedemptions: current.max_redemptions,
      expiresAt: current.expires_at,
    }
    : {};
  const after = {
    active: value.active,
    discountPercent: value.discountPercent,
    bonusDays: value.bonusDays,
    maxRedemptions: value.maxRedemptions,
    expiresAt: value.expiresAt,
  };
  const audit = {
    actor: access,
    action: current ? 'coupon.update' : 'coupon.create',
    targetType: 'coupon',
    targetId,
    before,
    after,
    reason: value.reason,
    correlationId,
  } as const;
  if (!await recordAdminAudit(admin, { ...audit, outcome: 'attempted' })) {
    return adminJsonResponse({ error: 'Could not record the admin action.', correlationId }, correlationId, 503);
  }

  const fields = {
    description: value.description || null,
    discount_percent: value.discountPercent,
    bonus_days: value.bonusDays,
    max_redemptions: value.maxRedemptions,
    expires_at: value.expiresAt,
    active: value.active,
    updated_at: new Date().toISOString(),
  };
  const mutation = current
    ? admin.from('coupons').update(fields).eq('id', current.id)
    : admin.from('coupons').insert({
      id: targetId,
      code: value.code,
      ...fields,
      created_by: access.user.id,
    });
  const { error } = await mutation;
  await recordAdminAudit(admin, { ...audit, outcome: error ? 'failed' : 'succeeded' });
  return error
    ? adminJsonResponse({ error: 'Could not save coupon.', correlationId }, correlationId, 503)
    : adminJsonResponse({ success: true, correlationId }, correlationId);
}
