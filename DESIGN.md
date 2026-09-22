# KidHabit Hero Design System

This document is the implementation contract for KidHabit Hero. The September 2026 experience refresh intentionally separates the child and parent worlds while preserving one family brand.

## 1. Atmosphere & Identity

KidHabit Hero should feel warm, encouraging, safe, and energetic without becoming noisy. Child-facing screens use amber warmth, playful progress, and emotional display type. Parent controls use sand surfaces, indigo actions, and calm utility type. Both modes share the same brand mark, spacing, and accessibility rules.

### Brand mark

The KidHabit Hero mark is a growing sprout inside a soft guiding star: indigo-to-purple for guidance, amber for progress and reward, and a white arc for the family journey. It is implemented as the reusable `BrandMark` primitive and as stable SVG assets in `public/`, so the identity remains crisp in the header, browser tab, bookmarks, and installed shortcuts. The mark is decorative when paired with the app name and exposes an accessible label when used alone.

## 2. Color

The implementation uses Tailwind's semantic ramps rather than project-specific raw hex values. New UI must reuse these roles.

| Role | Light | Dark | Usage |
|---|---|---|---|
| App surface | `sand-50` / `white` | `zinc-950` / `zinc-900` | Page and card surfaces |
| Kid surface | `amber-50` | warm `zinc-950` | Child dashboard and child header |
| Primary text | `sand-900` | `slate-100` | Headings and key values |
| Secondary text | `sand-700` | `slate-300` | Supporting copy; avoid pale gray on white |
| Border | `sand-100` / `sand-200` | `zinc-800` / `zinc-700` | Cards, dividers, controls |
| Primary action | `indigo-600` | `indigo-600` | Main actions, links, focus |
| Primary hover | `indigo-700` | `indigo-700` | Hover state |
| Accent | `purple-600` | `purple-600` | Guidance and journeys |
| Reward | `amber-500` / `amber-700` | `amber-300` | Stars, reward emphasis, cautions |
| Success | `emerald-600` / `emerald-700` | `emerald-300` / `emerald-400` | Completed and verified states |
| Destructive | `rose-600` / `rose-700` | `rose-300` | Delete and irreversible actions |

Rules:

- Color communicates action or state. Kid Mode uses amber warmth; Parent Mode uses indigo guidance.
- Use at most one prominent gradient per screen, reserved for a meaningful hero or celebration.
- Disabled controls retain their semantic color at reduced opacity and never look interactive.
- New semantic colors require an update to this table before use.

## 3. Typography

The UI stack is self-hosted Plus Jakarta Sans with system fallbacks. Fraunces is the emotional display face for landing headlines and child greetings. JetBrains Mono is reserved for pairing codes, identifiers, and timestamps.

| Level | Tailwind pattern | Weight | Usage |
|---|---|---|---|
| Hero / greeting | `font-display text-3xl` to `text-4xl` | 700 | Landing headline and child greeting only |
| Page title | `text-xl` to `text-3xl` | `font-extrabold` | Primary dashboard or modal heading |
| Section title | `text-base` to `text-lg` | `font-extrabold` or `font-black` | Major sections |
| Card title | `text-sm` to `text-base` | `font-bold` or `font-extrabold` | Cards and records |
| Body | `text-sm` | medium/normal | Instructions and descriptions |
| Supporting | `text-sm` preferred; `text-xs` only in compact cards | medium/bold | Metadata and compact controls |
| Micro label | `text-xs` | 600–700 | Badges and dense metadata only |

Body instructions use at least `text-sm`; labels use at least `text-xs`. Tiny 10–11px text is not part of the refreshed system.

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

### Mascot avatar

- Structure: the shared `MascotAvatar` component resolves a stable `mascot:<name>` profile value to an optimized transparent PNG; legacy emoji values remain a display fallback.
- Set: Leo, Bunny, Panda, Fox, Turtle, and Bee use the same rounded 3D matte-clay proportions, eye treatment, indigo neckerchief, camera angle, and warm studio lighting.
- Selection: onboarding and profile editing show all six as named cards with a programmatic pressed state, never as an unlabeled emoji grid.
- Personalization: each mascot owns one theme color and one warm hero gradient. Selecting a mascot updates both profile fields together.
- Accessibility: meaningful standalone appearances use the mascot name as alt text; repeated decorative appearances use empty alt text.
- Performance: production master cutouts are 512×512 RGBA PNGs and render through `next/image`; generated source originals remain outside the shipped bundle.

### Card and guidance panel

- Structure: semantic content grouped in a rounded bordered surface.
- Variants: neutral record card, indigo-purple guidance panel, status callout.
- Layout: stack or wrapping cluster; one column on narrow screens.
- States: normal, empty, warning, and error content must be explicit rather than color-only.

### Framework and reward library cards

- Framework cards show stable ID, age range, title, child-facing meaning, and progress signal before any action.
- Long activity guidance expands in place with native `details`/`summary`; it must not open a viewport-breaking modal.
- Stage and domain filters use pressed-state buttons and remain horizontally scrollable or wrapping on narrow screens.
- Reward suggestions distinguish experiences from material gifts with a visible text label and Lucide icon, never color alone.
- Added and pending states disable the primary action and expose an explicit text status.

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
| Reusable primitives are still partly expressed as repeated Tailwind class sets | Existing dashboard components | Refactor is in progress and broad replacement would create visual churn | Consolidate only when a pattern is touched by domain extraction or appears three or more times |
