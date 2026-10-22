# Worker CLI Guidance — Orca Orchestration Binary

**Author:** OMP inbox coordinator (`term_a2233000-4d64-4eae-94e8-8d0474ee4abf`)
**Date:** 2026-10-21
**Scope:** coordination files only (`/tmp/goodhabit-games-*-prompt.md`, `/tmp/goodhabit-games-*-runner.py`). No source, no global PATH/symlink changes.

## The defect

`/home/opc/.local/bin/orca` is **not** the orchestration CLI — it is the Orca **GUI launcher**:

```bash
#!/usr/bin/env bash
exec /home/opc/.local/lib/orca/squashfs-root/AppRun "$@"
```

Invoked as `orca orchestration ...` it tries to start a second Electron instance and dies:

```
$ orca orchestration send --from <handle> --type status --subject probe --body probe --json
[single-instance] Another Orca instance is already running for this userData profile; exiting this launch
after requesting the existing window. If no Orca process is running, this may be an Electron/macOS
single-instance lock failure.
exit=3
```

The working CLI is **`orca-ide`**:

```bash
/home/opc/.local/bin/orca-ide -> /home/opc/.local/lib/orca/squashfs-root/resources/bin/orca-ide
```

`orca-ide orchestration send|check|ask|inbox` all work.

## The fix — use `orca-ide orchestration`, never bare `orca orchestration`

All coordination files have been patched. Every bare `orca orchestration` occurrence became `orca-ide orchestration`; **all task IDs, dispatch IDs, terminal handles, and capabilities were preserved byte-for-byte** (verified: the only `term_*` handles present are the same ones as before the patch).

| File | Bare refs patched | Result |
|---|---|---|
| `/tmp/goodhabit-games-plan-prompt.md` | 7 | OK |
| `/tmp/goodhabit-games-plan-runner.py` | 0 (already clean) | OK |
| `/tmp/goodhabit-games-qa-preflight-prompt.md` | 7 | OK |
| `/tmp/goodhabit-games-qa-preflight-runner.py` | 0 (already clean) | OK |
| `/tmp/goodhabit-games-content-audit-prompt.md` | 7 | OK |
| `/tmp/goodhabit-games-content-audit-runner.py` | 7 | OK |
| `/tmp/goodhabit-games-copilot-backend-prompt.md` | 7 | OK |
| `/tmp/goodhabit-games-copilot-backend-runner.py` | 7 | OK |
| `/tmp/goodhabit-games-ux-prompt.md` | 7 | OK |
| `/tmp/goodhabit-games-ux-runner.py` | 7 | OK |

Residual bare `orca orchestration` references: **0**. All patched `.py` files still parse (`ast.parse` OK).

## Exact executable commands for each active lane

### OpenCode — plan / P01 contracts
Terminal `term_5bd8da0d-f005-47a7-9707-cd0bffca4b85`, dispatch `ctx_24442a56d3bf`, task `task_77d50a546338`

```bash
orca-ide orchestration send --from term_5bd8da0d-f005-47a7-9707-cd0bffca4b85 \
  --type status --subject "<your task report>" \
  --body "<report paths, changes, findings and exact validation>" --json

orca-ide orchestration send --from term_5bd8da0d-f005-47a7-9707-cd0bffca4b85 \
  --type worker_done --subject "<short status>" \
  --body "<3-sentence summary>" \
  --task-id task_77d50a546338 --dispatch-id ctx_24442a56d3bf --outcome succeeded \
  --files-modified "path/a,path/b" \
  --report-path "plans/261021-daily-thinking-games/execution/contracts-handoff.md"
```

**Do not** use `--to run:run_6149b435d3ef` — that target is rejected for these dispatches (see "Run binding" below).

### Kilo — backend / test audit
Terminal `term_c52bd20c-5152-4f3a-b348-c3f059a7ce6e`, dispatch `ctx_80970244d703`, task `task_62e996a76c43`

