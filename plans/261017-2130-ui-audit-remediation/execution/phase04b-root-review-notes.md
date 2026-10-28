# Root04b review notes (owner still implementing; not a verdict)

Preserve all parent121cases/root parser correction. At review, verify actual finished code/tests, not this in-progress observation.

- Retry intent: completion refusal409 followed by another-device/background authoritative completed snapshot, then explicit completion retry must NOT send undo. Also symmetric undo refusal/not_found + authoritative missing row then explicit undo retry must not recreate completion. Existing caller remembers isCompleting in taskRetry; a two-argument toggle inferred from current snapshot cannot distinguish retry from intentional opposite action once cached operation is settled. Test meaningful store/caller sequence; optional explicit intent is a small compatible option if needed. Unknown-only retry cases do not cover this definite-refusal concurrency edge.
- Snapshot reads must see authoritative refresh data within the same async operation, across React/provider/action recreation; boolean refreshtrue plus stale closure is insufficient. Exercise real paired fixture lost committed response followed by successful snapshot and explicit retry/no undo.
- Actual pending ACK overrides nonapproval metadata: zeroverifiedpoints/noearnedpointburst/haptic; praised points from ACK not activity metadata. BeforeACK no logs/points/badges/sound.
- ACK+refreshfalse task/reward accepted, repeated retry cannot replay/debit; unknown retry reuses identity or reconciles. New deliberate reward operation after completed command/sync gets fresh ID; no permanent reward memoization.
- Child/user/family/session switch invalidates pending callbacks and caches; intentional ordinary undo after completed/recovered operation still works. Operation-state lifetime/bounds should be clear, preserving unresolved identities while they are retryable.
- Unknown prose must communicate unconfirmed state. A UI labelled save failure cannot assert definite noncommit on network/invalid envelope. Timer boolean contract unchanged, elapsed/retry preserved.

These are review prompts; do not mark defects fixed or present without examining completed source/evidence.
