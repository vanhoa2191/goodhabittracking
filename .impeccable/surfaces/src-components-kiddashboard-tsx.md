---
version: 1
slug: "src-components-kiddashboard-tsx"
primary_target: "src/components/KidDashboard.tsx"
related_targets: []
---

# Child daily practice — Phase03 brief

Mode: Operate. Build path: code-first for this surface only. Status: Phase03 accepted19Oct2026 by coordinator and AGY; implementation pending.

## Job, audience and outcome

Help the current actor find today's existing scheduled practice and understand its real state. Show one existing first task/action, not a duplicate next-task card or recommendation. Preserve BrandMark, warm child identity, mascot choice, fire/status, rewards, history and all factual guidance. Targets: `src/components/KidDashboard.tsx`; optional cards only for authorized reorder/disclosure. Phase04 owns implementation after prerequisites are accepted.

## Direction contract

**THESIS:** A short greeting leads straight to useful daily practice; achievements never displace the task.

**OWN-WORLD:** Inherit DESIGN.md's amber child warmth, existing mascot, display greeting and semantic status language; compact them without replacing the identity.

**STORY:** Recognize whose day this is, act on a due practice, see saving/pending/verified truth, then explore progress and optional reading.

**FIRST VIEWPORT:** Retain the app shell and bottom navigation. Short greeting/identity and compact fire/status precede the day context and first useful action. At 375×812/default 108% font, the first task title and main button fit fully between header and bottomnav for child self-use; caregiver and unknown branches use the criteria below. Wallet/badges remain reachable without leading the page.

**FORM:** Approved task-first daily list, directly specified narrow refinement; no concept roll or replacement world. Seed: not run (user-approved pinned composition; new-work exempts precisely specified narrow requests).

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Actor and state map

| Branch | Primary actor and first useful action | Preservation / acceptance |
|---|---|---|
| 0–3 | Caregiver performs/models the existing due practice and records it using the incumbent control; existing handbook remains available. | Preserve stored `ageStage === '0-3'` role-model branch and wording. First viewport identifies caregiver role and useful practice/recording action (or truthful empty guidance). No infant self-reading/checklist requirement. The optional dailyJournal panel is secondary, not this role's defining action. |
| 3–8 | Child with guidance opens/completes an existing due practice; parent reviews when required. | Title plus visible main action entirely in usable 375×812 viewport. Preserve guided labels and existing mascot behavior; ageTheme traits only under the existing gate. |
| 9–12 | Child acts on existing due practice; parent review remains. | Same task geometry; existing tween traits/companion choices only where currently gated. No assumed new independence permissions. |
| 13+ | Teen acts on existing due practice; existing approval policy remains. | Same geometry; retain gated compact/companion choice and existing wording adaptation, never force ageTheme on. |
| Unknown | Current profile's incumbent actor/control remains; no new capability or band is inferred. | If stored stage is `0-3`, use caregiver criteria. Otherwise retain ordinary due-practice control with existing guidance and title/action geometry; do not assert independent child competence. Missing active profile keeps the existing fallback instead of inventing a task. |

Age labels above are UX groupings, not new profile stages or predicates. Source authority: PRODUCT.md and its age-source links; resolveAgeBand has explicit override precedence and can return null, including coarse `6-12`. Never rewrite the caregiver predicate to match a new inferred band.

| State | Visible action / feedback |
|---|---|
| Open today | Existing completion or timer action; visible text and accessible name agree. Deferral stays a labelled alternative. |
| Saving | Visible saving label, guarded handler and native disabled duplicate control; maintain context. |
| Pending approval | Explicit waiting-for-parent text; no verified fire/day/points claim. |
| Completed/verified | Show actual authoritative result; existing undo only where allowed. |
| Error / unknown outcome | Keep card/context and authoritative balance. Localized retry guidance; reconcile unknown result before retry, no blind replay. Existing anticipatory praise rolls back on failure; haptic success waits for authority. |
| Timer ended / save failed | Timer completion is distinct from saved practice; preserve elapsed result and recoverable save action/focus. |
| History / paused / read-only | Preserve day context, read-only reason and applicable existing pause boundaries; no hidden mutation affordance. Hero/fire continues to describe today separately. |
| Empty / all pending / all complete | Truthful no-due or status explanation; no invented task or duplicate completion action. Existing day/history/navigation remains reachable. |

## Interaction, layout and ranges

Sequence: compact identity + honest fire/status → day context + first useful practice → remaining scheduled list including deferred group → secondary progress/reward access and optional letter/journal/guide. Optional letter and journal are after the first useful action, in normal flow/progressive disclosure; neither requires reading or acknowledgement before practice. With several flags on, all secondary panels stay behind the primary action. Keep factual taxonomy/meaning in reachable details rather than rewriting persisted activity titles.

At 375×812 prove geometry with demo and real paired-child fixtures separately; use a nonempty, editable self-use day. Exclude the actual header/bottomnav rectangles from usable space. If no actionable practice exists, measure its truthful state explanation/appropriate existing action instead. Caregiver geometry measures caregiver context plus practice/recording control, never infant self-action. At 768×1024 and 1280×900 retain task-first reading order, readable width and natural document scroll; do not enlarge the hero to consume the task space.

Cover zero/one/many tasks, long names/titles, pending/deferred/completed mixes, today/history, light/dark/system and optional-off/on configurations. Reflow at 100/108/118% font and 200% browser zoom; above-fold is not required at zoom200%, and text must not shrink to force it. Keep labelled 44px product touch targets (larger existing age traits where active), keyboard focus, read-aloud, visible swipe alternatives, reward balance/goal, fire truth and bottomnav scroll access. No inner vertical scroll owner or removal of history to meet geometry.

## Copy and boundaries

Draft UI wording only: “Hoàn thành”, “Đang lưu…”, “Chờ ba mẹ duyệt”, “Đã hoàn thành”, “Chỉ xem”, “Chưa lưu được. Thử lại nhé.” Reuse authoritative locale copy where available; reconcile wording with actual states and all nine locales in implementation. No source copy is changed here, no factual/developmental claim or activity-title rewrite is authorized.

No new dependencies, schema/PIN changes, recommendations, reward economics, flags or visual world. Coordinator-authorized Phase04 correction may touch only the existing toggleActivity and claimReward store branches plus their regression tests, after Phase01 releases the files: remove guessed verified points/success feedback before acknowledgement, recognize actual command outcomes, and reconcile uncertainty before retry. No broader store refactor is authorized. Phase04 must lock behavior regressions from test-spec.md before presentation edits; gaps include real paired fixture and async/timer/reward recovery. This document does not close A01/A06.

## Decisions and approval provenance

`blocking_decisions: []` within the approved preservation scope only. Human completed-plan approval plus explicit 18Oct implementation request cover task-first composition, incumbent identity, multi-age/caregiver preservation and existing flag policy; see plan.md, accepted phase00 and coordinator dispositions under the remediation packet. AGY's letter-before-task suggestion is rejected by that approved task-first order.

`nonblocking_decisions: [commercial age/market focus remains unknown]`.

`approved_surface_scope: existing child daily-practice hierarchy, visible state labels, progressive disclosure; preserve existing actors, fallback, content and permissions`.

Independent coordinator plus AGY review accepted19Oct2026; Phase04 requires accepted 02 and 03. No new surface concepts or global workflow setting are authorized.
