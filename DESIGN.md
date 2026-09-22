# KidHabit Hero Design System

This document codifies the visual system already present in the application. It is a maintenance contract, not a redesign brief.

## 1. Atmosphere & Identity

KidHabit Hero should feel warm, encouraging, safe, and energetic without becoming noisy. The signature is a rounded family dashboard that pairs indigo-to-purple guidance surfaces with amber rewards and emerald success states. Child-facing screens may be playful; parent controls remain calm, explicit, and trustworthy.

### Brand mark

The KidHabit Hero mark is a growing sprout inside a soft guiding star: indigo-to-purple for guidance, amber for progress and reward, and a white arc for the family journey. It is implemented as the reusable `BrandMark` primitive and as stable SVG assets in `public/`, so the identity remains crisp in the header, browser tab, bookmarks, and installed shortcuts. The mark is decorative when paired with the app name and exposes an accessible label when used alone.

## 2. Color

The implementation uses Tailwind's semantic ramps rather than project-specific raw hex values. New UI must reuse these roles.

| Role | Light | Dark | Usage |
|---|---|---|---|
| App surface | `slate-50` / `white` | `zinc-950` / `zinc-900` | Page and card surfaces |
| Primary text | `slate-800` | `slate-100` | Headings and key values |
| Secondary text | `slate-600` | `slate-300` | Supporting copy; avoid pale gray on white |
| Border | `slate-100` / `slate-200` | `zinc-800` / `zinc-700` | Cards, dividers, controls |
| Primary action | `indigo-600` | `indigo-600` | Main actions, links, focus |
| Primary hover | `indigo-700` | `indigo-700` | Hover state |
| Accent | `purple-600` | `purple-600` | Guidance and journeys |
| Reward | `amber-500` / `amber-700` | `amber-300` | Stars, reward emphasis, cautions |
| Success | `emerald-600` / `emerald-700` | `emerald-300` / `emerald-400` | Completed and verified states |
| Destructive | `rose-600` / `rose-700` | `rose-300` | Delete and irreversible actions |

Rules:

- Color communicates action or state; decorative gradients stay within the indigo-purple identity ramp.
- Disabled controls retain their semantic color at reduced opacity and never look interactive.
- New semantic colors require an update to this table before use.

## 3. Typography

The primary stack is `ui-rounded`, Comfortaa, Nunito, Quicksand, system UI, and sans-serif fallbacks. Codes and identifiers use the platform monospace stack.

| Level | Tailwind pattern | Weight | Usage |
|---|---|---|---|
| Page title | `text-xl` to `text-3xl` | `font-black` | Primary dashboard or modal heading |
| Section title | `text-base` to `text-lg` | `font-extrabold` or `font-black` | Major sections |
| Card title | `text-sm` to `text-base` | `font-bold` or `font-extrabold` | Cards and records |
| Body | `text-sm` | medium/normal | Instructions and descriptions |
| Supporting | `text-sm` preferred; `text-xs` only in compact cards | medium/bold | Metadata and compact controls |
| Micro label | `text-[10px]` to `text-[11px]` | bold | Badges and dense metadata only |

Body instructions should use at least `text-xs`; micro labels are limited to short, nonessential metadata and must remain legible at the configured font scale.

The root font scale is `1.125`. Light-mode supporting text uses at least the `slate-600` contrast role; `slate-400` and `slate-500` utilities are normalized to this role when legacy components still use them.

### Pricing hierarchy

- Trial state is a compact guidance/status row, not a third paid-plan card.
- Monthly and yearly offers form a balanced two-column comparison at desktop widths and a single-column stack on mobile.
- Price, billing period, primary benefit, and CTA must be visible in that order without decorative badges competing with the plan name.
- Payment instructions show the full account number, beneficiary name, resolved bank name, and BIN as separate untruncated values.

## 4. Spacing & Layout

Spacing follows Tailwind's 4px base scale. Repeated intent maps to these steps: 4px (`1`), 8px (`2`), 12px (`3`), 16px (`4`), 20px (`5`), 24px (`6`), 32px (`8`), and 40px (`10`).

