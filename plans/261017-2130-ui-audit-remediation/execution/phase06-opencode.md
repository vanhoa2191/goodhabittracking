# Phase 06b — Font Settings Slice (OpenCode) — implementation + evidence

Slice: D10 isolated 06b (appearance i18n). Covers 02a/03 and 04a partial acceptance context. Full 04/05 not yet accepted; whole-06 acceptance still requires full 04/05 plus 06a2. This slice is self-contained and edits none of Kilo's or the parent/store owner's files.

## Preedit plan (written before edits)

- Read `phase-06-inclusive-interaction.md` (06 spec) and `execution/inclusive-regression-gpt.md` plus its authoritative READONLY source `tests/e2e/ui-audit-inclusive.spec.ts`.
- Own: `appearance-context.tsx`, `FontSettingsModal.tsx`, appearance copy i18n + locale tests only. Do not touch Header / ThemeSelector / timer / globals / KidDashboard / store / parent / child / inclusive spec.
- Separate persisted font option IDs from localized labels using the existing i18n 9-locale pattern. Keep `FONT_OPTIONS`/`FONT_SIZE_SCALES` stable ids, cssFonts, scales and storage keys; keep exports/callers compatible; remove `split(' ')[0]`.
- Give the multilingual font sample a clear role; keep the modal close/footer buttons ≥44×44 at 100/108/118%; keep Escape/focus-restore (ModalShell) behavior.
- Meaningful regression coverage: option structure, full Vietnamese strings, no VI leakage into non-VI locales, fallback; the authoritative inclusive A08 cases lock runtime behavior.
- No new deps, no font downloads, no invented locale IDs, no detector/suppressions.

## Changes

1. `src/lib/i18n/font-settings-copy.ts` (new, scoped 9-locale copy): `fontOptions` (localized name + preview per stable id `rounded|modern|playful|serif`) and `sizeOptions` (localized full label per stable id `normal|large|xlarge` + percentage). Falls back to `vi`. Only copy that did not already exist elsewhere is introduced; modal title/subtitle/section labels/preview label reuse existing `translations` + `small-modals-copy`, so no invented locale IDs and no drift.
2. `src/components/FontSettingsModal.tsx`:
   - Size buttons now render the localized full label (e.g. `Chữ to rõ ràng`) — `split(' ')[0]` removed.
   - Font option name/preview now render localized copy keyed by the stable option id; `truncate` replaced with `break-words` so long EN/DE/JA names and previews wrap without clipping.
   - Modal heading is a semantic `<h2>`; size and family labels are real `<h3>` section headings.
   - Close button `min-h-11 min-w-11` and footer button `min-h-11` (≥44×44); option buttons `min-h-11`.
   - Font sample preview line carries `role="note"` (clear sample role). No font downloads; cssFont values still come from `appearance-context`.
3. `tests/unit/font-settings-copy.test.ts` (new): locks 4 font + 3 size options and stable id order for all 9 locales, full VI option copy, non-VI does not leak VI font names, and unknown-locale fallback.

`src/lib/appearance-context.tsx` was NOT modified (no change required): stable IDs, cssFonts, scales and `kidhabit_font_family` / `kidhabit_font_size` storage keys are preserved verbatim, so selected values and reload compatibility are unchanged.

## Verification (Node 26.11.1, 2026-10-19)

| Command | Exit | Evidence |
| --- | --- | --- |
| `npx eslint src/lib/i18n/font-settings-copy.ts src/components/FontSettingsModal.tsx src/lib/appearance-context.tsx tests/unit/font-settings-copy.test.ts --max-warnings=0` | 0 | No issues found |
| `npm run typecheck` (`tsc --noEmit`) | 0 | no errors |
| `npm test -- tests/unit/appearance-preference.test.ts tests/unit/font-settings-copy.test.ts` | 0 | 2 files / 7 tests passed |
| `PLAYWRIGHT_BASE_URL=http://localhost:3107 playwright test tests/e2e/appearance.spec.ts --project=chromium --workers=1` | 0 | PASS 1 — existing appearance/theme preservation |
| `PLAYWRIGHT_BASE_URL=http://localhost:3107 playwright test tests/e2e/ui-audit-inclusive.spec.ts --grep A08 --project=chromium --workers=1 --output=.omx/ui-execution/inclusive-a08-opencode-20261019-080921` | 0 | PASS 2 / FAIL 0, `.omx/ui-execution/phase06b-opencode-inclusive-a08.log` (105978ms) |

A08 results: both cases green — `A08 font and size UI persist stable IDs and complete VI size labels after reload` and `A08 all nine locales expose complete localized appearance choices` (all 9 locales: 4 font + 3 size hard guards, localized category names/previews, full VI phrases, no VI leakage, no truncated VI sizes).

Earlier red-to-green: first attempt failed only `it size 0` (label `Comodo` vs semantic `/comoda/i`); corrected the Italian feminine label to `Comoda`. Two interim runs failed with `net::ERR_CONNECTION_REFUSED` while the coordinator-owned 3107 dev server was briefly down during a rebuild; not a product failure.

## Scope discipline

- Not modified: `Header.tsx`, `ThemeSelector.tsx`, `HabitTimerModal.tsx`, `globals.css`, `KidDashboard.tsx`, any store/parent/action files, `tests/e2e/ui-audit-inclusive.spec.ts` (READONLY), child fixture.
- No new dependencies, no commits, no deploy, no build/dev run, no global settings, no detector/suppressions.
- Timer `V02` remains red and is owned by 06a2; the broader whole-inclusive run is expected red until 06a2 lands. This slice does not claim full 06 acceptance.

## Gaps / handoff

- Exact results and paths above; no blocker for the coordinator to merge this slice.
- `handoffs/phase-06b.md` filled ready-for-review. Coordinator owns final captures and full-06 acceptance.
