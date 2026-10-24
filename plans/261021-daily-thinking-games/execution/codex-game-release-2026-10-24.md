# Approved thinking-games production release — resumed 2026-10-24

## Scope and authority

Recovered session `01a1664b-1c43-7062-ae42-bd99e670414f` records the product owner's explicit instruction: “phan game ok roi ma. Cho production di”, followed by approval to use production administration and “tiep tuc nhe. da log in”. This continuation completes that authorized game release. It does not claim independent editorial review or child-pilot observations.

Base main is `889c986f523dcb9342259a5456c5ffbcf6945fe2`; release branch is `feat/enable-approved-thinking-games`. Preserve unrelated shared-checkout changes. Git ownership and all production actions remain with root.

Approved release is `release-365-v1`: Vietnamese, age 6–8 and 9–12, 365 days with main and bonus, 1,460 approved items. Serving manifest SHA-256 is `dd623f9e19d98d72387fc3cd15470f1239a55baf6507bb1c9708ec2a22f1010e`. The prior session already set repository variable `NEXT_PUBLIC_THINKING_GAMES=true`; fresh readback confirms it. No family is enabled automatically.

## Recovered state and repair

Supabase login works for project `evkwelozdcmsmwdzhlxz`. Schema preflight passes. Fresh aggregate readback found the content table empty; the prior multi-statement query returned only its final resolver result and did not prove content import.

The serving catalog is now bundled server-side for Cloudflare instead of depending on repository filesystem access. Successful validation is cached per isolate, after checking the runtime flag on every call. The new cache regression failed before the repair and passed afterward; toggling the flag still immediately denies admission.

Local import artifacts under `/tmp/codex-game-resume-20261024/import/` use the existing schema projections plus non-secret editorial/source metadata required by approved-item reconstruction. Private grading data stays separate. All 1,460 rows roundtrip exactly, with recomputed fingerprints and no private answer fields in public payloads. Isolated PostgreSQL 17 execution proved import, exact equality, no-rewrite idempotency, mismatch rejection and rollback. Import uses 15 independently atomic batches, never overwrites existing content, and rejects mismatches.

## Production data receipt

Root executed all 15 guarded import transactions successfully. Fresh independent readback compared every field: **1,460 matched, zero missing, zero mismatched**. Each track has 730 approved Vietnamese items spanning days 1–365, with 365 main and 365 bonus entries; zero private answer fields in public payloads. Receipts are `import/batch-*.receipt.log` and `import/verify-*.receipt.log` in the evidence directory. The production schema was not modified.

## Verification and publication

First fresh full lint/typecheck/test sequence passed: 344 files / 3,732 tests, 166.82 seconds. Cache regression separately failed before implementation and passed after it. The existing audit then blocked on newly published [Zod advisory GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5); its patched version is 4.6.6. Updated only the existing direct Zod dependency and its lock entry from 4.6.5 to exact 4.6.6, without a new dependency or audit exception. Full final CI is being rerun against this dependency and the cache repair.

