# Orca orchestration và phase handoff

## Authority và trạng thái

Skill dùng: `/home/opc/.agents/skills/orchestration/SKILL.md` và companion `orca-cli/SKILL.md`; guide version-matched lấy từ `orca-ide skills get orchestration`. CLI đã resolve cho phiên này là **orca-ide**, runtime1.4.190. Không dùng native subagents thay Orca task/dispatch. Timeline bên dưới giữ cả lỗi phiên trước và trạng thái recovery phiên tiếp tục.

Run planning: `run_5834f483da83`. Coordinator ban đầu `term_ffacd283-c336-4078-95bf-4cd770ca6076`; sau runtime restart đã bind lại bằng run-use tại terminal hiện tại `term_2c1a10c3-6a25-48e3-813b-2a729085a51b`, consumer_generation2. Phase implementation00–07 chưa dispatch. Plan này không tự triển khai hay deploy.

## Roster và launch

- GPT: coordinator hiện tại và executor theo phase; nếu cần fresh GPT, dùng agent `codex`, model chỉ định khi đã xác nhận current model contract, không hardcode model cũ.
- OpenCode: CLI installed; `opencode models` trả provider/model catalog. Orca agent `opencode`; model thực tế cần ghi từ launch/TUI, không coi catalog là successful authentication.
- Kilo: CLI installed; Orca agent `kilo`; model theo cấu hình thực tế. Không áp `worker-start --model` cho Kilo vì CLI này chỉ hỗ trợ model override Claude/Codex/Cursor.
- AGY: `agy models` xác nhận `gemini-3.8-flash-high`, medium,low; user yêu cầu Gemini3.8Flash trong AGY nên launcher là `agy --model gemini-3.8-flash-high --mode plan` cho review. Khi implementation được giao, chọn mode thích hợp theo task nhưng không dùng skip-permissions như cách chữa credit/auth.

Orca worker-start lần đầu với OpenCode/Kilo gặp `agent_prompt_stalled` ở dispatch_input trong lúc TUI startup. Đây là failed dispatch, **không phải review hoàn tất**. Chỉ retry sau đọc terminal và xác nhận idle; reuse đúng terminal nếu chưa có work active, ghi `--retry-of`. AGY lần đầu cần workspace trust; đã có quyền làm việc trong repo nên coordinator xử lý prompt thông thường; banner ban đầu có “AI: Out of credits”, cần một dispatch thực để xác nhận khả năng chạy. Không sửa tài khoản, mua credit hoặc đổi model silently.

### Attempts thực tế trong lượt lập kế hoạch

| Lane | Task | Dispatch | Kết quả quan sát |
|---|---|---|---|
| OpenCode lần1 | task_fde583712a6f | ctx_78f1210bd79c | failed, dispatch_input, agent_prompt_stalled |
| OpenCode retry sau idle | task_fde583712a6f | ctx_90c0a4318a88 | failed, dispatch_input, agent_prompt_stalled |
| Kilo lần1 | task_e137c9897202 | ctx_0ae518b2bb9d | failed, dispatch_input, agent_prompt_stalled |
| Kilo retry sau startup | task_e137c9897202 | ctx_c230bdc73455 | failed, dispatch_input, agent_prompt_stalled |
| AGY Gemini | task_f22e75c69449 | chưa nhận được ID | worker-start --terminal trả runtime_timeout; outcome unknown, không redispatch trước reconciliation |

TUI OpenCode ban đầu hiển thị Big Pickle; Kilo hiển thị Claude Sonnet4.6 Perplexity Agent; đây là lựa chọn cấu hình quan sát được, không phải review thành công hoặc lựa chọn model mới của coordinator. AGY trust đã xử lý, TUI plan/Gemini3.8Flash xác nhận, có banner Out of credits ở đầu phiên. Chưa có report/worker_done nào được nhận và nghiệm thu. GPT viết kế hoạch, không giả báo được các lane này phê duyệt.

Sau retries, RPC `check`, `dispatch-show` và `worker-release` trả runtime_unavailable. Đã gọi `orca-ide open --json` để recovery theo skill; không reset runtime database, không dùng process kill và không tác động các terminal có sẵn của user. Cleanup worker chưa được xác nhận; khi runtime trở lại phải reconcile dispatch state, archive output rồi release đúng terminal. Không tạo dispatch AGY mới khi attempt outcome còn unknown.

Recovery inventory: OpenCode terminal `term_c2332fe7-c7a1-43f2-9d8a-ffcfd954f005`, Kilo `term_7182e492-ceb7-46c4-b537-a79eed667f20`, AGY coordinator-created `term_2f6aaf30-c72b-42f5-b4be-843432a4e8b8`. Chỉ xử lý các terminal này sau runtime liveness/ownership check; không đóng terminal nghiên cứu khác. Trước khi triển khai phase00, giải quyết provenance/resource cleanup và chạy lại review còn thiếu bằng dispatch mới sau khi attempt cũ settle.

