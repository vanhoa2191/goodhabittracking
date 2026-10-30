/**
 * Generates a synthetic, explicitly-labeled release-fixture manifest for testing
 * the production admission path.
 *
 * This script does NOT generate new puzzles — it reuses the engine-generated
 * candidate puzzles from content/thinking-games/candidates/365-v1/candidate-manifest-v1.json,
 * filters them to the two initial production age tracks (age_6_8, age_9_12), and
 * marks them with synthetic "approved" status and synthetic editorial metadata.
 *
 * The resulting fixture is ONLY safe for tests.  It is never loaded by the
 * serving catalog (catalog.ts reads release-365-v3.json from manifests/).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const candidatePath = join(root, 'content/thinking-games/candidates/365-v1/candidate-manifest-v1.json');
const fixtureDir = join(root, 'content/thinking-games/fixtures');
const fixturePath = join(fixtureDir, 'synthetic-release-manifest-v1.json');

const candidate = JSON.parse(readFileSync(candidatePath, 'utf8'));

const PRODUCTION_AGE_TRACKS = ['age_6_8', 'age_9_12'];
const SYNTHETIC_CONTENT_VERSION = 'synthetic-release-fixture-v1';

const SYNTHETIC_EDITORIAL = {
  reviewedBy: 'synthetic-test-fixture',
  reviewedAt: '2026-01-01T00:00:00.000Z',
  ageReviewedBy: 'synthetic-test-fixture',
  ageReviewedAt: '2026-01-01T00:00:00.000Z',
};

const SYNTHETIC_APPROVAL = {
  reviewer: 'synthetic-test-fixture',
  reviewedBy: 'synthetic-test-fixture',
  approvedAt: '2026-01-01T00:00:00.000Z',
  note: 'SYNTHETIC FIXTURE — NOT for production use. Tests only.',
};

// Filter candidate items to production age tracks + 1 locale, then stamp synthetic approval.
const items = candidate.items
  .filter((item) => PRODUCTION_AGE_TRACKS.includes(item.ageTrack) && item.locale === 'vi')
  .map((item) => ({
    ...item,
    contentVersion: SYNTHETIC_CONTENT_VERSION,
    status: 'approved',
    editorial: SYNTHETIC_EDITORIAL,
  }));

const fixture = {
  schemaVersion: 1,
  manifestVersion: 'synthetic-release-fixture-v1',
  generatedAt: '2026-01-01T00:00:00.000Z',
  isPilotFixture: false,
  minFormatSpacingDays: 7,
  spacingException: null,
  locales: ['vi'],
  ageTracks: PRODUCTION_AGE_TRACKS,
  coverage: {
    dayCount: 365,
    slotsPerDay: 2,
    typeIds: 24,
    variantPairs: 96,
  },
  items,
  editorialApproval: SYNTHETIC_APPROVAL,
  fingerprintIndexVersion: SYNTHETIC_CONTENT_VERSION,
  status: 'synthetic_approved_fixture',
};

mkdirSync(fixtureDir, { recursive: true });
const raw = JSON.stringify(fixture, null, 2) + '\n';
writeFileSync(fixturePath, raw);

const digest = createHash('sha256').update(raw).digest('hex');
console.log(JSON.stringify({
  ok: true,
  fixturePath,
  digest,
  itemCount: items.length,
  ageTracks: PRODUCTION_AGE_TRACKS,
}, null, 2));
