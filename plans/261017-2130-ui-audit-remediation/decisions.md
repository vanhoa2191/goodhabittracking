# Quyết định sau review kế hoạch

## D01 — Action async trung thực (A04)

Observed: habit-actions single approve/reject và reward-actions deliver/reject hiện trả void; cloud failure không có result cho row. Bằng chứng: `src/lib/store/habit-actions.ts:53–55,279–350`; `reward-actions.ts:114–128,259–300`; `store.tsx:184–197`. Review OpenCode phát hiện phạm vi UI-only ban đầu không đủ đạt acceptance.

Decision: coordinator mở phạm vi tối thiểu reward-actions và store action declarations/caller tests trong01. Single-log tái dùng reviewLogs([id],decision) hiện hữu. Reward action trả outcome awaitable, phân biệt command outcome và refresh outcome; giữ verified/pending balance đúng server. Caller audit và local/cloud regression bắt buộc. Không thêm dependency/schema/API command, không rewrite store.

Rejected: UI-only timeout/poll suy đoán success — không phân biệt được request thất bại với sync chậm. Rejected: thêm wrapper single-log chỉ đổi tên reviewLogs — không cần abstraction mới. Legacy caller không liên quan không bị ép migration nếu không cần; type/output contract phải được kiểm thử trước đổi.

Partial delivery: approve đã thành công nhưng deliver thất bại => approved/unfulfilled, không giả pending; giữ row/recovery panel và retry đúng transition được server cho phép. Deliver đã thành công nhưng sync thất bại => báo chưa refresh, đối chiếu lại thay vì lặp side effect. Không khẳng định idempotency khi chưa có bằng chứng server.

## D02 — File ownership có thứ tự

Decision:01 sở hữu ParentApprovalsTab/BulkTaskReview và parent copy/scope tests trước;02b sửa màu sau01 accepted;05 sửa layout sau02accepted.02a core/timer/point-confirm có thể song song01. Một phase02 có2slice và chỉ accepted khi cả2xong.

Phase04 sở hữu KidDashboard headings/icons và child tests; có thể chỉnh age-band CSS sau02 nhả file.06 verify, chỉ sửa KidDashboard bằng correction task ownership rõ. FontSettingsModal trong06 do OpenCode ghi, Kilo đưa spec vùng chạm; không cùng ghi.

Rejected: cùng hai agent sửa hai đoạn của một file vì “không chung dòng” — imports/reorder/test dependencies vẫn có thể xung đột. Không tạo thêm worktree chỉ vì có parallelism; chỉ khi conflict thật không giải được bằng ownership và được ghi rõ.

## D03 — Scope và copy không chặn bugfix

Decision: tiếp tục all-family queue. Selector chỉ chọn summary và ghi “Xem tổng quan của…”; task inline/bulk heading, selection summary và reward queue có all-family scope. Chọn bé không đổi queue counts/IDs. Phase01 sở hữu parent-today copy và assertion accessible-name đang dùng “Chọn bé”, đầy đủ9locale; GPT reviewer duyệt nghĩa.03 fine-tune wording trong cùng nghĩa, không chặn bugfix01.

Rejected: mặc nhiên filter theo bé chỉ vì selected chip — thay đổi workflow và bulk semantics ngoài bugfix làm rõ phạm vi. Nếu product sau này chọn workspace theo bé, cần cập nhật contract/tests trước, không nửa-filter.

## D04 — Completion của plan khác completion của implementation

Decision: hoàn thiện tài liệu và độc lập revalidate các review qua Orca task/dispatch thật. Các report từ failed dispatch vẫn là input có ích nhưng không sửa lịch sử thành successful. Nếu runtime/model không chạy được, ghi chính xác failure và phần review chưa có; không thay provider/model mà giấu user. Accepted phase packet chỉ được điền sau code/test evidence, không sau planning.

Review artifacts: [OpenCode](reviews/opencode.md), [Kilo](reviews/kilo.md). Runbook chứa IDs, recovery và final provenance. Các quyết định này thuộc scope lập kế hoạch đã được user giao, không cần xin lại permission cho lựa chọn triển khai reversible; câu hỏi product theo Impeccable init vẫn là checkpoint03 trước visual-world replacement.

## D05 — Xử lý5 điều kiện REVISE từ AGY Gemini

1. Age fit:không áp child-self-action geometry lên0–3. Bảo toàn caregiver-led branch và unknown-age fallback;03chốt actor/action map và flag policy trước04.
2. Scope cognitive mismatch:family inbox ở trước; selector nằm trong section summary riêng phía sau. Family queue không kế thừa chip selection như filter.01label guard và05composition guard cùng bắt buộc.
3. Child recovery:thêm state machine saving/authoritative result/error/unknown; retry, rollback praise, haptic, timer-save và reward balance cases trong04/test-spec.
4. Bulk recovery:verify atomicity/outcome, resync pending IDs trước retry, xử lý PINexpiry/concurrent device, không suy per-ID từ aggregate hoặc replay whole batch mù.
5. Handoff gating:03accepted chỉ khi blocking_decisions rỗng, approved scope rõ và product confirmation cần thiết đã có; pending critical choices chặn04/05, không giả accepted. Các quyết định thương mại không tác động scope được đánh dấu nonblocking.

