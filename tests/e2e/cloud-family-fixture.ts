import { loadEnvConfig } from '@next/env';
import type { Page } from '@playwright/test';

loadEnvConfig(process.cwd());

export const cloudFamilyIds = {
  user: '22222222-2222-4222-8222-222222222222',
  family: '33333333-3333-4333-8333-333333333333',
  child: '44444444-4444-4444-8444-444444444444',
  activity: '55555555-5555-4555-8555-555555555555',
} as const;

type CloudFamilyFixtureOptions = {
  readonly profiles?: readonly Record<string, unknown>[];
  readonly activities?: readonly Record<string, unknown>[];
  readonly rewards?: readonly Record<string, unknown>[];
};

const createdAt = '2026-09-20T00:00:00.000Z';

export const defaultCloudProfile = {
  id: cloudFamilyIds.child,
  family_id: cloudFamilyIds.family,
  name: 'Bé Cloud',
  nickname: null,
  show_real_name_on_leaderboard: false,
  is_public_on_leaderboard: true,
  avatar: 'mascot:leo',
  theme_color: '#3B82F6',
  points: 120,
  total_earned: 120,
  level: 2,
  streak: 3,
  birth_year: 2018,
  age_stage: '6-12',
  last_active_date: null,
  league_tier: 'bronze',
  created_at: createdAt,
} as const;

export const defaultCloudActivity = {
  id: cloudFamilyIds.activity,
  family_id: cloudFamilyIds.family,
  child_id: cloudFamilyIds.child,
  title: 'Thói quen buổi sáng',
  description: 'Bắt đầu ngày mới thật vui.',
  instructions: 'Mỉm cười và chào người thân.',
  icon: '🌞',
  category: 'kindness',
  points: 10,
  recurrence_type: 'daily',
  recurrence_days: [],
  time_of_day: 'morning',
  duration_minutes: 5,
  requires_approval: false,
  is_active: true,
  target_age_stage: 'all',
  is_parent_role: false,
  portrait16_key: null,
  bo_thi7_key: null,
  framework_habit_id: null,
  framework_content_version: null,
  legacy_template_id: null,
  journey_habit_key: null,
  created_at: createdAt,
} as const;

export async function installCloudFamilyFixture(
  page: Page,
  baseURL: string | undefined,
  options: CloudFamilyFixtureOptions = {},
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required for the cloud E2E fixture.');
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  if (!projectRef) throw new Error('Supabase project reference is unavailable.');

  const user = {
    id: cloudFamilyIds.user,
    aud: 'authenticated',
    role: 'authenticated',
    email: 'parent@example.test',
    app_metadata: {},
    user_metadata: {},
    created_at: createdAt,
  };
  const session = {
    access_token: 'synthetic-access-token',
    refresh_token: 'synthetic-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user,
  };

  await page.context().addCookies([{
    name: `sb-${projectRef}-auth-token`,
    value: `base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`,
    url: new URL(baseURL ?? 'http://127.0.0.1:3000').origin,
  }]);
  await page.route('**/auth/v1/user', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(user),
  }));
  await page.route('**/rest/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    let payload: unknown = [];
    if (path.endsWith('/family_memberships')) payload = { family_id: cloudFamilyIds.family };
    else if (path.endsWith('/child_profiles')) payload = options.profiles ?? [defaultCloudProfile];
    else if (path.endsWith('/habit_activities')) payload = options.activities ?? [];
    else if (path.endsWith('/rewards')) payload = options.rewards ?? [];
    else if (path.endsWith('/user_subscriptions')) {
      payload = { plan: 'trial', status: 'active', trial_ends_at: '2026-10-04T00:00:00.000Z', subscription_ends_at: null };
    } else if (path.endsWith('/family_engagement_settings')) payload = null;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
  });
}
