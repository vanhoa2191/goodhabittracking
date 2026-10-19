# Phase 08 — accessibility and device verification

Date: 2026-10-19. Owner: accessibility/device verification specialist.
Status: mobile browser regression running; real screen-reader and physical-phone gates blocked by absent equipment/runtime. No source changes, dependency changes, host configuration changes, deployment or commit.

## Two previously skipped cases

The two skips in the Phase07 desktop Chromium accessibility run were not failing or disabled tests. `tests/e2e/a11y-menus.spec.ts:188` and `:198` explicitly skip when `isMobile` is false: they cover the child bottom navigation and its task-button nudge. The bottom navigation exists below 640px; the desktop suite therefore cannot execute these cases. Phase08 ran the existing `mobile-chromium` project (Pixel 7 browser emulation): **both passed**, in 11.4s and 16.2s respectively, without deleting their appropriate desktop skip conditions.

Conversely the mobile suite intentionally skips four desktop header-dropdown tests and one wide-screen child-tabs test. Those surfaces are hidden at the mobile viewport and retain desktop-project coverage.

## Runtime and physical-device inventory

Fresh evidence: `.omx/ui-execution/phase08/assistive-device-inventory.log`.

- Runner is Oracle Linux 9.7 aarch64. `/sys/bus/usb/devices/*/product` lists only QEMU USB Tablet, QEMU USB Keyboard, QEMU USB Mouse and xHCI Host Controllers. No Android/iPhone USB attachment or `/var/run/usbmuxd` socket is present. `adb`, `idevice_id` and `xcrun` are not on PATH. Physical iOS/Android touch operation remains **blocked / not tested**.
- `at-spi2-core` and `python3-gobject-base` are installed; `/usr/bin/python3` imports `gi`. This supersedes the older Phase07 inference that those base libraries were missing.
- Actual GNOME Orca screen reader, `speech-dispatcher`, `espeak-ng` and `python3-pyatspi` are **not installed**. Python cannot find the `orca` or `pyatspi` modules. Session AT-SPI D-Bus introspection reports `IsEnabled = false` and `ScreenReaderEnabled = false`. The presence of AT-SPI alone is not evidence of a running screen reader.
- The computer-use discovery stub was read at `/home/opc/.agents/skills/computer-use/SKILL.md`. Its instruction is: “If the selected executable cannot run, report its exact error and stop. Do not fall through to another executable”. The managed `/home/opc/.local/bin/orca skills get computer-use --json` returned: `[single-instance] Another Orca instance is already running for this userData profile; exiting this launch after requesting the existing window.` It did not return the required version-matched guide. No alternate/guessed GUI commands were issued.

Screen-reader navigation, spoken names and live-announcement timing remain **blocked / not tested with actual assistive technology**. Axe, accessible-name assertions, keyboard-focus checks and browser emulation do not satisfy that manual gate. No global packages were installed and no accessibility/audio/desktop settings were changed to manufacture an AT environment.

## Verification command

Node 26.11.1, shared E2E server `http://localhost:3111` owned by the WebKit verification lane, one Playwright worker:

```sh
PLAYWRIGHT_BASE_URL=http://localhost:3111 npx playwright test \
  tests/e2e/accessibility.spec.ts tests/e2e/a11y-menus.spec.ts \
  tests/e2e/ui-audit-child-recovery.spec.ts tests/e2e/ui-audit-appearance.spec.ts \
  tests/e2e/ui-audit-inclusive.spec.ts tests/e2e/ui-audit-motion.spec.ts \
  tests/e2e/ui-audit-regression.spec.ts tests/e2e/appearance.spec.ts \
  --project=mobile-chromium --workers=1 --output=/tmp/phase08-mobile-chromium
```

Results and follow-up evidence will be recorded here after the run completes. Live log: `/tmp/phase08-mobile-chromium.log`.

Initial diagnostic findings (retained rather than hidden by retries):

- The first actual menu case exceeded its overall 30s budget during the initial demo entry. Shared server logs record a 25.8s initial `GET /` including 23.6s Next compilation. The trace reached the child-heading visibility check when the overall deadline expired; no axe violation was reported.
- The offers/referral case reached the intended settings section and affiliate-card visibility successfully, then ran axe evaluations and reached the final violation assertion after its overall 30s deadline. It failed as `Test timeout of 30000ms exceeded`, rather than an assertion naming an accessibility violation. A warm rerun with a 90s overall budget is required to settle this result; the 5s assertion timeout remains unchanged.
- `appearance.spec.ts` initially timed out waiting for the system-theme control after its menu click; the screenshot showed the landing gate with the menu closed. Root strengthened the test's hydration-error guard separately. An isolated warm rerun of that strengthened test with `--timeout=90000` passed (20.1s test, 22.0s total); captured console/pageerror hydration guards passed. Evidence: `/tmp/phase08-mobile-theme-isolated.log`. This does not dismiss separately observed shared-dev-server hydration exceptions; the coordinator owns their isolation and production comparison.
- All 15 `accessibility.spec.ts` mobile cases passed, including parent approvals/rewards/settings, child details, pricing focus restoration and all nine locales. These remain automated browser checks, not actual screen-reader operation.

## Remaining release evidence

An actual Safari/macOS or iPhone Safari run is distinct from Playwright WebKit. An actual Android handset browser with touch and an actual iPhone with touch remain required for physical-device claims. VoiceOver/Safari or TalkBack/Chrome (or another supported real AT combination) must verify the entry gate, child task details/timer, parent approval queue, menu/PIN dialogs, error/retry and focus restoration, with audible output and touch exploration where applicable.

No new abstraction or product simplification was needed in this lane; existing meaningful tests and fixtures are reused. Changes are verification records only. Risks are limited to the explicitly untested hardware/AT behaviors and any test failures reported above.
