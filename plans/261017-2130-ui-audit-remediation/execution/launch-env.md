# Launch lane: env/config audit (read-only)

Date: 2026-10-19. Repo `main`, HEAD 83b1183. `.env.example`, `wrangler.jsonc`, `.github/`, `docs/deployment.md` and `supabase/` are all **clean against HEAD**. The UI-audit diff does not touch release config. No Supabase/Cloudflare MCP calls were made, so **production state (which migrations are applied, which repo vars are set) is unverified**.

## Verdict: CONDITIONAL PASS. No code blocker, but 3 ordering/config traps must be handled by the operator.

### Blockers / must-do before merge to main
1. **Apply migrations BEFORE merging to main.** `src/lib/schema-version.ts` sets `EXPECTED_SCHEMA_VERSION = 202610110001`. `/api/health` calls RPC `schema_version()` (= `max(version)` of the migration ledger, from `202610030001`) and returns 503 `schemaVersion:false` if the DB is older. The `ci.yml` deploy job pushes the Worker first and checks health afterwards (18 x 10s), so the job turns red *after* production is already running the new build, which then reports not-ready. Apply and verify up to `202610110001` first.
2. **GitHub secret `LIFECYCLE_CRON_SECRET` is mandatory for deploy, but docs list it only under lifecycle email.** `ci.yml` deploy maps it to `OPERATIONS_CRON_SECRET`. The post-deploy health step does `exit 1` if it is empty, while the `ready` gate only checks CLOUDFLARE_*/SUPABASE vars, so the deploy happens and then the job fails. It must also equal the Worker secret `CRON_SECRET` (min 32 chars), otherwise the health body has no `checks` and the job fails. `docs/deployment.md` §"Tự động phát hành" lists only the 2 secrets + 2 vars, which is inconsistent.
3. **Marketing deploys before app by design** (`ci.yml` waits for `release.json` == SHA). `deployment.md` line 183 says marketing deploys only after the app has the migration. That only holds if migrations are applied before merge (same as item 1). Marketing prices are public as soon as `marketing.yml` runs on main.

## Required config inventory

### GitHub repo secrets
| Name | Used by | Note |
|---|---|---|
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | ci deploy, marketing deploy | missing => deploy silently skipped (green) |
| `LIFECYCLE_CRON_SECRET` | ci deploy health, lifecycle-dispatch, payment-reconcile, production-observability | see blocker 2 |

### GitHub repo variables (build-time, inlined)
- Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (missing => deploy silently skipped).
- Optional flags passed by ci.yml (all `=== 'true'`, so unset = **off**): `NEXT_PUBLIC_HABIT_PROGRAMS`, `_DAILY_MASCOT_LETTER`, `_DAILY_JOURNAL`, `_DREAM_CITY`, `_PARENT_REENGAGEMENT`, `_EMAIL_CODE_LOGIN`, `_AGE_THEME`, `_DAILY_EASE`, `_INDEPENDENCE`, `_HABIT_COACH`, `_PARENT_AI`, `_LEGAL_PAGES_APPROVED`.
- Hard-coded in workflows: `NEXT_PUBLIC_APP_URL=https://app.kidhabithero.com`, `NEXT_PUBLIC_MARKETING_URL=https://kidhabithero.com`, `NEXT_PUBLIC_SESSION_HINT_DOMAIN=kidhabithero.com`, `NEXT_PUBLIC_DEPLOY_TARGET=app`, `SUPPORT_EMAIL=kidhabithero@gmail.com`, `NEXT_PUBLIC_COMMIT_SHA=$GITHUB_SHA`.

### Cloudflare Worker secrets/vars (runtime, `goodhabittracking`; never in build env)
- Required: `SUPABASE_SERVICE_ROLE_KEY` (JWT-style), `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` (not the leaked fingerprint set), `PAIRING_RATE_LIMIT_SECRET` (>=32 chars, do not rotate), `PARENT_UNLOCK_SECRET` (>=32, required in production else health `parentUnlock` fails), `CRON_SECRET` (>=32, == `LIFECYCLE_CRON_SECRET`).
- Wrangler config: binding `AI` (Workers AI), `ASSETS`, `nodejs_compat`, `compatibility_date 2026-09-19`, smart placement, observability. No `vars`/`secrets` in wrangler.jsonc (correct).
- Optional: `ADMIN_EMAILS` + `ADMIN_BOOTSTRAP_EXPIRES_AT` (emergency only, remove after), `AI_PROVIDER` (default `workers`), `AI_SYSTEM_PER_DAY` (1..100000, default 5000), `AI_KILL_SWITCH`, `DEEPSEEK_API_KEY/_BASE_URL/_MODEL`, `LIFECYCLE_EMAILS_ENABLED`, `LIFECYCLE_EMAIL_PROVIDER`, `RESEND_API_KEY` / `BREVO_API_KEY`, `LIFECYCLE_EMAIL_FROM`, `RESEND_WEBHOOK_SECRET`, `ENABLE_PAYMENT_SIMULATION`, `ENABLE_LEGACY_PAIRING` (ignored in prod).
- Non-Worker: `SUPABASE_PROJECT_REF` (live-verify scripts only; defaults to `evkwelozdcmsmwdzhlxz`), `RELEASE_SHA` (+ `ENABLE_*=false`) for `npm run release:verify`.
- Supabase dashboard (outside repo): Auth Site URL / redirect `https://app.kidhabithero.com/**`; PayOS webhook `https://app.kidhabithero.com/api/payment/webhook`; SMTP + templates only if `EMAIL_CODE_LOGIN` is turned on.

