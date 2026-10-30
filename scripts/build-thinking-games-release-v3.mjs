#!/usr/bin/env node
/**
 * Builds the release-365-v3 INPUT manifest from the reviewed V2 candidates: all four age tracks
 * (age_3_5, age_6_8, age_9_12, age_13_plus), status approved, with the product owner's conversation approval
 * recorded as editorial review. The output is then stamped by promote-thinking-games-release.mjs, which writes the
 * serving manifest.
 *
 * Usage: node scripts/build-thinking-games-release-v3.mjs --output <input-manifest.json>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const outputIndex = process.argv.indexOf('--output');
if (outputIndex < 0 || !process.argv[outputIndex + 1]) throw new Error('--output <path> is required');
const output = resolve(process.argv[outputIndex + 1]);

const RELEASE_VERSION = 'release-365-v3';
const REVIEWED_AT = '2026-10-30T09:00:00Z';
const REVIEWER = 'product-owner (explicit conversation approval)';
const AGE_TRACKS = ['age_3_5', 'age_6_8', 'age_9_12', 'age_13_plus'];
const dir = join(root, 'content/thinking-games/candidates/365-v2');
const candidate = JSON.parse(readFileSync(join(dir, 'candidate-manifest-v2.json'), 'utf8'));

const items = candidate.items
  .filter((item) => AGE_TRACKS.includes(item.ageTrack))
  .map((item) => ({
    ...item,
    // thinking_game_content.id is a global primary key; release-365-v1 occupies the D-prefixed ids and
    // release-365-v2 the E-prefixed ones. The F prefix keeps all three releases loadable so a rollback is only a
    // change of the trusted version.
    id: `F${item.id.slice(1)}`,
    contentVersion: RELEASE_VERSION,
    status: 'approved',
    editorial: { reviewedBy: REVIEWER, reviewedAt: REVIEWED_AT, ageReviewedBy: REVIEWER, ageReviewedAt: REVIEWED_AT },
  }));

const manifest = {
  ...candidate,
  manifestVersion: RELEASE_VERSION,
  generatedAt: REVIEWED_AT,
  ageTracks: AGE_TRACKS,
  items,
  // Placeholder so the release validator accepts the input; promote-thinking-games-release.mjs stamps the real record.
  editorialApproval: { approvalHash: '0'.repeat(64), editorialSignature: 'pending-promotion', approvedAt: REVIEWED_AT },
  status: 'approved',
};
writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ output, itemCount: items.length }));
