---
phase: 7
title: "UX, Information Architecture, Localization, and Accessibility"
status: in-progress
priority: P2
effort: "7-10d"
dependencies: [5, 6]
---

# Phase 7: UX, Information Architecture, Localization, and Accessibility

## Overview

Simplify parent and child workflows, complete all nine locales, and verify WCAG 2.2 AA behavior across mobile and desktop without discarding the recognizable KidHabit visual language.

## Requirements

- Parent IA avoids hidden horizontal navigation and groups setup, daily review, progress and account settings coherently.
- Child core loop emphasizes today’s next action; destructive/value-changing actions receive confirmation/undo.
- All user-visible and dynamic content is localized; HTML language, dates and numbers match locale.
- Keyboard, focus, labels, errors, live state, contrast, 200% zoom/reflow and reduced motion meet WCAG 2.2 AA.
- Empty/loading/offline/error/success states are consistent.

## Architecture

Split large dashboards into route/tab components with shared design tokens and state primitives. Use typed locale contracts and localized content templates rather than mixed hard-coded strings.

## File Inventory

| Action | Files | Test impact |
|---|---|---|
| Refactor | `ParentDashboard.tsx`, `KidDashboard.tsx`, `LandingPage.tsx`, `Header.tsx`, modal components | Visual/E2E regression |
| Modify | `src/lib/i18n/**`, `src/app/layout.tsx`, `globals.css`, appearance context | Locale/a11y tests |
| Create | `src/components/parent/**`, `src/components/kid/**`, `src/components/ui/**`, `tests/a11y/**` | Focused component ownership |

## Interface Checklist

- Typed locale keys and localized WIT/reward/demo content.
- Shared modal/focus/live-region/error primitives.
- Responsive navigation and stable deep-link/current-section state.

## Implementation Steps

1. Map parent/child jobs and reduce navigation hierarchy; validate wireframes before code changes.
2. Split oversized components by stable domain surface; keep public props typed.
3. Standardize action hierarchy, confirmations, undo, loading, empty and recovery states.
4. Extract all strings/content; enforce locale key parity and update document language.
5. Add semantic landmarks, focus traps/restoration, live regions, reduced motion and contrast/token fixes.
6. Run mobile/desktop browser, keyboard, screen-reader and zoom audits; fix regressions.

## Test Scenario Matrix

| Priority | Scenario | Expected |
|---|---|---|
| Critical | Keyboard-only onboarding/core loops | Complete with visible focus |
| High | Nine locales core flows | No mixed strings, clipping or wrong lang |
| High | 320px/200% zoom | No lost content or two-dimensional scroll |
| High | Reduced motion/screen reader | State change communicated without animation dependency |
| Medium | Parent navigation | Every section discoverable without hidden-scroll guesswork |

## Todo

- [x] IA and component split (all seven parent domain tabs extracted; `ParentDashboard` reduced from 1,379 to 860 lines after adding asynchronous activity-save recovery; `ParentSettingsTab` reduced from 224 to 137 lines by extracting a 117-line account-keyed child-device panel and 103-line typed boundary client; `CheckoutModal` reduced from 368 to 248 lines with a 138-line QR/details surface; domain mutations and cloud/local/pairing lifecycles are isolated in focused modules; create/join group dialogs are 103/70-line accessible portal components; `LeaderboardSection` is a 77-line coordinator backed by six focused components of 57 lines or fewer; `store.tsx` is reduced from 1,797 to 772 lines; `Portrait16Modal` is reduced from 430 to 189 lines and delegates its matrix, giving and modeling views to 133/38/59-line panels)
- [x] Typed locale key parity and dynamic document language
- [x] Shared accessible modal/focus primitives
- [x] Responsive automated accessibility QA
- [x] Visual baselines at 375, 768 and 1280 pixels
- [x] Signed-out pairing actions expose native disabled states, localized guidance and accessible names; 768px header overflow has regression coverage
- [x] Remove mixed-language content from all nine localized core flows (landing samples, onboarding, demo banner/content, child rewards, badges, header, parent approvals, habits, WIT library, age packs, journeys, rewards, children, analytics, settings, child-device connection and the complete 16-strength/7-giving reference guide; all 37 journey habits have native content)

## Success Criteria

WCAG 2.2 AA automated/manual checklist passes for scoped flows; nine-locale matrix passes; core tasks complete at mobile and desktop widths; no critical mixed-language or navigation issue remains.

## Risk Assessment

UI refactor can cause visual churn. Lock reference screenshots and interaction contracts first; avoid rebrand or unrelated stylistic expansion.

## Dependency Map

Depends on Phases 5 and 6. Blocks Phases 8 and 9.
