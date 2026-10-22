# opencode-ci-split — CI split for PR #197

Task: `task_fa603d4447e1` · Dispatch: `ctx_50f746d86a68`
Branch: `feat/daily-thinking-games` · Commit: `27f543d`
Run: [39755473815](https://github.com/vanhoa2191/goodhabittracking/actions/runs/39755473815) (head `27f543d`)

## Outcome

**Green.** The thinking-games e2e suite now runs in its own `thinking-games-e2e` job and the
`browser` job is back on its main baseline. All checks on `27f543d` pass:

| Check | Result | Duration | Evidence |
| --- | --- | --- | --- |
| quality | pass | 2m58s | job 119746257627 |
| sql | pass | 56s | job 119746257204 |
| browser | **pass** | **28m56s** (test step 26.9m) | job 119746257586 |
| marketing build (`build`) | pass | 34s | job 119746258243 |
| thinking-games-e2e | **pass** | **5m37s** (test step 4.8m) | job 119746257438 |
| deploy | skipping (PR event expected) | — | job 119758815178 |

## Diagnosis confirmed

`browser` on main was already close to the 35-minute limit before this PR:

| Main run | browser duration |
| --- | --- |
| 39367943707 | 28m57s |
| 39306536834 | 23m33s |
| 39289956541 | 29m04s |

PR #197 adds 92 e2e tests (433 total instead of 341). The previous head (`c62ed32`) was cancelled
twice by the runner signal while the single `browser` job was still inside the thinking-games files
(`b-119701548859.log`, `ci-browser-119726917179.log`: `##[error]The runner has received a shutdown
signal`, no Playwright summary). This was duration, not flaky infrastructure.

## Changes (3 files)

### `.github/workflows/ci.yml`

1. `browser` runs `npm run test:e2e -- --project=chromium` with
   `PLAYWRIGHT_SKIP_THINKING_GAMES: "1"` so it keeps only the historical 341-test workload
   (332 passed + 9 pre-existing skips). Marketing step unchanged.
2. New job `thinking-games-e2e` mirrors the browser setup (`ubuntu-latest`, Node 24, `npm ci`,
   `npx playwright install --with-deps chromium`) and runs
   `npm run test:e2e -- --project=chromium tests/e2e/thinking-games-*.spec.ts`.
   Timeout is **40 minutes**: measured cloud execution is 4.8m for 76 passing tests, but the job
   must absorb CI retries (2) on the heavy specs, including the integration spec that copies the
   repo and boots two `next dev` servers. Artifact name is distinct
   (`playwright-report-thinking-games`) to avoid a same-run collision.
3. `deploy.needs` is now `[quality, browser, sql, thinking-games-e2e]`.

### `playwright.config.ts`

Added an env-driven ignore list:

```ts
const thinkingGamesSpec = /thinking-games-.*\.spec\.ts/;
const appSpecIgnore =
  process.env.PLAYWRIGHT_SKIP_THINKING_GAMES === '1'
    ? [marketingSpec, thinkingGamesSpec]
    : marketingSpec;
```

Applied to every non-marketing project (`chromium`, `mobile-chromium`, `webkit`, `mobile-safari`).
Verified project counts locally:

```text
PLAYWRIGHT_SKIP_THINKING_GAMES=1 → 342 tests in 70 files   # local extra untracked spec included
default                          → 434 tests in 75 files
thinking-games filter            →  92 tests in 5 files
```

CI itself reported `Running 341 tests` in `browser` (332 passed / 9 skipped) and
`Running 92 tests` in `thinking-games-e2e`.

### `tests/e2e/thinking-games-real-api.spec.ts`

The suite drives GoTrue/PostgREST/PostgreSQL and cannot pass on a runner without that stack. Added
an explicit, whole-suite environment guard (no assertion was weakened):

```ts
test.skip(
  Boolean(process.env.CI) && process.env.PLAYWRIGHT_REAL_STACK !== '1',
  'Requires the local Supabase/GoTrue/PostgREST stack, which CI does not provision.'
);
```

Local full-stack runs (`CI` unset) behave exactly as before; a future CI job that provisions the
stack can opt in with `PLAYWRIGHT_REAL_STACK=1`.

## CI evidence from run 39755473815 (head `27f543d`)

New job (`119746257438`):

```text
Run npm run test:e2e -- --project=chromium tests/e2e/thinking-games-*.spec.ts
> playwright test --project=chromium tests/e2e/thinking-games-formats.spec.ts
  tests/e2e/thinking-games-frame.spec.ts tests/e2e/thinking-games-integration.spec.ts
  tests/e2e/thinking-games-pilot.spec.ts tests/e2e/thinking-games-real-api.spec.ts
Running 92 tests using 1 worker
············································································°°°°
°°°°°°°°°°°°
  16 skipped
  76 passed (4.8m)
```

All 16 `real-api` tests are the skipped block (matches the guard); 76 other thinking-games tests
passed, including all three `thinking-games-integration.spec.ts` cases. 0 failed, 0 flaky.

Browser job (`119746257586`):

```text
Running 341 tests using 1 worker
  9 skipped
  332 passed (26.9m)
# marketing step: Running 16 tests using 1 worker
  16 passed (24.7s)
```

The 9 skips are the pre-existing conditional skips; no new skip was introduced in the browser job.
Browser duration 28m56s is inside the main baseline range (23m33s–29m04s) and below the 35-minute
limit.

Local validation before push:

- `npx playwright test --project=chromium --list` with/without the env var: counts above.
- `CI=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:1 npx playwright test
  tests/e2e/thinking-games-real-api.spec.ts --project=chromium` → `16 skipped`.
- `npx eslint playwright.config.ts tests/e2e/thinking-games-real-api.spec.ts --max-warnings=0` →
  exit 0.
- `.github/workflows/ci.yml` parsed with the repo's `yaml` package; `deploy.needs` contains
  `thinking-games-e2e`; Prettier-clean.

## Scope discipline

- Staged only `.github/workflows/ci.yml`, `playwright.config.ts`,
  `tests/e2e/thinking-games-real-api.spec.ts`.
- Did not touch or stage `supabase/migrations|preflight|rollbacks/202610210001_*`,
  `tests/integration/migrations/thinking-games-*.mjs`, or other workers' in-flight files.
- No merge, deploy, force-push, rebase, stash, reset, `pkill`/`killall`, or `git add -A`.

## Follow-ups / notes

- `deploy` can only be observed on a push to `main`; YAML confirms the new job is in `needs`, and
  the PR event correctly reported `deploy skipping`.
- The browser job is still 26.9m of tests against a 35m limit. It is passing now, but the margin is
  thin; if it creeps up, consider sharding the remaining suite or caching the Playwright browser
  download. Not part of this task.
- The 40m timeout for `thinking-games-e2e` is deliberately generous versus the 4.8m observed run so
  that retries cannot silently truncate the suite the way the old 35m shared job did.