Kết quả recovery cuối lượt: `status` trả app.running=false, runtime.state=stale_bootstrap, reachable=false; `open` kết thúc với runtime_open_timeout (không thấy desktop window). Không thể xác nhận worker cleanup hoặc lifecycle settlement khi RPC chưa hoạt động. Đây là external runtime blocker cho review/dispatch, không cản việc hoàn tất tài liệu kế hoạch. Không lặp open/reset/launch để tránh tạo thêm tài nguyên không rõ trạng thái.

### Phiên tiếp tục — runtime đã phục hồi

Runtime mới `f2bab0ea-15fd-4a9d-a9f7-867c74d582c2` reachable, desktop available. Terminal list chỉ còn coordinator và shell của user; các worker cũ không còn live trong runtime hiện tại. Release các dispatch cũ trả retained/identity_unproven và processAction=none; không cưỡng ép đóng handle cũ hoặc sửa lịch sử failed thành successful. Hai artifact OpenCode/Kilo thực tế đã tồn tại từ lần trước; được đọc như review input có provenance failed, cần revalidation riêng.

Để tránh agent_prompt_stalled của TUI, dùng custom **headless CLI** trong terminal Orca được tạo riêng: task-create → terminal-create bash → dispatch --return-preamble → đưa exact preamble+task vào prompt file private → terminal-send chạy CLI. Đây là đường low-level bare-shell/manual delivery trong guide; không phải native subagent và không giả `injected=true`. File receipt/prompt có capability chỉ ở `.omx/ui-plan-review/` gitignored, chmod600; không copy token vào plan/report. Các command `--model` của AGY chỉ định đúng model user yêu cầu; OpenCode/Kilo dùng cấu hình CLI hiện hữu (log OpenCode big-pickle; Kilo kilo-auto/free ở headless), không thay đổi account/model defaults.

| Review mới | Task | Dispatch | Trạng thái |
|---|---|---|---|
| OpenCode final | task_ab700a22a6ae | ctx_fad2f37e1b6b | Completed manual recovery; stdout APPROVE,5conditions resolved |
| Kilo coverage review | task_10ba705dd3eb | ctx_cf7e74494179 | Completed manual recovery; report REVISE về tests chưa triển khai, lifecycle auto-denied |
| AGY tool-enabled attempt | task_7cad13463c79 | ctx_14f2b5146272 | Failed, headless command permission auto-denied; process exit0 nhưng không có review, coordinator manual failure recovery |
| AGY text-only review | task_359e063dafac | ctx_d66b86cc3a26 | Completed manual recovery; actual stdout verdict REVISE,5điều kiện đã vào D05 |
| AGY text-only revalidation | task_d982b3846369 | ctx_9c9dd010901b | Completed manual recovery; actual stdout verdict APPROVE,0planning blockers |
| Kilo planning-sufficiency clarification | task_a4c75b0a86b9 | ctx_19d1f10346ba | Completed manual recovery; actual stdout APPROVE, mọi gap đã nằm trong test-spec/gates |

AGY review text-only dùng nội dung tài liệu đầy đủ đính kèm, không cần tool filesystem/shell nên không mở rộng permission hoặc dùng skip-permissions. Không claim worker_done: coordinator kiểm actual output, archive artifact rồi task-update completed với manualRecovery=true; review REVISE cũng là review completed. Original task_f22e75c69449 không có dispatch và đã được coordinator đánh dấu failed/superseded để không để ready task mồ côi. AGY model đã thực sự trả2review, vì vậy banner Out of credits cũ không được dùng như kết luận model vẫn không chạy được.

Artifacts: [AGY review gốc](reviews/agy-gemini.md), [AGY final APPROVE](reviews/agy-gemini-final.md), [decision log](decisions.md). Final report chỉ normalize link formatting, không sửa verdict. AGY shell do coordinator tạo đã xác nhận CLI exit0/idle và đóng; worker-release các low-level dispatch trả retained/no_owned_resource nên terminal-close exact shell là cleanup cần thiết. Không chạm shell có sẵn của user.

### Kết thúc lượt hoàn thiện plan

OpenCode thực sự đọc amended plan và trả report APPROVE trong stdout nhưng chỉ in lệnh lifecycle, không thực thi và không viết file. Coordinator archive phần report vào [opencode-final.md](reviews/opencode-final.md), bỏ ví dụ lệnh chưa chạy, task-update completed với manualRecovery=true; không giả worker_done. Kilo đã ghi [kilo-final.md](reviews/kilo-final.md) nhưng gửi lifecycle qua tên tool không tồn tại rồi bị headless permission auto-reject, CLI exit1. Report vẫn được lưu là review REVISE; task được manual-settle với limitation rõ. Coordinator không chạy lại lệnh bị từ chối hoặc bật --auto/skip-permissions.

Lượt Kilo text-only sau đó phân biệt kế hoạch kiểm thử với test đã triển khai và trả [APPROVE](reviews/kilo-plan-approved.md) cho planning sufficiency; chưa khẳng định test pass. CLI exit0, actual output được archive, task manual completed. Các shell OpenCode/Kilo do lượt này tạo đều được đọc xác nhận CLI đã exit/idle, worker-release low-level returned retained/no_owned_resource rồi terminal-close đúng handle. Không để worker còn chạy bị dừng chỉ vì chậm.

