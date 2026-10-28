# Root acceptance — Phase01 (19Oct2026)

**Accepted** for A02/A04 scoped parent safety; files released to02b presentation colors and04b child-store correction. No commit/deploy/full07 claim.

Independent inputs: GPT implementation report phase01-resumed-gpt.md (113units,16E2E confirm exit0) and OpenCode phase01-resumed-opencode-review.md. Original REVISE B1 is preserved: real PIN403 uses bare{error,code}, notsuccess:false. Root fixed that contract plus a separately reproduced contradictory-envelope bug; OpenCode bounded text/source revalidation phase01-root-opencode-revalidation.md APPROVE task_fee45dbf00d0/ctx_1a878e7cbd85 (actual OpenCode default deepseek-v4.1-flash-free, no model/globalconfig override). Its text-only approval did not reproduce root runtime gates.

Root regression-first corrections:5actualHTTP/client-action casesRED before disallowing contradictory error/result fields;2bare-PIN403 casesRED before matching exact machine codes only. Generic uncoded/cross-site403 stays conservativeunknown, no message inference/backend change. Valid PIN metadata and existing modal flow remain. Added no architecture/deps/schema/PIN policy change. Existing partial redemption outcome, per-ID selection and family-scoped stable gates verified directly.

Final root evidence:
-121focused parent/client/copy units pass, scopedESLint and fulltypecheck exit0: .omx/ui-execution/phase01-root-verification.json.
-E1 Chromium workers1:3critical post-parser cases pass/exit0 (lost committed batch, lost committed redemption, exact bare403PIN requiring explicitretry), .omx/ui-execution/phase01-root-final-e2e.json/log. Prior full16parent cases passed/exit0 on unchanged queue/action implementation before additive parser fixes (GPT archive).
-D0 all optional flags explicitlyfalse, independent standardCLI process/copy snapshot: inline refusal, same-frame duplicate guard, ACK+failed/repeated refresh and reward approve+deliver-failure/remaining-step retry/staleACK:2/2pass/exit0 after both parser fixes, .omx/ui-execution/d0-parent/current-client-result.json/log. Manifest pins exact snapshot bytes/flags. Comments added afterward do not change parser behavior. Bulk UI absence is hard asserted, not storage flag spoofing.
-D0 server stopped by exact owned CLI PID1839880; port3108closed; E1port3107stillopen. Root next-env.d.ts/tsconfig.json unchanged. Failed custom-server/symlink setup attempts and wrong-label/too-short-refresh-timeout harness attempts remain archived, never counted as product failures or passes.

E2E PIN note: the PIN signal intentionally returns to child mode/unmounts the queue while unlocking. A newly attempted failure-copy assertion during that modal was invalid; removed it, retained real response shape and every existing selection/no-auto-replay assertion. Unit tests prove definite-refusal classification. Revalidation prompt mentioned that extra assertion before this correction; rely on final source + green runtime evidence, not that stale sentence.

Simplification: explicit acknowledged IDs replace selection-based inference; existing typed errors gain only strict outcome-field exclusion and a minimal machinecode barePIN schema. No UI/business/PIN rewrite.

Remaining integration risks: dev HMR can interrupt unrelated flows while shared files change; final stable production/flags/matrix/contrast gates still required.04b optimistic child state remains unresolved;02b/05 colors/layout are separate. Source fingerprints .omx/ui-execution/phase01-root-accepted-fingerprints.json. Whole02/04/06/07 remain unaccepted.
