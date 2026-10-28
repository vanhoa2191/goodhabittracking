# Phase 08 — Header pointer interception

Status: reproduced on production build; leader owns remediation and post-fix verification.

## Evidence

The interrupted mobile Chromium test `parent desktop1536 @ 108% — all header controls >= 44 CSSpx after PIN` was not merely slow. Its trace `/tmp/phase08-mobile-chromium/ui-audit-appearance-A07-he-6abfc-controls-44-CSSpx-after-PIN-mobile-chromium/trace.zip` records `call@1821`: the Phụ huynh button is visible/enabled/stable, but a sibling Google-login span repeatedly intercepts the pointer. The call has 962 diagnostic log entries before interruption. Requested viewport was 1536×900; action snapshots showed an expanded 1669×978 mobile layout viewport.

The production build at `http://localhost:3111` reproduced the problem independently with Playwright Chromium's Pixel 7 context, a fresh context per font scale, service workers blocked, `vi-VN`, requested viewport 1536×900, demo entry, rounded font, light theme. Setup waited for kid-hero visibility, font loading and the configured root font scale. Each case used a normal pointer click with a bounded 5000 ms timeout; no forced clicks, DOM event dispatch, or source changes were used.

| Font scale | innerWidth / document scrollWidth | document clientWidth | Parent button x / width | Normal parent click |
| --- | --- | --- | --- | --- |
| 108% | 1669 / 1669 | 1536 | 1554.94 / 114.48 | Failed: Google-login subtree intercepted pointer |
| 118% | 1810 / 1810 | 1536 | 1683.64 / 125.91 | Failed: portrait-guide subtree intercepted pointer |

The parent button lies beyond the requested client viewport before click. Auto-scrolling during pointer action changes the hit target; the initial `elementFromPoint` at the off-client-center reported its own label and must not be treated as proof that it is actionable. Complete metrics and call errors: `/tmp/phase08-production-header.json`. Screenshots: `/tmp/phase08-production-header-large.png` and `/tmp/phase08-production-header-xlarge.png`.

A supplemental ordinary desktop Chromium context at 1536×900 and 108% had `innerWidth=1536`, `scrollWidth=1669`, `clientWidth=1536`, parent x=1554.94/width=114.48, but its normal click succeeded after automatic scrolling. Thus overflow is also present in desktop layout, while the demonstrated pointer-blocking failure is specifically reproduced with mobile Chromium behavior; do not overstate it as a universal desktop click failure.

## Code context / remediation boundary

`src/components/Header.tsx:166` puts brand/profile/control groups in one fixed-height flex row. The right group at `:222` exposes additional text controls at 2xl, including a nowrap Google-login label (`:340–345`); the parent button is shrink-0 (`:388`). The production measurements establish insufficient horizontal room and blocked interaction at enlarged text. Specific CSS remediation remains the leader's scope; do not work around this failure with force clicks or longer test timeouts. Passing geometry-only kid-header tests did not establish pointer actionability of the parent-entry target.

The separate production hydration entry/reload checks passed and are recorded in `phase08-hydration-investigation.md`; that success does not resolve this pointer defect.

## Bounded DOM-only remediation prototype

Before a source edit, the leader requested one exact prototype batch on the existing production server. Only transient DOM styles were changed in three fresh Pixel 7 contexts, retaining brand/profile columns: outer header row `height:auto`, `min-height:4rem`, vertical padding `0.5rem`; right actions group `min-width:0`, `flex-wrap:wrap`, `justify-content:flex-end`; each direct action child `flex-shrink:0`. No forced click or programmatic event dispatch was used.

| Viewport / font | Before scrollWidth | After scrollWidth / clientWidth | Header height before → after | Parent x / width after | Center hit / ordinary click |
| --- | ---: | --- | --- | --- | --- |
| 1536 / 108% | 1669 | 1536 / 1536 | 70.11 → 129.02 | 1395.61 / 114.48 | own subtree; PIN dialog opened |
| 1536 / 118% | 1810 | 1536 / 1536 | 76.52 → 136.66 | 1381.78 / 125.91 | own subtree; PIN dialog opened |
| 375 / 118% | 375 | 375 / 375 | 76.52 → 120.50 | 251.45 / 109.39 | own subtree; PIN dialog opened |

All three after screenshots were inspected: controls remain legible; wide-header actions wrap to a second row, and the narrow header's More button wraps to a second row. The profile retains its existing truncation behavior. The tradeoff is a taller header; no claim of post-PIN parent dashboard verification follows from this prototype.

Prototype metrics: `/tmp/phase08-header-prototype.json`; before/after screenshots use `/tmp/phase08-header-prototype-{1536-large,1536-xlarge,375-xlarge}-{before,after}.png`. This supports the leader's proposed small CSS repair, but is not yet evidence of the source fix or rebuilt release. The leader owns implementation and post-fix regression verification.
