# Phase 5: Homepage Conversion Redesign

## Objective

Rebuild the public homepage into a concise, truthful sales journey that demonstrates the real product and routes returning users directly to their role-specific app.

## Depends On

- Phase 1 approved message and offer contract.
- Phase 4 final pricing and capabilities.
- [Sales-page adaptation report](./reports/sales-page-analysis.md).

## Approved Structural Direction

1. Hero with one primary parent CTA, one demo path, and real product proof.
2. Verified assurance strip.
3. Parent problem → KidHabit mechanism → observable outcome.
4. Three real product surfaces: tasks, progress/focus, and rewards.
5. Three-step setup.
6. Collapsed framework and age-roadmap detail.
7. Three paid pricing cards and trial guidance.
8. Safety and parent controls.
9. FAQ.
10. Final CTA and functional footer.

## Work

1. Reuse the conversion logic of the supplied HTML without copying its typography, mascot, raw visual tokens, fake proof, or inaccessible controls.
2. Show real KidHabit UI components or current captures using clearly identified sample/demo data.
3. Write claims from implemented behavior and approved documentation only; exclude invented testimonials, user counts, rankings, and child-development outcomes.
4. Present `Gói Một Bé`, `Gói Gia Đình · Tháng`, and `Gói Gia Đình · Năm` with comparable limits, periods, benefits, CTA, payment assurances, and the approved labels `Khởi đầu nhẹ nhàng`, `Phổ biến nhất`, and `Tiết kiệm nhất`.
5. Keep authenticated parents routed to the parent app and paired children routed to the child app; expose “Trang chủ” as an intentional navigation action rather than a forced detour.
6. Keep secondary educational content progressively disclosed so the mobile page remains focused.
7. Meet accessibility requirements: semantic landmarks, skip link, real buttons/links, 44px targets, visible focus, accurate menu state, readable contrast, and reduced motion.
8. Localize all visible copy across the nine supported locales without truncating pricing or controls.

## Acceptance Criteria

- [ ] A first-time visitor can understand audience, mechanism, product, trial, price, and next action without signing in.
- [ ] Product previews represent current working UI rather than decorative placeholders.
- [ ] Returning parents and paired children do not have to pass through the sales page.
- [ ] Every CTA and footer link has a real destination and keyboard behavior.
- [ ] Pricing comparison is readable at 375px without horizontal scrolling or ambiguous plan limits.
- [ ] No unverified social proof or outcome claim ships.

## Validation

- Visual QA at 375px, 768px, and 1280px in light and dark modes where supported.
- Keyboard-only, screen-reader landmark/name, contrast, reduced-motion, and JavaScript-progressive-enhancement checks.
- Route tests for first visitor, authenticated parent, paired child, explicit homepage navigation, and demo.
- Locale snapshots or visual checks for all nine locales, including long-string overflow.
- Run `npm run test:e2e -- tests/e2e/entry-journey.spec.ts tests/e2e/design-foundation.spec.ts tests/e2e/parent-navigation-locales.spec.ts tests/e2e/accessibility.spec.ts`; expect role routing, CTA destinations, landmarks, focus, and locale layouts to pass.
- Run `npm run test:a11y` and inspect Playwright screenshots at 375, 768, and 1280 CSS pixels; expect no clipped pricing, horizontal overflow, unreadable contrast, or inaccessible control.
- Disable JavaScript for the static landing check; expect core copy, prices, and links to remain visible even when enhancements do not run.

## Risks and Rollback

- A large landing rewrite can reduce conversion or obscure product access. Release behind a narrowly scoped flag or retain a reversible previous composition.
- Do not use the reference HTML as production code; it is design evidence only.
