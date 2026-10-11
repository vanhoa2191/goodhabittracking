# AI monthly quotas and a pluggable AI provider — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the daily AI limits with monthly ones by tier, raise the system cap, and add a provider switch so DeepSeek can be turned on later without code changes. DeepSeek stays off.

**Architecture:** `family_ai_tier` returns `'plus' | 'standard' | 'free'`. A new SQL function `consume_ai_quota_monthly` counts the family's calls in the current UTC month from the existing `ai_usage` daily rows and also enforces a per-day safety cap, the system cap and the minimum gap. The handler maps tier → limits. `askModel` goes through a provider chosen by `AI_PROVIDER` (`workers` default, `deepseek` optional).

**Spec (owner, 11/10/2026):** free 10 calls/month (the 7-day trial counts as free); Solo/Pro/lifetime 20/month; Pro Plus, the AI add-on and founding families unlimited with a 100/day safety cap; system cap 5000/day via env; min gap 20 s unchanged. DeepSeek: prepare the endpoint, keep it off. Builds on `feat/addons` (PR #190); migration `202610110001` is not deployed, so it is edited in place.

## Global Constraints

- Tiers:
  - `plus`: active `pro_plus_*` subscription, active `family_addons.ai`, or a founding claim that is not revoked, still within its year **and** whose family has an active paid subscription.
  - `standard`: active `solo_monthly`, `solo_yearly`, `monthly`, `yearly` or `lifetime`.
  - `free`: everything else, including trial, free and expired plans.
- Limits (`src/lib/ai/config.ts`):
  - `AI_LIMITS.perMonth = { free: 10, standard: 20 }` (plus has no monthly limit);
  - `AI_LIMITS.perDaySafety = 100`, applied to every tier;
  - `AI_LIMITS.minSecondsBetweenCalls = 20`;
  - `AI_LIMITS.systemPerDay` = `Number(process.env.AI_SYSTEM_PER_DAY)` when it is an integer 1..100000, else `5000`.
- Refusal reasons: `family_month`, `family_day`, `system_day`, `too_fast`. A successful response returns `remainingThisMonth` (`null` for plus).
- Upsell copy (vi, exact; translate for every language):
  - free, `family_month`: `Bạn đã dùng hết 10 lượt gợi ý miễn phí tháng này. Nâng lên Pro Plus để dùng không giới hạn.` Link: `/checkout?plan=pro_plus_monthly`.
  - standard, `family_month`: `Bạn đã dùng hết 20 lượt gợi ý tháng này. Thêm Add-on AI (29.000đ/tháng) hoặc nâng lên Pro Plus để dùng không giới hạn.` Links: `/checkout?plan=ai_addon_monthly` and `/checkout?plan=pro_plus_monthly`.
  - `family_day` (any tier): `Hôm nay bạn đã dùng rất nhiều gợi ý. Quay lại vào ngày mai nhé.`
- Feature copy: Pro Plus `Gợi ý AI không giới hạn`; Solo/Pro `Gợi ý AI 20 lượt/tháng`; free/trial `10 lượt gợi ý AI miễn phí mỗi tháng`. The Add-on AI description is `Gợi ý AI không giới hạn`.
- Provider:
  - `AI_PROVIDER` is `workers` (default) or `deepseek`.
  - DeepSeek runs only when `AI_PROVIDER=deepseek` **and** `DEEPSEEK_API_KEY` is set. Otherwise it fails closed with reason `disabled`, and nothing falls back to Workers.
  - Endpoint `DEEPSEEK_BASE_URL` (default `https://api.deepseek.com`), path `/chat/completions`, model `DEEPSEEK_MODEL` (default `deepseek-chat`), OpenAI-compatible body, JSON response format, and the existing timeout.
  - A code comment and `docs/deployment.md` say: before enabling it, update CTIA (new foreign processor), the privacy notice and `AI_POLICY_VERSION`.

## Review Focus

1. **Month boundary.** Calls made on the last day of a month do not count in the next one: the month is computed in UTC, the same as `ai_usage.day`. Pinned in the SQL scenario `month_boundary`.
2. **The founding year ends.** The tier falls from plus to standard (if the family still has a paid plan), and the monthly limit applies from that call on. Pinned in `tier_after_founding`.
3. **Plus families sending many requests.** A plus family is refused at the 101st call of a day with `family_day` and is allowed again the next day. Pinned in `plus_daily_safety`.
4. **`AI_SYSTEM_PER_DAY` is garbage** (`abc`, `0`, `-5`). The system cap falls back to 5000. Pinned in the config test.
5. **`AI_PROVIDER=deepseek` without a key.** The response is `ai_disabled` and Workers AI is not called. Pinned in the provider test.

---

### Task A (codex): SQL

**Files:** `supabase/migrations/202610110001_pro_plus_and_addons.sql` (edit in place), its preflight, `tests/integration/migrations/pro-plus-and-addons.{test.ts,scenarios.sql}`, `scripts/verify-local-billing.mjs` / `verify-local-affiliate.mjs` (scenario allowlists), `supabase/schema.sql`.

**Interfaces:**
- `family_ai_tier(uuid) returns text`: `'plus' | 'standard' | 'free'`, same grants as today.
- New `consume_ai_quota_monthly(per_month integer, per_day integer, system_per_day integer, min_gap_seconds integer) returns jsonb`, same validation style as `consume_ai_quota`.
  - `per_month` may be null (no monthly limit); otherwise 1..1000. `per_day` is 1..1000.
  - It uses `current_family_id()` and `can_manage_family`, and the same `ai_usage` / `ai_system_usage` rows.
  - The month sum is `sum(calls) where family_id = … and day >= date_trunc('month', today)`.
  - The checks run in this order: system cap, month, day, gap.
  - It returns `{allowed: true, remainingThisMonth: int|null}` or `{allowed: false, reason}`.
  - Grants follow the existing pattern: authenticated, plus a `consume_ai_quota_monthly_as(actor_user_id uuid, …)` wrapper for service_role, like `consume_ai_quota_as`.
- Scenarios:
  - `tier_free_trial_standard_plus` (all tier sources, including add-on, founding and lifetime);
  - `monthly_free_10` (11th call refused `family_month`);
  - `monthly_standard_20`;
  - `month_boundary`;
  - `plus_unlimited_month` (150 calls spread over days are allowed);
  - `plus_daily_safety`;
  - `tier_after_founding`;
  - `system_cap`.

**Acceptance:** `npx vitest run tests/integration/migrations/pro-plus-and-addons.test.ts` and `EMBEDDED_POSTGRES_MODULE_PATH=/tmp/kidhabit-sql-runtime/node_modules/embedded-postgres/dist/index.js npm run test:sql` → 0.

### Task B (sonnet): handler, config, client, upsell UI, provider switch

**Files:** `src/lib/ai/config.ts`, `src/lib/ai/handler.ts`, `src/lib/ai/run.ts` (+ new `src/lib/ai/providers/{workers,deepseek,index}.ts`), `src/lib/store/ai-client.ts`, `src/components/ai/BreakdownButton.tsx`, `src/components/ai/WeeklySummaryButton.tsx`, `src/lib/i18n/ai-copy.ts`, `.env.example`, tests (`tests/api/ai-routes.test.ts`, `tests/unit/ai-client.test.ts`, `tests/unit/ai-quota-ui.test.ts`, new `tests/unit/ai-config.test.ts`, new `tests/unit/ai-providers.test.ts`).

**Interfaces:**
- The handler calls `consume_ai_quota_monthly` through the same service-role wrapper path as today. The limits come from the tier: plus → `per_month: null`, standard → 20, free → 10, with `per_day: 100` for all.
- The 429 body carries `{ code: 'ai_quota', reason, tier }` with `tier` in `'plus' | 'standard' | 'free'`. The client keeps `reason` and `tier` (anything else → undefined).
- `AiProvider = { name: 'workers' | 'deepseek'; ask(messages, opts): Promise<AiResult> }` (keep `askModel`'s current result type). `selectProvider(env)` returns the provider or a disabled stub.

**Acceptance:** targeted tests pass; `npx tsc --noEmit`; `npm run lint`.

### Task C (omp): product copy and terms

**Files:** `src/lib/i18n/pricing-plan-copy.ts`, `src/lib/guide/help-topics*.ts`, `src/lib/i18n/addons-copy.ts`, `apps/marketing/legal-content.mjs` (the AI clause added on 11/10: 1/day and 10/day become the monthly limits above; Add-on AI unlimited), `apps/marketing/site-content.mjs` / `render-site.mjs` (any AI limit text), and their tests. Replace every "1 lượt/ngày" / "10 lượt/ngày" AI wording with the Global Constraints copy. Keep the help-topic length tests green.

**Acceptance:** `grep -rnE "lượt/ngày|lượt mỗi ngày|calls?/day|per day" src/lib/i18n src/lib/guide apps/marketing` returns no AI-limit hits; the touched tests pass.

### Task D (agy): docs

`docs/huong-dan/07-goi-va-thanh-toan.md` (+ `i18n/en`), `docs/claims-ledger.md`, `docs/security-privacy.md` (AI limits), `docs/deployment.md`:
- the env vars `AI_SYSTEM_PER_DAY` and `AI_PROVIDER`;
- the `DEEPSEEK_*` variables, with the warning that CTIA, the privacy notice and `AI_POLICY_VERSION` must be updated before enabling DeepSeek.

Use the exact limits above. Then the coordinator runs `npm run guide:build`.
