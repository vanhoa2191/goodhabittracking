# Handoff Report — Daily Thinking Game Frame & Vietnamese Copy (P02/P05 Slice)

> **Document**: Handoff, Verification Evidence & Interface Contract: `ThinkingGameFrame` & `thinking-games-copy`  
> **Author**: AGY Frontend Executor (Dispatched Worker AGY — Gemini 3.8 Flash High)  
> **Task ID**: `task_b223291cf703` | **Dispatch ID**: `ctx_533239130525`  
> **Date**: 2026-10-21  
> **Status**: **COMPLETED & VERIFIED**

---

## 1. Gate Clearance Verification

- **P01 Contract Handoff**: `plans/261021-daily-thinking-games/execution/contracts-handoff.md` present (Version: `p01-2026-10-21`).
- **Independent Contract Review**: `execution/copilot-contract-review.md` confirmed present with status:
  ```markdown
  # Copilot P01 contract review
  **Status:** ACCEPTED  
  **Author:** OpenCode (`task_77d50a546338`)  
  **Independent reviewer:** Copilot Auto (`task_95957c611004`)  
  **Review date:** 2026-10-21
  ```
- **Source edits unlocked**: Proceeded with source implementation only after both contract handoff and independent acceptance were verified on disk.

---

## 2. Implemented Source Scope (Strict Exclusive Scope)

The implementation strictly respected the bounded scope. Zero modifications were made to `KidDashboard.tsx`, `ParentSettingsTab.tsx`, `store/**`, `experience-flags.ts`, or database RPCs.

| File Path | Description & Compliance |
|---|---|
| `src/lib/i18n/thinking-games-copy.ts` | Complete Vietnamese copy inventory covering all 17 states and all contract error codes (§14). Enforces peer pronouns "mình – bạn" consistently. Explicitly exposes `SUPPORTED_THINKING_GAME_LOCALES = ['vi']` and returns `null` for unreviewed locales (no silent fallbacks or pretend coverage). |
| `src/components/thinking-games/ThinkingGameFrame.tsx` | Reusable, accessible game shell receiving authoritative state & callbacks. Features header with Day/Slot badge, mute toggle, pause button, exit button, hint controls (max 2), non-punitive retry/wrong handling, and gameplay children slot. Tap targets $\ge 48\text{px}$ (and $\ge 56\text{px}$ for `age_6_8`). |
| `src/components/thinking-games/ThinkingGameStatus.tsx` | Dedicated accessible modal and card overlays for `loading`, `paused`, `exit`, `finish`, `explanation`, `wrong`, `network_pending`, `approval_waiting`, `bonus_locked`, `bedtime`, and `missing_content`. Implements focus trapping via `@/lib/use-modal-focus` and Escape key handling. |
| `src/components/thinking-games/use-thinking-game-audio.ts` | Connects `@/lib/sound` (Web Audio API click/fanfare) and `@/lib/speech` (Web Speech API `vi-VN` TTS at rate 0.9) with persistent mute state in `localStorage` (`kidhabit_sound_enabled`). |
| `tests/unit/thinking-games-copy.test.ts` | Meaningful Vitest unit tests asserting explicit locale restriction, dictionary completeness for all 17 states, and strict absence of adult-to-child pronouns (`\bcon\b`, `\bbé\b`). |
| `.omx/state/daily-thinking-games/ralph-progress.json` | Progress record capturing static validation passes and recording visual proof as `NOT-RUN` until real mounted view in P05. |
| `plans/261021-daily-thinking-games/execution/agy-frame-handoff.md` | Authoritative handoff report and interface specification. |

---

## 3. The 17 Supported States & Behavior

1. **`invitation`**: Displays warm companion greeting, day index, slot badge (`main` vs `bonus`), clear invitation copy, and primary CTA *"Cùng thử nhé"* ($\ge 48\text{px}$ / $56\text{px}$).
2. **`tutorial`**: Shows visual guidance card with optional TTS *"Nghe mình đọc"*, guidance text, and *"Mình hiểu rồi"* to proceed.
3. **`playing`**: Full gameplay screen displaying title, Day/Slot badges, mute toggle, pause button, hint status button (`0/2`, `1/2`, `2/2`), reset/retry button, and renderer children slot.
4. **`paused`**: Calming rest modal for the child's eyes with *"Chơi tiếp"* (Resume) and *"Nghỉ ngơi"* (Save & Exit). Focus trapped, Escape returns to game.
5. **`hints`**: Dedicated hint callout above the board. Level 1 provides observational cue; Level 2 narrows choices. No punishment or point deduction.
6. **`wrong`**: Gentle, non-punitive notice: *"Cách này chưa khớp rồi. Không sao cả, mình cùng thử một cách khác nhé!"* with retry CTA. Zero guilt or countdown timer.
7. **`retry`**: Reset confirmation allowing the child to clear the board without penalty.
8. **`finish`**: Celebrates completion with Web Audio fanfare, growth mindset praise (persistence or strategy), button to inspect explanation, and button to return home.
9. **`explanation`**: Post-game visual explanation modal detailing the cause-and-effect rule.
10. **`exit`**: Friendly disclosure that daily progress is preserved, with *"Nghỉ một lát"* and *"Chơi tiếp"*.
11. **`loading`**: Accessible spinner and polite announcement: *"Đang chuẩn bị câu đố…"*.
12. **`error`**: Clear error presentation with contract error code and localized recovery guidance.
13. **`network_pending`**: Informs the child that the network is disconnected, outbox is preserved, and allows retry.
14. **`approval_waiting`**: Transparently informs that mandatory habit tasks are waiting for parent review before bonus unlocks.
15. **`bonus_locked`**: Displays helpful guidance that completing mandatory tasks before the cutoff unlocks the bonus slot.
16. **`bedtime`**: Night blackout view with peaceful stars and moon: *"Đã đến giờ nghỉ ngơi rồi. Chúc bạn ngủ ngon, mai mình lại cùng chơi nhé!"*. No popups or tempting invitations.
17. **`missing_content`**: Friendly notice when a puzzle for the day/age track is being authored: *"Câu đố mới cho hôm nay đang được chuẩn bị. Bạn quay lại sau một chút nhé!"*.

