# Phase 06 — coordinator integration acceptance

Status: **accepted for phase07 integrated verification**. This is not final audit closure or release readiness.

## Integrated slices

- 06a1 header/theme touch targets and overflow correction: root A07 header overflow6/6 (vi/it, 375px, 100/108/118%), root A08 reflow2/2 (vi/it at118%), and scoped lint exit0. Worker report also records the wider header/theme matrix. See `phase06a1-root-acceptance.md`.
- 06a2 timer/motion/headings: root reports 14/14 mobile Chromium cases and8/8 non-font Chromium cases pass, owned lint/typecheck exit0, plus focused reduced-motion/focus/save-retry coverage and visual verdict92. See `handoffs/phase-06a2.md`.
- 06b font-settings localization: root focused units7/7, scoped lint, full TypeScript0; prior A08 appearance suite2/2 and theme preservation1/1 logs verified. See `phase06b-root-acceptance.md`.
- Phase04 and Phase05 source patches are accepted for integration; final browser gates are explicitly assigned to07.

## Phase07 gates still open

- Start the owned final E1 only after all writers are settled; rerun the complete inclusive/appearance suite and the nine-locale parent navigation gate, including the German 375px overflow fix.
- Re-run parent-today, contrast, phase04 child recovery, relevant timer/motion/theme/navigation E2Es, and any broad gate whose worker report had a timeout or post-patch verification gap.
- Capture final light/dark 375/1280 views, including data-rich and empty parent inboxes; inspect and update visual verdicts after the final CSS patch.
- Run final static gates, Cloudflare production build and performance budget only after the owned server stops and shared writers are settled; report physical screen reader/WebKit/device/manual gaps accurately.

Whole06 is integrated for the final phase07 run. The earlier isolated subphase acceptances remain the source of per-slice evidence; no unrun combined suite is described as green here.
