# Phase00 GPT — appearance regression handoff

Status: ready-for-review; no UI changes. Producer: Codex/GPT task_e7f1616a4c6a / ctx_25f7abd45ef1. Coordinator inspected the test source and actual command logs before recording this packet.

Changed only tests/e2e/ui-audit-appearance.spec.ts (three focused tests). The tests measure settled computed sRGB colors (including alpha composition), actual theme-control behavior/reload/system preference, and timer control bounding boxes at100/108/118%. No class-string assertion substitutes for behavior.

Verification: ESLint on the new spec passed (.omx/ui-execution/gpt-appearance-eslint.log); npm run typecheck passed (gpt-appearance-typecheck.log). PLAYWRIGHT_BASE_URL=http://localhost:3107 npx playwright test tests/e2e/ui-audit-appearance.spec.ts --project=chromium --workers=1 --output=.omx/ui-execution/gpt-appearance-test-output ran three tests, all failed at expected A03/A05/A07 assertions; no setup errors (gpt-appearance-playwright.log).

Baseline red evidence includes timer Pause ratio below4.5, dark shell luminance remaining light, close38.84375px/reset43.171875px at108% and close42.46875px at118%. These are regression locks for existing defects, not claims new UI is working.

Ownership released for this test file; later phases may read/run it, avoid weakening acceptance. No app/test config/dependency edits. Phase00 acceptance still depends on scope/mutation fixture packet and coordinator baseline review.

Runner note: Codex output-last-message initially overwrote its own report path with a short final answer; this coordinator record restores actual verifiable evidence from logs/test source. Runner now saves last-message separately; no worker outcome was fabricated.
