# Admission security follow-up

## Completed

- Removed unconditional `request.jwt.claim.internal_catalog` mutation from paired and parent gameplay functions.
- Restricted design-only admission to the trusted service-role request claim; authenticated callers, including forged `internal_catalog` claims, cannot admit pending content.
- Parent service wrappers now restore the trusted service-role claim after `act_as_user`, preserving internal pilot positive behavior without granting direct authenticated execution.
- Replaced the advisory lock implementation with the accepted deterministic formula:
  `('x' || substr(md5('thinking_games:' || child_uuid), 1, 16))::bit(64)::bigint`.

## Evidence

- `thinking-games-admission-security-runtime.mjs`: PASS (service-role boundary, explicit trusted positive, authenticated claim forgery denied).
- `thinking-games-catalog-runtime.mjs`: PASS (28 real design-only payloads, paired and parent starts, retry/correct finish, ACL, pinned restart).
- `thinking-games-habit-parity-runtime.mjs`: PASS.
- `thinking-games-runtime.mjs`: PASS.

Final migration SHA-256 after this slice: `fb68fe3e4ef6e63cf8222dd88a94896b75775ffb17303f71072daaac78013f6a`.

## Remaining review gates

This bounded slice did not change age-track schema, bedtime/quiet-window admission, family-pause admission, or full authority-race evidence. Those require the next coordinated SQL review; no pass is claimed for those matrix cases.