**Final planning result:** GPT coordinator acceptance + OpenCode APPROVE + Kilo APPROVE + AGY Gemini3.8Flash APPROVE. Tất cả review artifacts giữ nguồn/stdout provenance, các REVISE gốc không bị xóa. Đây là review đa công cụ có manual lifecycle recovery, không mô tả là auto-injected workers đều đã gửi worker_done hoặc là OMX consensus workflow. Phase implementation00–07 vẫn not-started; bước tiếp theo thuộc phase00 theo plan, không có deploy/commit/app edit trong lượt này.

## Protocol thực thi từng wave

1. Bind đúng Run hoặc tạo Run execution riêng khi user giao triển khai; đọc `run-current`, `task-list --brief`, `dispatch-show` nếu kế thừa. Không reset các run khác.
2. Từ phase accepted inputs, tạo task spec có scope/files/test/gate/next owner. Tạo đủ task độc lập rồi start tất cả trước khi wait. Không tạo task pending không người theo dõi rồi gọi đó là đang chạy.
3. Cùng checkout mặc định vì artifacts và working changes chưa commit; file ownership giải quyết conflicts. Chỉ tạo child worktree khi có conflict thực cần checkout riêng, nêu lý do và dùng Orca create/setup. Không raw git worktree vì tiện.
4. Dùng `worker-start` bình thường; khi custom CLI argv cần terminal create, đọc readiness trước injected dispatch. Shell chưa ready thì không paste prompt code vào shell. AGY plan mode có thể chỉ cho output; nếu không ghi report được, coordinator archive output với provenance rõ, không giả worker authored file.
5. Wait bằng rolling `check --wait --types worker_done,escalation,question --timeout-ms 45000 --json`; timeout là checkpoint, không là lỗi worker. Process đầy đủ FIFO Delivery rồi ack exact deliveryId. Trả question bằng reply đúngmessageId, không re-ask trùng.
6. Worker gửi `worker_done` đúng active IDs/capability từ preamble, explicit outcome. Coordinator không giả message từ worker, không tự coi text cuối là lifecycle settlement. Reviewer độc lập đọc diff/evidence, đánh giá phase accepted/needs-fix.
7. Khi settle, reuse ngay cùng terminal cho next dispatch hoặc `worker-release`. Với custom/preexisting terminal release có thể retained vì không có owned resource; đọc result, chỉ close terminal coordinator tự tạo khi đã xác nhận không user-taken-over và không work active. Không đụng terminal nghiên cứu app khác của user.

## Lệnh mẫu cho người điều phối

Placeholder cần thay bằng IDs trả về, không chạy literal:

```bash
rtk proxy orca-ide orchestration run-current --json
rtk proxy orca-ide orchestration task-create --task-title 'UI phase NN' --spec '<bounded task, owner files, tests, output packet>' --json
rtk proxy orca-ide orchestration worker-start --task <task_id> --worktree current --agent opencode --timeout-ms 45000 --json
rtk proxy orca-ide orchestration task-list --brief --json
rtk proxy orca-ide orchestration dispatch-show --task <task_id> --json
rtk proxy orca-ide orchestration check --wait --types worker_done,escalation,question --timeout-ms 45000 --json
rtk proxy orca-ide orchestration worker-release --dispatch <settled_dispatch_id> --json
```

AGY custom launcher: terminal-create → tui-idle/read → worker-start --terminal (preferred) hoặc dispatch --inject. Nếu runtime từ chối recognizedCLI injection, dùng đường low-level được guide cho phép với task+dispatch provenance và manual prompt delivery; ghi chính xác limitation. Không gửi lifecycle token vào báo cáo/source; receipt/log phải redact capability.

## Gate và handoff

No phase starts until required packets accepted. Không gắn acceptance chỉ vào deps task completed: review-only worker_done không cấp quyền edit. Runtime deps dùng cho task hữu hạn trong wave, phase graph dùng packet acceptance để tránh dependency chain dài khó kiểm soát. Mỗi phase packet theo `handoffs/TEMPLATE.md`; người nhận tiếp tục từ files/evidence, không yêu cầu user lặp context.

3 lỗi liên tiếp cùng task: dừng auto retry theo circuit-breaker, ghi infra blocker và phương án thay thế công khai; không loop. Worker còn sống/output nhưng chậm: tiếp tục rolling waits, không restart để tiết kiệm tưởng tượng. Không tự đổi model/provider khi user đã chỉ định AGY.

## Scope an toàn của plan

Được phép: tạo tài liệu, đọc code, chạy bounded planning reviews qua Orca. Không được suy rộng lượt này thành triển khai app, đổi account/model defaults, cài dependency mới, deploy hoặc public share. Một lần giao triển khai sau này sẽ kích hoạt00 và các wave theo plan; không cần xin lại permission cho các thao tác reversible đã nằm trong scope đó.
