---
version: 1
slug: "src-components-parentdashboard-tsx"
primary_target: "src/components/ParentDashboard.tsx"
related_targets: ["src/components/ParentApprovalsTab.tsx","src/components/ParentTodayCard.tsx","src/components/ParentNavigation.tsx","src/components/BulkTaskReview.tsx"]
---

# Parent Today — Phase03 brief

Mode: Operate. Build path: code-first for this surface only. Status: Phase03 accepted19Oct2026 by coordinator and AGY; implementation pending.

## Job, audience and outcome

Parents/caregivers review the family's pending practices and rewards without mistaking a child's summary selection for a queue filter. Preserve the calm parent identity and existing three navigation areas. Primary task is review; success means correct child identity/scope, an authoritative result and recoverable failure. Targets: `src/components/ParentDashboard.tsx`, with related existing Today/approvals/navigation components under Phase05 ownership after 01/02/03 acceptance.

## Direction contract

**THESIS:** Family review work leads; a child's summary is a separate later task with its selector inside that section.

**OWN-WORLD:** Inherit DESIGN.md's sand parent surfaces, indigo actions, shared BrandMark and utility typography; compact existing banners rather than replacing the family identity.

**STORY:** Understand the all-family queue, review identified rows, read truthful outcomes, then inspect a selected child's summary or navigate to management.

**FIRST VIEWPORT:** Existing shell/navigation → compact parent context → all-family review inbox with pending count, row identity and useful review entry/action. At 375×812 that entry or truthful empty-state next step is visible below the header. The summary selector appears only inside the later per-child summary, never above the inbox as a global filter.

**FORM:** Approved inbox-before-summary structure, directly specified narrow refinement; no concept roll or replacement world. Seed: not run (user-approved pinned composition; new-work exempts precisely specified narrow requests).

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Actor and state map

| Child branch | Actor and first action in this surface | Boundary to preserve |
|---|---|---|
| 0–3 | Caregiver leads/model-practices in the existing branch; here the adult reviews any actually pending family items. | Do not infer an infant self-checklist or manufacture approval rows. Preserve existing caregiver wording/actions. |
| 3–8 | Adult reviews guided child's submitted practice or reward. | Existing approval and PIN policy, not age-inferred permission. |
| 9–12 | Adult reviews existing submissions and later views that child's summary. | Existing tween presentation adaptations remain gated on child surfaces; no new review semantics. |
| 13+ | Adult reviews according to existing policy; teen retains existing child actions. | No automatic independence or flag enablement. Existing gated teen adaptations remain available only as implemented. |
| Unknown | Adult reviews rows with actual child identity and existing rules. | Keep unknown-age fallback; do not assign a band or change permissions. Stored `0-3` still uses caregiver behavior. |

These are preserved multi-age actors, not a commercial segment or new age classifier. PRODUCT.md links the actual age predicates, overrides and flag gate; no state or permission transition depends on a new inferred age.

| State | Review feedback / recovery contract |
|---|---|
| Pending | Explicit all-family count and child name on each task/reward row and batch summary. |
| Saving | Guard duplicate handlers and disable native controls for the active logical operation; keep row/selection context. |
| Verified / rejected / delivered | Announce only acknowledged authoritative transition; points and balances remain source-derived. |
| Command failed | Inline localized error and explicit retry; preserve context. |
| Unknown / stale / concurrent update | Reconcile authoritative state and pending IDs before retry; no whole-batch replay or per-ID success inference from an aggregate. |
| Approve succeeded, deliver failed | Show recoverable approved/unfulfilled only when approval was acknowledged or fresh state proves it. Retry the allowed remaining transition. |
| Delivery succeeded, refresh failed | Show acknowledged delivery plus refresh issue; do not repeat delivery blindly. `invalid_transition` alone proves neither approval nor idempotency. |
| PIN/auth expired | Preserve selection/context, use existing unlock flow, then explicit retry; no automatic replay or PIN bypass. |
| Empty / loading / read-only | Honest scoped explanation; no fake review CTA/count or mutation in read-only state. Separate summary loading/errors from queue state. |

## Scope, hierarchy and interaction

Inbox heading, inline/bulk tasks and rewards explicitly say all-family. Rows and batch selection identify each affected child. The summary selector changes summary alone; queue rows/counts/selected IDs and mutation scope remain unchanged (D03). Inbox comes BEFORE the entire per-child summary block; selector belongs inside that later block. Empty queue remains a clear family state; existing navigation can supply a useful next step without suggesting approvals exist.

After the inbox: compact selected-child summary → existing factual observation/history → management/settings through existing Today, Design, Family areas. Preserve section IDs, deep-link/query/reload behavior, tab keyboard semantics, pairing discoverability, PIN and reward delivery. No renamed navigation concept or new coaching/AI insight is selected here. Retain factual framework guidance through progressive disclosure. Optional reading panels stay after the useful action; if letter/journal content is exposed through related flows it must never gate review or child practice.

375×812: keep useful inbox entry/action or honest empty next step fully visible, with banner secondary and no horizontal overflow. 768×1024 and 1280×900: use available width for scanning while retaining inbox-before-summary DOM/reading order; never move selector over the inbox. Cover zero/one/many children, two children each with pending tasks/rewards, long names, large queues, mixed operation results and empty selected-child summary with nonempty family inbox. Use real source-derived counts, no invented numerical maxima.

At 100/108/118% font and 200% zoom retain labels, focus, reflow and accessible error/status prose; do not require above-fold at zoom200%. Preserve light/dark/system, reduced motion, product 44px touch targets and nine locales. Keep errors visible rather than collapsing them to meet height. Summaries and queue must remain understandable with color removed.

## Copy and boundaries

Draft semantic examples only: “Cần duyệt — tất cả bé”; “Tổng quan từng bé”; “Xem tổng quan của [Tên bé]”; “Đang lưu…”. Existing Phase01 copy across nine locales owns final wording; these examples do not override domain truth, localization or Phase01 semantics. No factual content or source copy is changed here.

Phase05 refines composition only after Phase01 behavior and Phase02 foundations are accepted. Keep Phase01 async/partial recovery semantics and tests; do not introduce a second implementation. No new dependencies, flags, claims, price changes, schema/store/PIN changes or visual world. A02/A04 runtime closure belongs to behavior/verification phases, not this brief.

## Decisions and approval provenance

`blocking_decisions: []` within the approved preservation scope only. Actual human completed-plan approval and explicit 18Oct implementation request cover all-family D03/D05 scope, inbox-before-summary, incumbent identity and multi-age preservation; see plan.md, decisions.md, accepted phase00 and coordinator dispositions in the remediation packet.

`nonblocking_decisions: [commercial age/market focus remains unknown]`.

`approved_surface_scope: existing Parent Today review hierarchy and separate per-child summary; retain all-family inline/bulk/reward semantics, security and navigation`.

Independent coordinator plus AGY review accepted19Oct2026. Phase05 requires accepted 01, 02 and 03. Code-first here sets no global workflow config.
