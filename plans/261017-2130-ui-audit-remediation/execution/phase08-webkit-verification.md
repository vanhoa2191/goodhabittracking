# Phase 08 — focused WebKit verification

Date: 2026-10-19
Status: verification in progress; results below will be finalized after execution.

## Environment and recovery

The Oracle Linux 9.7 host has installed Playwright WebKit build 2359, but cannot execute its Ubuntu 24 bundle directly. `ldd` identifies missing ICU74/flite/AVIF16/JPEG8/manette/soup libraries plus incompatible GLIBC_2.38 and GLIBCXX_3.4.30 symbols. Adding a few shared libraries or running host package installation would not resolve the ABI mismatch safely.

The verification instead runs an ephemeral official `mcr.microsoft.com/playwright:v1.63.0-noble` container, digest `sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27`. Workspace and Node 26.11.1 are mounted read-only; only `/tmp/phase08-webkit-artifacts` accepts test outputs. The container uses host networking to reach the isolated local server `http://localhost:3111`. It receives the same E1 feature manifest as that server, with `NEXT_PUBLIC_APP_URL` and `PLAYWRIGHT_BASE_URL` both set to this exact origin. Private environment values are not included in this report.

No host packages/settings or project dependencies were changed. The container is removed after each run. The shared Next dev server uses Node26.11.1, webpack, the accepted E1 feature manifest, and the dev-PWA flag.

## Runner diagnostics

An initial broad 262-case run was stopped after two tests exhausted the default overall30-second budget. The first trace spent12seconds navigating,8.8seconds clicking the demo action, and5.8seconds clicking parent mode, leaving too little time for the PIN entry. This was an overall test budget failure, not evidence of a failed product assertion. The runner has4CPUs and its load average reached21.85 while independent verification lanes were active. No retries or forced clicks were added.

The same named child-switcher/axe smoke passed1/1 headless WebKit in59.2seconds with an overall120-second budget. A GTK WebKit/Xvfb smoke passed1/1 in48.5seconds. The focused matrix uses GTK/Xvfb, `WEBKIT_DISABLE_COMPOSITING_MODE=1`, one worker, zero retries, and an overall120-second budget. Existing5-second assertion budgets are unchanged. Xvfb runs inside the ephemeral container with `--init`; host display settings are untouched.

## Focused matrix

Twenty selected cases per engine cover parent queue hierarchy/counting, URL Back navigation, named and keyboard menus, desktop/mobile tab accessibility, approval/timer contrast, theme and hydration checks, Vietnamese persisted appearance identifiers, German118-percent text reflow, timer announcements/focus restoration, delayed/pending/failed saves, lost reward reconciliation, reduced-motion loading, and more-menu focus trapping/restoration. Runtime-specific skip conditions remain enabled and will be listed with final counts.

Raw evidence: `/tmp/phase08-webkit-artifacts/focused.log`, `focused.json`, `focused-command.json`, and `focused/` traces/screenshots on failure. Earlier diagnostics: `run.log`, `smoke.log`, `smoke.json`, `gtk-smoke.log`, `gtk-smoke.json`.

## Limits

These are Playwright WebKit engines on Linux with Desktop Safari and iPhone15 profiles. They verify WebKit behavior and emulated mobile geometry; they do not establish results on macOS Safari, iOS Safari, physical iPhones, touch hardware, VoiceOver, or any physical assistive technology. The full262-case cross-engine breadth is intentionally not claimed by this focused gate.