## Feature flags: default OFF (unset in CI = off)
`DAILY_MASCOT_LETTER`, `DAILY_JOURNAL`, `DREAM_CITY`, `PARENT_REENGAGEMENT`, `HABIT_PROGRAMS`, `EMAIL_CODE_LOGIN`, `AGE_THEME`, `DAILY_EASE`, `INDEPENDENCE`, `HABIT_COACH`, `PARENT_AI`, `LEGAL_PAGES_APPROVED`, `PRINTABLES_SALE`. Also hard-coded false in code: questCards, secretQuest, parentInformationArchitecture, journeyMap, landingSafe. Runtime-off by default: `LIFECYCLE_EMAILS_ENABLED`, `AI_PROVIDER=deepseek`, `ENABLE_PAYMENT_SIMULATION`, `ENABLE_LEGACY_PAIRING`. Flags need rebuild/redeploy to change.
Dependencies: `PARENT_AI` needs migrations 202610040004 + 202610110001; `AGE_THEME` needs 202610020003; `PRINTABLES_SALE` needs 202610110001 and the content to exist; `DAILY_JOURNAL`/`DREAM_CITY`/`PARENT_REENGAGEMENT` need their 202609260001/2/3 migrations.

## Migrations
72 migrations; newest is **202610110001** (= EXPECTED_SCHEMA_VERSION). Ordered tail that must be in place (verify applied state with `supabase migration list`, not checked here):
`202610070001_pricing_tiers_launch_offer` -> `202610090010_billing_payment_hardening` -> `202610090020_affiliate_account_privacy_freeze` -> `202610090030_family_operations_hardening` (closes old profile/task write paths, so apply near app deploy) -> `202610090040_affiliate_commission_unfreeze` -> `202610100001_money_model_v2` -> `202610110001_pro_plus_and_addons`.
Run after applying (postgres role, psql/CLI), all exist in `supabase/preflight/`:
- `202610070001_pricing_tiers_launch_offer.verify.sql` (locks offer rows, rolls back; run off-peak). Run the read-only >5-children query from deployment.md first.
- `202610090010_billing_payment_hardening.verify.sql`, `202610090020_affiliate_account_privacy_freeze.verify.sql`, `202610090030_family_operations_hardening.verify.sql`, `202610090040_affiliate_commission_unfreeze.verify.sql`
- `202610100001_money_model_v2.verify.sql`
- `202610110001_pro_plus_and_addons.verify.sql`
Then `npm run verify:live-boundaries` (operator only). Back up logical before; project ref must be `evkwelozdcmsmwdzhlxz`.
Every migration from 202610050001 onward has a verify file; ones lacking verify files are all pre-202609280004 (older, acceptable).

## Inconsistencies / gaps found (non-blocking)
1. `.env.example` lacks `NEXT_PUBLIC_DAILY_MASCOT_LETTER`, `NEXT_PUBLIC_EMAIL_CODE_LOGIN`, `AI_KILL_SWITCH`, and `SUPABASE_PROJECT_REF`; all four are read by code/scripts.
2. `ci.yml` deploy does not pass `NEXT_PUBLIC_PRINTABLES_SALE`, so the flag can never be turned on from CI even though deployment.md calls it a flag. Add the var mapping when it is time to sell; for now this is a safe off.
3. `docs/deployment.md` has no section for `202610090010/20/30` or `202610100001`; it only mentions them in passing. It also has two duplicated "Tên miền riêng" blocks (lines 12-29 and 31-46).
4. `AI_POLICY_VERSION` is a code constant (`2026-10-11` in `src/lib/ai/config.ts`), not an env var. Docs say "raise it", which needs a code change and a release.
5. No rollback scripts exist for `202610050001` onward (only for some earlier ones); the plan is "do not roll back schema", so the rollback is a Worker redeploy only. Note that Pro Plus, add-on and money-model changes are forward-only.
6. `.github/workflows/ci.yml` quality job runs `build:cloudflare` without app origin vars; passes locally since the production-origin check only runs in deploy/production mode. Fine.
7. A missing Cloudflare token or Supabase var makes the deploy job succeed while skipping the deploy, so a green CI is not proof of a release. Check the job log for "Deployment skipped".

## Operator pre-deploy checklist
1. Confirm repo secrets: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, LIFECYCLE_CRON_SECRET; vars: Supabase URL/anon key; set no flag vars unless intended.
2. Confirm Worker secrets listed above exist and `CRON_SECRET` matches `LIFECYCLE_CRON_SECRET`.
3. Backup, apply migrations through 202610110001 in order, run each verify file, confirm `select public.schema_version()` = 202610110001 (service role).
4. Merge to main; watch marketing then app deploy; health must report `version` = first 12 chars of SHA with all checks true.
5. Smoke: guest, parent, child, PWA, payment return; `verify:live-boundaries`, `verify:live-lifecycle`.