- Main app content is centered and responsive; cards collapse to one column below `sm` (640px).
- Parent tab content uses vertical stacks with 24px section gaps.
- Cards use 20-24px padding and `rounded-2xl` or `rounded-3xl` radii.
- Controls must reflow without horizontal scrolling at 375px. Intrinsic mechanics such as `min-width`, `minmax()`, percentages, and wrapping remain local to the component.
- Touch targets for primary actions should be at least 44px high where the screen allows; compact icon actions must keep a clear accessible name and adequate separation.

## 5. Components

### Primary action

- Structure: native `button` with optional Lucide icon and visible label.
- Variants: indigo primary, neutral secondary, amber reward, rose destructive.
- States: default, hover, active press, keyboard focus, disabled, and loading.
- Disabled: native `disabled`, `cursor-not-allowed`, reduced opacity, no hover color change, and no press transform.
- Accessibility: visible text or localized `aria-label`; global focus ring remains visible.

### Brand mark

- Structure: the shared `BrandMark` SVG primitive with a square, rounded silhouette.
- Variants: compact header mark and standalone labelled mark; favicon assets use the same geometry without text.
- States: static by default; no decorative animation is required for recognition.
- Accessibility: `aria-hidden` when adjacent to the app name; labelled `role="img"` when standalone.

### Card and guidance panel

- Structure: semantic content grouped in a rounded bordered surface.
- Variants: neutral record card, indigo-purple guidance panel, status callout.
- Layout: stack or wrapping cluster; one column on narrow screens.
- States: normal, empty, warning, and error content must be explicit rather than color-only.

### Modal

- Structure: labelled dialog, backdrop, heading, content, and action row.
- States: open, closing, validation error, pending, success.
- Accessibility: focus trap, focus restoration, Escape close when safe, and labelled close control.

### Parent navigation tabs

- Structure: a labelled tab list with native ARIA tab state and one active panel.
- Layout: wrapping or horizontal scroll at narrow widths without clipping the active tab.
- Accessibility: selected state is programmatic and visually distinct.

### Pairing-code control

- Structure: child-specific masked/real code display plus copy, QR, and regenerate actions.
- States: signed-out/disabled, ready, copying, QR expanded, regenerating, expired, and failure.
- Signed-out behavior: show a localized account requirement; generation, copy, QR, and regenerate controls are natively disabled.
- Accessibility: each icon/compact action has a localized accessible name; codes use monospace; status text is announced with `role="status"` when appropriate.

## 6. Motion & Interaction

| Type | Duration | Usage |
|---|---|---|
| Micro | 100-150ms | Press and simple color feedback |
| Standard | 200-300ms | Panels, tab content, success feedback |
| Emphasis | 400-600ms | Rare celebration or major entry |

- Animate only transform and opacity for authored motion.
- Motion must communicate state or affordance; no decorative hover motion on noninteractive content.
- `prefers-reduced-motion` reduces animations and smooth scrolling globally.
- Disabled controls do not animate on hover or press.

## 7. Depth & Surface

The strategy is mixed tonal shift, subtle borders, and restrained shadows. Neutral cards use light borders and small shadows. Guidance and premium surfaces may use soft gradients. Modals receive the strongest elevation. Dark mode replaces bright shadows with tonal separation and borders.

## 8. Accessibility Constraints & Accepted Debt

Target WCAG 2.2 AA: 4.5:1 body-text contrast, 3:1 large-text and component contrast, visible focus, keyboard reachability, semantic disabled states, and reduced-motion support. Copy must remain usable in all nine supported locales and survive 375px, 768px, and 1280px widths.

| Item | Location | Why accepted | Owner / Exit |
|---|---|---|---|
| Compact metadata uses 10-11px text | Existing child and parent cards | Existing dense visual language; global font scale and contrast improvements reduce current risk | Replace with a responsive 12px minimum during the next card-density pass |
| Reusable primitives are still partly expressed as repeated Tailwind class sets | Existing dashboard components | Refactor is in progress and broad replacement would create visual churn | Consolidate only when a pattern is touched by domain extraction or appears three or more times |