---

## 4. Craft Floor & Impeccable Quality Checks

- **Contrast & Surfaces**: Light mode uses `sand-50`, `amber-50`, and `white` with text in `slate-900` / `slate-700` (well above 4.5:1). Dark mode uses `zinc-900` / `zinc-950` with `slate-100` / `slate-300`.
- **Touch Targets**: All buttons, close icons, mute toggles, pause controls, and CTA buttons enforce `min-h-[48px] min-w-[48px]`. Young age track (`age_6_8`) primary buttons scale to `min-h-[56px]`.
- **Keyboard Navigation & Trap**: All modals use `@/lib/use-modal-focus` for complete focus trapping (Tab, Shift+Tab) and Escape handling. Interactive controls use visible rings: `focus-visible:ring-4 focus-visible:ring-indigo-500`.
- **No Color-Only State**: All status cards, error states, and badges pair colors with distinct Lucide icons (`Lightbulb`, `Moon`, `Lock`, `Clock`, `Sparkles`, `AlertCircle`, `WifiOff`, `RotateCcw`, `Volume2`, `VolumeX`).
- **Motion Safety**: Transitions are capped at $\le 150\text{ms}$ and respect `motion-reduce:transition-none motion-reduce:animate-none`. Zero screen shake or intense particle confetti.
- **Audio Channels**: SFX use Web Audio API oscillators; TTS uses Web Speech API `vi-VN` at rate 0.9. Mute preference is saved in `localStorage['kidhabit_sound_enabled']`.
- **Copy Discipline**: 100% "mình – bạn" peer voice. Zero occurrences of "con", "bé" or adult pronouns.

---

## 5. Verification Results

```bash
# 1. Vitest unit copy test
npx vitest run tests/unit/thinking-games-copy.test.ts
# Result: 3 passed (100%) in 525ms

# 2. ESLint
npx eslint src/lib/i18n/thinking-games-copy.ts src/components/thinking-games/ tests/unit/thinking-games-copy.test.ts
# Result: 0 errors, 0 warnings

# 3. TypeScript compilation
npx tsc --noEmit
# Result: 0 errors (clean compilation)

# 4. Impeccable detector
/home/opc/.agents/skills/impeccable/scripts/impeccable detect src/components/thinking-games/
# Result: 0 anti-pattern regex violations found

# 5. Visual testing
# Result: NOT-RUN (recorded under .omx/state/daily-thinking-games/ralph-progress.json)
# Reason: Frame is not yet mounted in KidDashboard or a live route fixture (P05 milestone). No fake screenshot or verdict.
```

---

## 6. Interface Specification for Downstream Integrations (P03 Engine & P05 Dashboard)

```typescript
import { ThinkingGameFrame, type ThinkingGameState } from '@/components/thinking-games/ThinkingGameFrame';
import { getThinkingGamesCopy, isThinkingGameLocaleSupported } from '@/lib/i18n/thinking-games-copy';

// Example integration in P05:
<ThinkingGameFrame
  state={gameState} // 'invitation' | 'playing' | 'paused' | 'finish' | etc.
  slotType="main"   // 'main' | 'bonus'
  dayIndex={journeyDayIndex}
  ageTrack="age_6_8"
  title="Quy luật hình vẽ"
  invitationText={puzzle.invitation}
  tutorialText={puzzle.tutorial}
  explanationText={puzzle.explanation}
  hints={puzzle.hints}
  activeHintLevel={hintLevel}
  onStart={() => startGame()}
  onPause={() => pauseGame()}
  onResume={() => resumeGame()}
  onRequestHint={() => requestNextHint()}
  onRetry={() => resetBoard()}
  onExit={() => returnToDashboard()}
  onFinishAcknowledge={() => handleCompletedGame()}
>
  {/* Engine puzzle renderer: e.g. PatternCompletionRenderer, SpatialGridRenderer */}
  <MyPuzzleRenderer boardData={puzzle.boardData} onMove={handleMove} />
</ThinkingGameFrame>
```

---

## 7. Next Concrete Tasks for Downstream Lanes

1. **OpenCode Engine (P03)**: Provide the typed puzzle renderers and solvers for the 3 prototype mechanics (`pattern_completion`, `spatial_planning`, `memory_sequence`).
2. **Copilot Backend (P04)**: Apply the PostgreSQL migration and RPCs implementing the two-slot ledger, `received_at` timestamping, and bonus sync.
3. **Frontend Integration (P05)**: Mount `ThinkingGameFrame` inside `KidDashboard.tsx` behind the `dailyThinkingGames` feature flag, wire with server state adapter, and run Playwright visual verdict.