Initial publication is commit `06abe1b017f680497e04abfd15f1bc61d56de44a`, [PR203](https://github.com/vanhoa2191/goodhabittracking/pull/203). Root verified the exact 14-file staging allowlist, staged whitespace and secrets before committing/pushing. Zod audit now passes. The post-patch full suite found exactly three V2 engine-provenance failures (3,729 passed); lint/typecheck still pass. PR quality also failed, while SQL and marketing build passed. This failed run is not acceptance evidence.

The engine hash includes bundled Zod, so the required patch changes the canonical hash. The existing V2 generator was rerun, changing engine hash from `f649e4224478fc181cb844ff27a88149e7a9c9602949ace0ae66da3c12ae71c3` to `e2ee48b85e3f760d54d6550ca8fc7d1fc135f193bfceb5bc6155543dacdd0848`. All seven generated documents compare equal after omitting only engine identity fields; all 2,920 puzzle contents, IDs, fingerprints and copy are unchanged. The serving manifest and pin are byte-identical, and the production import remains valid. Generator/audit evidence is retained under `provenance/` in the evidence directory.

Provenance repair committed and pushed as `7a1f5c5`, with root independently comparing all generated documents and audits against their exact saved originals, verifying the unchanged approved digest, and checking the exact 14-file follow-up index. Focused provenance tests pass 16/16. The 2,920-item checker and all five batches pass with zero errors; the existing capped 250 review warnings remain unchanged. Root cancelled the superseded failed CI run to avoid spending runner time on its remaining browser job.

Fresh Cloudflare build, performance budget and content checker pass. Real local Workerd catalog admission passes with the flag enabled and returns `401/session_invalid` before database access. Timings for first/repeated catalog requests: **2,315 / 37 / 30 / 25 ms**, demonstrating cache reuse. Secret-free health remains `503/unavailable` by design; this local check does not claim production readiness.

Final root full tests on patched Zod and regenerated provenance pass: **344 files / 3,732 tests**, 127.02 seconds, exit 0 (`final-tests.log`). Root observed lint/typecheck pass on the same code/dependency state before the JSON-only provenance correction; audit passes without exception. Independent final integration review found no blocking defect and confirmed that all current production consumers preserve the cached manifest. Current-head GitHub checks remain pending; successful local results do not replace them.

On exact head `7a1f5c5`, GitHub quality passes in 3m19s, SQL in 52s, marketing build in 30s, and game E2E in 5m31s (**76 passed / 16 skipped**). Quality logs independently confirm 3,732 tests, audit and bundled catalog/session gate. General browser remained in Chromium installation for over seven minutes, before any test started. Root cancelled that remaining run, then requested one bounded rerun of only browser job `120696341157` in run `40036251204`; completed successful jobs are retained. No source, assertions or timeout was changed for this infrastructure retry.

Cancelled-job logs confirm Ubuntu mirror package downloads stalled before application tests. Attempt 2 browser job `120699396120` installed Chromium successfully and entered the existing full browser suite. Local HEAD, remote release branch and PR head independently match `7a1f5c5da039eadcc41bc0f5426564ac2ad6cd0a`; the index is empty. This evolving final receipt remains local to avoid restarting checks for documentation-only updates.

Attempt 2 completed with **330 passed / 9 skipped / 1 flaky / 1 failed** in 20.1 minutes. Blocking accessibility failure sampled the selected rewards tab during its color transition (`#dadde2` on `#6364fb`, 3.24:1); the test incorrectly assumed reduced-motion CSS disabled all color transitions, while the source deliberately preserves color feedback. The scrolling fixture also failed once before retrying successfully, with coordinates measured during smooth scrolling. Root inspected logs and downloaded browser artifacts instead of repeating the failed workflow unchanged.

Two fixture-only corrections retain every acceptance assertion: wait for selected tab state and live tablist animations before Axe measures contrast; scroll the settings heading instantly using its authored `scroll-margin` before checking sticky navigation and current section. No UI colors, CSS behavior, Axe rules, assertions or timeouts changed. Focused repeated verification passes **6/6 in 2.0 minutes**, exit 0, with three repeats per scenario. Changed-test ESLint and root typecheck also pass, exit 0. Evidence: `browser-repairs-repeated.log`.

Committed and pushed the exact three-path fixture/report scope as **`0016513d7cf46b7360257d864ef2c8e0d0ea59d8`**. Current CI: [run40039670671](https://github.com/vanhoa2191/goodhabittracking/actions/runs/40039670671), marketing [run40039670578](https://github.com/vanhoa2191/goodhabittracking/actions/runs/40039670578). Wait for checks on this head before merge. The approved serving digest and production content did not change.

## Verified PR merge and main deployment

Final PR203 checks all pass on exact head `0016513`: quality3m19s, SQL46s, marketing build26s, thinking-games E2E5m43s and browser26m38s. Root independently read final browser logs: **332 passed / 9 skipped**, then **marketing16/16**, with no flaky result reported. PR was OPEN/CLEAN/MERGEABLE, three commits ahead and zero behind main. Root used the exact-head guard and a Lore merge message; no rule bypass, branch cleanup or shared-checkout switch occurred.

PR203 merged **2026-10-23 23:53:39 UTC** as **`6fd99ad134c1d3176c0dc23ca70bd189247dda43`**. Main app CI/deploy is [run40042167169](https://github.com/vanhoa2191/goodhabittracking/actions/runs/40042167169); marketing is [run40042167159](https://github.com/vanhoa2191/goodhabittracking/actions/runs/40042167159). Deployment and expected-SHA production game smoke are pending at this checkpoint.

Root independently verified identical Git trees for reviewed head `0016513` and merge `6fd99ad` (`b2d0455b188f33739e54d5805a8fe3661c6f6c1e`). Main quality, SQL and game E2E have passed. Marketing deployment completed successfully; public `https://kidhabithero.com/release.json` independently reports full release `6fd99ad134c1d3176c0dc23ca70bd189247dda43`. Main browser job `120715524745` remains in progress, so app deployment is still gated. Resume by checking run40042167169, then require expected app version `6fd99ad134c1` and run `/tmp/codex-game-resume-20261024/verify-live-game.mjs --run` with explicit project `evkwelozdcmsmwdzhlxz` and app origin `https://app.kidhabithero.com`; never print operator keys or cookies.

## App deployment and live settings permission repair

All main gates subsequently passed, including browser **332 passed / 9 skipped**, marketing16/16, game76/16 skipped and quality344 files/3,732 tests. The main browser needed30.6 minutes of test execution but completed within the existing job limit, with no flaky result reported. Deploy job `120724325347` published Worker **`8b50002f-e715-4997-a939-f7940176d8f2`** at **2026-10-24 00:27:17 UTC**, with `ENABLE_THINKING_GAMES="true"`. Authenticated CI health and operations checks passed; independent public health returned HTTP200/ready/version`6fd99ad134c1`. An isolated Chromium production demo also passed: game card visible, compiled flag enabled, zero page errors, no production account writes (`live-ui.json`, screenshot`production-game-demo.png`).

Authenticated live acceptance then found a real existing ACL defect: settings GET returned409/`settings_failed`, despite valid parent authentication and owner membership. Two initial synthetic runs independently verified cleanup of their single created family/user. Production metadata confirmed the existing forced family RLS policy but **no authenticated SELECT grant**. The source migration revoked table privileges and created a policy without granting the read privilege needed by the parent endpoint. Neither health nor local Worker initialization proved this authenticated behavior.

Root continued after the SQL executor hit its usage limit. A separate narrow migration grants SELECT only on `thinking_game_settings` to authenticated, guarded by forced RLS and the exact family-read policy. PostgreSQL17/18 both reproduced SQLSTATE42501 before repair and passed the regression after it; root reran both independently, including own/foreign reads, second-family isolation, denied mutations, denied anonymous access and separate private grading reads. The regression is added to `npm run test:sql`, with preflight and rollback artifacts.

Root applied the reviewed migration and verify file to the explicitly authorized production project. Independent before/after ACL snapshots prove **only authenticated settings SELECT changed**; the single family policy, anonymous/mutation denials and private-content denials are identical. Receipts: `settings-read-apply.json`, `settings-read-verify.json`, `settings-read-acl-{before,after}.json`. No stored family settings or content rows were modified by this ACL repair. A later anonymous smoke attempt received a non-application503 before any fixture creation; cleanup verified zero created users/families, and root is diagnosing that response before final game acceptance. Current follow-up branch: `fix/thinking-games-settings-read` from main`6fd99ad`.

Logs and receipts: `/tmp/codex-game-resume-20261024/`. Do not infer a successful release from preparation or database import; normal PR/main CI, deployment, expected-SHA health and authenticated game smoke remain required.

## Changed files and simplification

The release changes the existing catalog/manifest pin, CI and Wrangler feature wiring, the runtime/content checks, four unit-test/helper files, two E2E fixtures, the existing Zod package/lock entry, seven generated V2 candidate documents, six corresponding audit documents and this receipt. No new dependency or product UI component was added. The catalog reuses successful validation per isolate, generated provenance reuses the existing generator/auditor, and fixtures synchronize with actual authored UI state.

Exact 29-path release scope:

- `.github/workflows/ci.yml`
- `content/thinking-games/candidates/365-v2/batch-01-days-001-028.json`
- `content/thinking-games/candidates/365-v2/batch-02-days-029-091.json`
- `content/thinking-games/candidates/365-v2/batch-03-days-092-182.json`
- `content/thinking-games/candidates/365-v2/batch-04-days-183-273.json`
- `content/thinking-games/candidates/365-v2/batch-05-days-274-365.json`
- `content/thinking-games/candidates/365-v2/candidate-manifest-v2.json`
- `content/thinking-games/candidates/365-v2/candidate-meta-v2.json`
- `content/thinking-games/manifests/release-365-v1.json`
- `package-lock.json`
- `package.json`
- `plans/261021-daily-thinking-games/execution/codex-game-release-2026-10-24.md`
- `plans/261021-daily-thinking-games/execution/content-candidate-audits/p08-365-v2-batch-01.json`
- `plans/261021-daily-thinking-games/execution/content-candidate-audits/p08-365-v2-batch-02.json`
- `plans/261021-daily-thinking-games/execution/content-candidate-audits/p08-365-v2-batch-03.json`
- `plans/261021-daily-thinking-games/execution/content-candidate-audits/p08-365-v2-batch-04.json`
- `plans/261021-daily-thinking-games/execution/content-candidate-audits/p08-365-v2-batch-05.json`
- `plans/261021-daily-thinking-games/execution/content-candidate-audits/p08-365-v2-catalog.json`
- `scripts/check-cloudflare-runtime.mjs`
- `scripts/check-thinking-games-content.mjs`
- `src/lib/thinking-games/server/catalog.ts`
- `src/lib/thinking-games/server/release-manifest.ts`
- `tests/e2e/accessibility.spec.ts`
- `tests/e2e/parent-panels.spec.ts`
- `tests/unit/thinking-games-adversarial.test.ts`
- `tests/unit/thinking-games/helpers.ts`
- `tests/unit/thinking-games/manifest.test.ts`
- `tests/unit/thinking-games/synthetic-release-fixture.test.ts`
- `wrangler.jsonc`

## Runtime repair plan

Keep every release admission requirement and the pinned serving bytes. Remove redundant JSON decode and outer schema parsing of the already imported JSON; the existing release validator still performs full schema/mechanics validation once per isolate. First run existing positive/negative admission regression tests, then compare local Worker bootstrap/timing and a real Cloudflare candidate version before changing production traffic. The previous native verifier confirmed current consumers do not mutate the cached catalog. Production1102 is a real resource-limit failure, not successful game acceptance; filtered operator tail and before/after profiling will distinguish its resource behavior. No new dependency, paid-plan change or relaxed validation is planned.

## Confirmed resource cause and sealed-build repair

A filtered, anonymous-only Cloudflare tail captured **exceededCpu**: three bounded probes returned503/1102, with reported CPU2010/10/10ms. Other isolated probes could pass, so occasional401 was not reliable acceptance. Account/Worker settings were inspected read-only; no plan, limit or billing setting changed. Official resource documentation: https://developers.cloudflare.com/workers/platform/limits/ .

The initial duplicate-parse cleanup reduced memory but still required year-wide request computation. Final repair moves full release schema/mechanics validation into mandatory `npm prebuild` (`check-thinking-games-release-bundle.mjs`). The checker recomputes the exact reviewed file digest/version, rejects stale proof or changed bytes, and validates all release content before build succeeds. It generates only a small technical validation receipt; it grants no human approval. Worker admission uses the immutable bundled JSON and matching receipt/pin, checks flags/basic approval/status/counts, and never reruns the complete year-wide validator in a request. Existing pure full-admission controls remain; four new build-binding tests reject tampered catalog bytes and stale proof.

Independent review inspected installed OpenNext/AWS adapter code and confirmed the real wrapper defaults to `npm run build`, with no skip flag or build-command override. This proof is a build trust boundary, not a runtime cryptographic signature; successful deployment relies on that mandatory verified build.

Targeted tests pass **41/41**, including existing admission controls, new binding tests and schema-manifest/version checks. The cold-budget regression rejects the old Worker at2682ms against a1000ms local limit. Node profile (not Cloudflare metrics): original admission3729ms/retained heap37,652,248 bytes/peak RSS243,372KiB; sealed admission4ms/retained heap11,784,208 bytes/peak RSS101,704KiB. Real candidate Worker and final production acceptance remain required.

Supabase migration repair successfully recorded only version202610240001 as applied; independent `schema_version()` readback confirms202610240001. `supabase/schema.sql` and build `EXPECTED_SCHEMA_VERSION` now match it. Local full CI and full PostgreSQL18 SQL suite are running. Native SQL executor hit a usage limit; root completed review/verification/integration without substituting a model or provider.

## Follow-up publication scope

Full local lint/typecheck and unit/integration suite passed **345 files / 3,736 tests** on the sealed-build repair. The complete PostgreSQL18 `npm run test:sql` suite passed, including the new read-ACL regression; the focused real-role test also independently passed on PostgreSQL17. Audit then identified newly published [GHSA-xjj6-f33q-929c](https://github.com/advisories/GHSA-xjj6-f33q-929c) in Miniflare's exact Undici7.29.1 dependency. Only that existing transitive entry was overridden to patched7.30.1 under Miniflare; the unaffected6.29.1 copy and parent versions are unchanged, with no new direct dependency or audit exception. Fresh audit passes. Final build/Worker and current-dependency CI checks remain pending.

The follow-up owns only validation-proof metadata/checker/tests, runtime admission/budget gate, the settings read migration/preflight/rollback/regression, schema manifest/version, package/lock wiring, deployment notes and this receipt. Unrelated shared dirty files remain excluded. Source approved manifest/pin and all1,460 imported content rows are unchanged.
