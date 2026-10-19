# Phase 00 — accepted baseline handoff

- Status: accepted (baseline only, not remediation completion)
- Producer: Kilo tests, OpenCode source packet, AGY design input, GPT appearance regression
- Reviewer: GPT coordinator; source/test diff inspected and independent rerun19Oct2026
- Next owners: OpenCode01, Kilo02a, GPT03
- Orca Run: run_56d76d0bd4b2
- Tasks: Kilo task_9e2b4af6ab5c/ctx_e82175e88fcc; OpenCode task_106c2c823816/ctx_0e3d8fbf07d7; GPT task_e7f1616a4c6a/ctx_25f7abd45ef1; AGY task_becfbf65cfef/ctx_bbb2425d9be5. All settled/released; custom shell resources closed.

## Identity and ownership

Base83b118367fead8a79f7918c928e4f92dbdd0590e; no UI/store edits. Fixture extension backward compatible.
- `tests/e2e/cloud-family-fixture.ts` SHA256 `bc40e88b131c4b9d48a697e014fa8ff75c2d26d9b74003b2c5910b2bdb56d257`
- `tests/e2e/ui-audit-fixture.ts` SHA256 `e06d6c9cf03d1711aebe851769445d105758c3013b41f1fbb5d1ca3e27a2e8b8`
- `tests/e2e/ui-audit-regression.spec.ts` SHA256 `53af95cd73097a8bf202035f71ec9dafb2fdb2722a17e7fb8ec2933741836d71`
- `tests/e2e/ui-audit-appearance.spec.ts` SHA256 `ecf2709b88bac1ad4bbf45dda0adb65773f0c66ff8cd6afb1d78afd0ed8f508d`

Tests parent A02/A04 transferred to01 for strengthening BEFORE implementation; child A01/helper transferred04 after01release. Appearance spec read-only to02/06; do not weaken. Shared cloud fixture extension needs explicit coordinator ownership if later changes necessary.

## Evidence

Root Node26:3369 unit tests/312files PASS; next production build PASS; budget PASS initial1604927/all4333572/largest391187bytes. Logs and baseline-summary.json under .omx/ui-execution/. Existing focused E2E10 PASS Chromium/mobile. Independent19Oct baseline regression6cases:5PASS/1expectedRED A01,29.3s, exit1; coordinator-baseline-e2e.log. Title bottom870.234375>usable737.59375 at375x812; date/optional content changes geometry, defect stable. Full typecheck exit0:coordinator-baseline-typecheck.log. GPT appearance3expectedRED A03/A05/A07 (see execution report); its lint/typecheckpass. Kilo lintpassed, its piped typecheck cannot establish globalexit; independent root check does.

Browser evidence: actual theme selector leaves app light whilebodydark; settled Pause white/amber2.1349<4.5; close38.84px/start43.17px; production console0errors; nohorizontaloverflow375/768/1280. Screenshots baseline-kid-* and baseline-parent-* under .omx/ui-execution/. D0 baseline built defaultflags; current localhost3107 is E1 WEBPACK DEV syntheticSupabase, not production (Kilo report's production label is incorrect). See COORDINATOR.md for flagallowlist. AgeTheme/DreamCity remainoff.

## Findings and explicit next coverage

A01/A03/A05/A07 browser-confirmed; A02/A04/A06/A08/A09 source-confirmed with current boundary regressions, fixespending. V01 sourceheadinggap; V02 timerfocusgap; V03 localemoji portability needs actual confirmation, not wholesale replacement; V04 devsymptom not reproduced freshproduction; V05 budgetmeasured, noLighthouse claim. Sourcecontract decisions in execution/phase00-coordinator-decisions.md override generic suggestions.

Coordinator rejects overclaims in Kilo report: demo isNOTpaired fixture, one reward isNOTtwochildreward, existing countheading doesNOTprove explicitfamily scope, requestcount>=1 doesNOTprove truthfuldeliveryfailure, silentreturn doesNOTvalidateflagoff. These gaps explicitly assigned01 strengthenedparent tests and04 realpairedfixture beforetheirbehaviorchanges. Existing storetests protect currentbehavior;01 adds async/partial regressions first. These are downstream test tasks, not unrecognized baselinepass.

User approved scopedimplementation; multia ge/incumbent defaults accepted, commercialfocus unknown nonblocking. AGY letter-before-task proposal rejected; taskfirst approved. No optionalfeatureenable, no schema/RPC/PIN changes.

Rollback baseline:remove only these scopedtestpatches, preserve unrelateddirtypaths. No productiondeployment. Acceptance authorizes01/02a/03 only; all remediations/manualexternalgates remainpending.
