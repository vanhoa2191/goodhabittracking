# Review Kilo Final — final revalidation of UI audit remediation test plan

## Previous review source

Primary source: `plans/261017-2130-ui-audit-remediation/reviews/kilo.md` (author Kilo, verification/theme executor), derived from `.omx/reports/ui-audit-2026-10-17/report.md` (detector.json plus parent/kid screenshots dark/desktop/mobile — confirmed present), `package.json`, `plan.md`, `test-spec.md`, `phase-00-baseline.md`, `phase-01-parent-safety.md`, `phase-02-visual-foundations.md`, `phase-06-inclusive-interaction.md`, `tests/e2e/*`, `tests/unit/*`, `playwright.config.ts`. The earlier review draws no pass results; it is a test plan only. Existing relevant tests: `accessibility.spec.ts`, `appearance.spec.ts`, `kid-hero-compact.spec.ts`, `task-card.spec.ts`, `modal-focus.test.ts`, `locale-parity.test.ts`. `plan.md:81–94` defines A01–A09/V01–V05.

## Verdict: REVISE

Coverage currently covers dark theme, locale overflow, accessibility tree, and hero compact only. Concrete missing test cases per A01–A09/V01–V05:

- **A01**: no asserted viewport test — task name + primary button fully inside usable 375×812 viewport (excluding sticky header/bottom-nav) on demo and paired fixtures; empty state must show CTA/explanation, not assert a task exists.
- **A02**: no dedicated scope regression — two children with pending tasks; switching child must not review the wrong child; bulk IDs match displayed scope; single and bulk run fully.
- **A03**: no computed contrast by state — foreground/background for timer Pause/Complete, approve, confirm points, footer/callout; normal ≥4.5:1, large/control ≥3:1; light + dark + system via UI and reload, not just forcing `.dark`.
- **A04**: no per-row mutation test — busy/result per row, double-send lock, slow/fail/retry/success, stale row from another session; request count/payload, native disabled + handler guard, keep context on error, status/error announcements, not toast-only. **Critical gap — authoritative redemption partial success**: approve-success/deliver-fail (row stays approved/unfulfilled, recoverable via retry deliver); deliver-success/refresh-fail (no blind retry); distinguish command succeeded but refresh failed vs command failed; without server evidence report unconfirmed, reconcile, no new side effects. `phase-01-parent-safety.md:17–17` and `test-spec.md:21` specify this but no test exists.
- **A05**: no full dark surface/ink/border test via UI settings, system emulation, and reload; no light-surface leaks in dark.
- **A06**: partial only (card detail labels). Missing: everyday actions before taxonomy; visible open/saving/pending/completed/read-only labels; accessible name matches meaning; persisted activity title not rewritten out of scope; error prose contains no raw `failureCode`.
- **A07**: no touch target test — `getBoundingClientRect` ≥44×44 CSS px at 100/108/118% font size; focus ring not clipped, overlapping, or horizontally overflowing.
- **A08**: partial only (9-locale key match). Missing: saved settings reload correctly; font/size change persists after reload; long names/samples not split or truncated losing meaning; long-copy runtime vi/en/de/ja.
- **A09**: partial only (global reduced motion). Missing: reduced motion keeps result/loading text and timer announce; no confetti/bounce; default feedback retained; freeze/advance clock, no real-minute sleeps.
- **V01**: no heading/landmark test — meaningful heading hierarchy, landmarks/dialog labels correct, axe serious/critical = 0 on affected states, no fake role fixes.
- **V02**: partial only (generic dialog focus). Missing HabitTimerModal-specific: timer-end announce, focus moves to meaningful CTA/heading (not body), Escape and focus restore correct.
- **V03**: partial only (no decorative emoji on card). Missing: tofu reproduction by font/OS; essential icons use system/Lucide fallback; no blanket replacement of decorative emoji.
- **V04**: partial only (`hydrated` dev error check). Missing: fresh production build/reload with no hydration mismatch or application error in the main flow; HMR-only dev noise logged separately, not mixed into production results.
- **V05**: not run — `scripts/check-performance-budget.mjs` exists but unexecuted. Missing: fresh build, asset/route bytes, image load, real metrics against the existing budget; no faked Lighthouse.

**Cross-cutting — compile-time flags**: `test-spec.md:10` and the kilo.md matrix require public compile-time flags, separate build/server/process, saved manifest, no localStorage flag mocking (D0 off, E1 regression-on in `playwright.config.ts`, ageTheme off/on per process/build). No test verifies compile-time flag separation.

## Remediation (plan only, no code changes)

Add test knowledge per the kilo.md §4 matrix, prioritizing critical behavior regression before cleanup (completion/undo, approval/deferral, today/history boundary, timer completion, reward goal/balance, bottom-nav scroll, read-aloud, swipe fallback), reusing `task-card`, `quest-deferral`, `kid-history`, `habit-fire`, `kid-bottom-nav`, `phase-five-daily-experience` before new suites. Collect production-like build and real performance evidence per kilo.md §5–6. Classify failures introduced/pre-existing/infra by reproduction; no auto-dismiss. This file is a review plan only; it derives no pass results.