```bash
orca-ide orchestration send --from term_c52bd20c-5152-4f3a-b348-c3f059a7ce6e \
  --type status --subject "<your task report>" \
  --body "<report path, findings, exact test evidence>" --json

orca-ide orchestration send --from term_c52bd20c-5152-4f3a-b348-c3f059a7ce6e \
  --type worker_done --subject "<short status>" --body "<3-sentence summary>" \
  --task-id task_62e996a76c43 --dispatch-id ctx_80970244d703 --outcome succeeded \
  --report-path "plans/261021-daily-thinking-games/execution/kilo-backend-test-review.md"
```

### Cline — content audit
Terminal `term_cf765fc2-1b8e-4289-b887-859b9544c37a`, dispatch `ctx_2ae5d7c6fbb2`, task `task_7034f6354f5c`

```bash
orca-ide orchestration send --from term_cf765fc2-1b8e-4289-b887-859b9544c37a \
  --type status --subject "<your task report>" \
  --body "<report path, findings, exact evidence>" --json

orca-ide orchestration send --from term_cf765fc2-1b8e-4289-b887-859b9544c37a \
  --type worker_done --subject "<short status>" --body "<3-sentence summary>" \
  --task-id task_7034f6354f5c --dispatch-id ctx_2ae5d7c6fbb2 --outcome succeeded \
  --report-path "plans/261021-daily-thinking-games/execution/cline-content-audit.md"
```

### Copilot Auto — contracts review → P04 backend
Terminal `term_47007994-8735-480c-94e8-3f064d30714e`, dispatch `ctx_83cf3ed48081`, task `task_95957c611004`

```bash
orca-ide orchestration send --from term_47007994-8735-480c-94e8-3f064d30714e \
  --type status --subject "Copilot backend report" \
  --body "<stage, findings, exact validation>" --json

orca-ide orchestration send --from term_47007994-8735-480c-94e8-3f064d30714e \
  --type worker_done --subject "<short status>" --body "<3-sentence summary>" \
  --task-id task_95957c611004 --dispatch-id ctx_83cf3ed48081 --outcome succeeded \
  --report-path "plans/261021-daily-thinking-games/execution/copilot-backend-handoff.md"
```

## Run binding — where a report must actually be sent

The four worker dispatches all live in the **outer** Run `run_d2b1a0cf783f`, but the OMP inbox is the **inner** Run `run_6149b435d3ef`. Sending to the inner Run by Run ID is rejected:

```bash
$ orca-ide orchestration send --from term_5bd8da0d-f005-47a7-9707-cd0bffca4b85 \
    --to run:run_6149b435d3ef --type status --subject "report" --body "..." --json
{"ok": false, "error": {"code": "dispatch_run_mismatch",
 "message": "Dispatch ctx_24442a56d3bf belongs to Run run_d2b1a0cf783f, not run_6149b435d3ef."}}
```

The **verified working** route is the OMP coordinator's **legacy terminal handle**:

```bash
orca-ide orchestration send --from <your own terminal handle> \
  --to term_a2233000-4d64-4eae-94e8-8d0474ee4abf \
  --type status --subject "<your task report>" --body "<...>" --json
```

Verified: a message sent this way arrives in the OMP inner-Run inbox with `run_id = run_6149b435d3ef` and is delivered by `orca-ide orchestration check --run run_6149b435d3ef --terminal term_a2233000-4d64-4eae-94e8-8d0474ee4abf`.

Sending to `run:run_d2b1a0cf783f` also works (root reads it) and is the right place for the short lifecycle `worker_done`.

### Asking the coordinator

```bash
orca-ide orchestration ask --from <your own terminal handle> \
  --question "<your question>" --options "<a,b,c>" --timeout-ms 600000
```

## Summary of the two independent blockers

| # | Blocker | Symptom | Fix |
|---|---|---|---|
| 1 | Wrong binary | `orca orchestration …` → `[single-instance] …`, exit 3 | use `orca-ide orchestration …` (all coord files patched) |
| 2 | Wrong target | `--to run:run_6149b435d3ef` → `dispatch_run_mismatch` | use `--to term_a2233000-4d64-4eae-94e8-8d0474ee4abf` (OMP inbox) |

Both were hit by the Copilot lane, whose log shows it discovering (1) on its own and then failing on (2) twice before writing `plans/261021-daily-thinking-games/execution/copilot-backend-handoff.md`.