Đây là sửa kế hoạch và acceptance, chưa có xác nhận UI/runtime behavior đã được triển khai. [Review AGY gốc](reviews/agy-gemini.md) giữ nguyên REVISE để có lịch sử; lần revalidation sau sẽ có artifact riêng.

## D06 — Acceptance cuối cho kế hoạch

OpenCode [APPROVE](reviews/opencode-final.md) xác nhận năm điều kiện kiến trúc đã vào phase scope/sequence. AGY [APPROVE](reviews/agy-gemini-final.md) xác nhận năm điều kiện D05 đã giải quyết ở tầng plan. Kilo [APPROVE](reviews/kilo-plan-approved.md) sau phân định rằng các test chưa viết/chạy là work của phase00–07, không phải thiếu đặc tả khi test-spec đã nêu case và gate. [Kilo REVISE trước đó](reviews/kilo-final.md) giữ làm inventory khoảng trống hiện hữu, không bị xóa/đổi verdict.

Coordinator chấp nhận planning packet ready-for-phase-00, không chấp nhận implementation/release. Review nhiều công cụ qua Orca đã có actual outputs; các lifecycle completion được manual recovery khi CLI không gửi worker_done, chi tiết tại orchestration.md. Không giả test/build pass hoặc chốt thay product confirmation03.

## D08 — Split child work by file ownership to shorten the execution dependency chain (19Oct2026)

Coordinator may dispatch **04a child presentation/caller feedback** after **02a core foundations and03 contracts are accepted**, provided the child regression-preparation worker has released its files. Parent-only02b colors do not affect child files.04a owns KidDashboard, timer caller/save presentation contract, child copy/tests, optional scoped demo disclosure; it must not write habit-actions/reward-actions/store declarations or their unit tests while01 owns them.04a remains a partial slice, not Phase04 acceptance.

**04b bounded child store correction** still waits for01 accepted and released store files. Phase04 acceptance requires04a+04b and the complete behavioral/visual gates.05 still waits01+02a+02b+03.06 still waits full04+05. No functional requirement, phase exit criterion, security rule, public flag or design direction changes. This replaces only the overbroad04 start dependency on parent-only02b; safe file ownership is the reason. No source task is dispatched before its required predecessor handoff is accepted.

## D09 — independent header/theme touch slice

Coordinator splits06a1 Header/ThemeSelector touch geometry from06a2 timer/focus/globalmotion.06a1 may run after02a+03 and04a release because it neither edits nor depends on pending parent/store/layout files. Whole06 still waits full04+05 and06a2+06b; no gate or audit closure waived. Kilo owns Header/ThemeSelector and scoped appearance regression only; GPT inclusive test file and active parent correction remain exclusive.

## D10 — isolated font-settings slice

06b may implement the already specified font-label localization/full-copy/touch fix after02a/03 and released04a. It owns only appearance-context, FontSettingsModal, appearance copy and focused locale tests, so it has no write or functional dependency on parent01/05 or child store04b. Full06 still requires full04+05 and06a1+06a2+06b. This removes an unnecessary scheduling delay without changing product scope or final gates. OpenCode remains named owner; second provider process has disjoint files under max3worker cap.

## D12 — recover stalled parent01 lane

OpenCode01 follow-up ischeckpointed/stopped afterrepeatedwhole-suite runs ofknown04breds andno remainingUI/per-ID implementation; actualsource/probe confirmsunfinished01. Preserveallwork, fenceandcloseexactworker, verify0promptmatches, transferparent01completiontoGPTexecutor (samepreviousregression-prepsession). This changesexecutionowner forquality/progress, notscopeoracceptance. OpenCode06bcompletedindependently and05remainsOpenCodeunlesslaterconcreteblocker.01stillunaccepted;02b/04b/05depsunchanged.

## D11 — independent timer and motion slice

06a2 may run after accepted04a/02a/03 and the timer file release.04b is explicitly restricted to adapting its outcome inside KidDashboard while preserving Timer onCompletePromise<boolean>; any timer API change requires a coordinated file transfer. This allows timer touch/focus/ARIA and authored motion fixes to proceed independently of the parent/store lane. GPT owns this state-sensitive slice plus two verified leaderboard heading tag corrections; Kilo retains Header/ThemeSelector. Whole06 still waits full04+05 and all06 slices/integration. After AGY06b text review, the same dispatch owns only the one Korean playful-font label correction; font modal/context stay released and unchanged.

## D13 — complete 04b after the GPT worker's usage limit

The resumed GPT 04b worker exited 1 after reporting its account usage limit; its supervised task is marked failed and its exact terminal is closed. Preserve the partial store/client/UI work and the authored regressions. The coordinator takes ownership of completing and verifying the same 04b scope. No authorization, provider settings, phase requirements, or acceptance criteria change. Root review adds explicit opposite-toggle concurrency cases, bounded settled outcomes, and coordinator-run unit/type/lint/E2E evidence before independent review.
