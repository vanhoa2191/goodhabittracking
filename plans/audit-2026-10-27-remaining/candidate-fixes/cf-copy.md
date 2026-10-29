# Candidate V2 copy fixes — lane cf-copy

## Result

Implemented source-level copy fixes for candidate generation. The existing 2,920 candidate records remain unchanged; the coordinator should regenerate the V2 content after all lanes finish, then rerun the candidate checker and review generated text.

## Findings reproduced

Scanned all 2,920 items in the current five V2 batches. In `age_3_5`, 16 items contain speed-pressure copy, 14 ask children to “đọc thầm”, 27 contain one of “lập trình”, “chuyên gia gỡ lỗi”, or “tư duy sắc bén”, and 11 invitations contain the broken phrase “khác nào”. Across the corpus, 32 explanations contain “cân cân bằng”, 24 contain “đối tượng đã đổi màu thành”, and 64 use the quoted direction “bên phải”; all 120 `flexibility-alternative` explanations are identical. At least 181 `age_13_plus` items contain one of “bạn nhỏ”, “nhí”, or “nha!” in invitation, tutorial, explanation, or hints.

## Changes

- Added age-aware invitation and tutorial pools for the identified 3–5-year-old wording and a neutral, more mature invitation/tutorial set for 13+; the V2 generator now passes the age track to invitation selection.
- Added mode-specific `quantity-grouping` tutorials for exact groups, remainders, complete groups, and the amount needed to fill another group.
- Rewrote the if–then and command-order tutorials in conversational Vietnamese, retaining only the board’s explicit constraints; removed arrows, pseudo-code framing, and the inaccurate “mọi thứ tự … đều được” claim.
- Replaced the affected generated explanations: balance wording, changed object/color description, right-direction phrasing, path-specific alternative-route description, and memory-position listing. Made shared 13+ hint/title wording neutral where it referred to “bạn nhỏ” or “nha!”.
- Extended the candidate copy checker to reject “thật nhanh” and “tính toán nhanh”.
- Updated copy regression assertions for age-aware invitations/tutorials and the changed direction phrasing.

## Verification

- `npm test -- --run tests/unit/thinking-games/round3-copy.test.ts` — passed, 20 tests.
- `npm test -- --run tests/unit/thinking-games/round2-content-fixes.test.ts -t "varies the answer direction"` — passed, 1 test.
- A broader run including `all-mechanics.test.ts` and `round2-content-fixes.test.ts` had two failures while other lanes were editing shared mechanics: the alternative-path acceptance test failed at `all-mechanics.test.ts:176`, and the direction test initially expected the old wording (updated and rerun successfully above).
- `npm run typecheck` — blocked by a TypeScript error in the concurrently added `tests/unit/thinking-games/candidate-correctness.test.ts:133` (`BoardData.targetId` does not exist). The error is outside this lane’s changes.

## Remaining work and risks

- The observation-implausible scene wording and its “bánh ngọt / nước có ga / trà sữa” examples overlap the variety lane’s generator changes; left them for that lane to avoid conflicting edits.
- Invitation/tutorial pools are still finite and some unchanged copy repeats. The regenerated catalog must be scanned again for repetition and for copy regressions after all lanes’ generator changes land.
- No candidate JSON was regenerated or edited, per the brief; source-only test results do not establish the final generated corpus.
