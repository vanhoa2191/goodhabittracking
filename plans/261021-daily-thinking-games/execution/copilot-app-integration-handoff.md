# P08 app integration handoff

## Implemented

- Added the default-false `thinkingGames` client experience flag.
- Added `ThinkingGameCard` outside the renderer folder. It is current-day-only, lazy-loads `ThinkingGamePlayer`, uses server parent/paired start and finish APIs, and never changes habits, points, rewards, or approvals.
- Added `ThinkingGamesSettingsSection` to parent settings. It reads and writes the existing server settings API and offers a server cutoff preview; failures are visible and no local eligibility is inferred.
- Added `thinking-games-local.ts`, an explicitly local practice adapter using the real pilot manifest, a per-device persisted attempt, pause-compatible state, and storage events. It has no auth/session/entitlement or cloud write path.
- Mounted the card in `KidDashboard` only for today and only when the master flag is enabled. History remains read-only.

## Validation

- `npx tsc --noEmit --pretty false` — exit 0.
- `npx eslint src/components/ThinkingGameCard.tsx src/components/ThinkingGamesSettingsSection.tsx src/components/KidDashboard.tsx src/components/ParentSettingsTab.tsx src/lib/store/thinking-games-local.ts src/lib/experience-flags.ts` — exit 0.

## Remaining gates

The client flag remains false by default. Combined browser proof with the real SDK/RPC transport, PIN-sensitive settings flows, stale child switching, and accessibility/mobile smoke remain integrated-QA work; no human approval or production release claim is made.
