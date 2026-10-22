import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

import {
  parseManifest,
  validateManifest,
} from '@/lib/thinking-games';
import {
  loadApprovedRelease,
  loadRelease,
  loadSyntheticReleaseFixture,
} from './helpers';

function sha256(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

describe('synthetic release fixture', () => {
  it('passes release-profile validation (is the preparation baseline)', () => {
    const fixture = loadSyntheticReleaseFixture();
    const result = validateManifest(fixture, { profile: 'release' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.metrics).toMatchObject({
        coverageKind: 'release',
        dayCount: 365,
        itemCount: 1460,
        typeIds: 24,
        variantPairs: 96,
        skillCount: 8,
        equalSkillDays: 0,
      });
    }
  });

  it('is NOT the same as the serving release manifest', () => {
    const serving = loadRelease() as { status: string; items: unknown[]; editorialApproval: null };
    expect(serving.status).toBe('not_ready');
    expect(serving.items).toHaveLength(0);
    expect(serving.editorialApproval).toBeNull();
  });

  it('has the correct item count for 2 age tracks × 365 days × 2 slots × 1 locale', () => {
    const manifest = parseManifest(loadSyntheticReleaseFixture());
    expect(manifest.items).toHaveLength(365 * 2 * 2 * 1);
  });

  it('covers days 1..365 for both age tracks', () => {
    const manifest = parseManifest(loadSyntheticReleaseFixture());
    const age68Days = new Set(
      manifest.items
        .filter((item) => item.ageTrack === 'age_6_8')
        .map((item) => item.dayIndex),
    );
    const age912Days = new Set(
      manifest.items
        .filter((item) => item.ageTrack === 'age_9_12')
        .map((item) => item.dayIndex),
    );
    expect(age68Days.size).toBe(365);
    expect(age912Days.size).toBe(365);
    for (let day = 1; day <= 365; day += 1) {
      expect(age68Days.has(day)).toBe(true);
      expect(age912Days.has(day)).toBe(true);
    }
  });

  it('has approved status and editorial on every item', () => {
    const manifest = parseManifest(loadSyntheticReleaseFixture());
    for (const item of manifest.items) {
      expect(item.status).toBe('approved');
      expect(item.editorial).not.toBeNull();
    }
  });
});

describe('synthetic release fixture - promotion artifact', () => {
  const approved = loadApprovedRelease() as {
    manifestVersion: string;
    isPilotFixture: boolean;
    editorialApproval: {
      approvalHash: string;
      editorialSignature: string;
      approvedAt: string;
    };
  };

  it('passes release-profile validation after stamping approval', () => {
    const result = validateManifest(approved, { profile: 'release' });
    expect(result.ok).toBe(true);
  });

  it('has isPilotFixture set to false (never a pilot in production)', () => {
    expect(approved.isPilotFixture).toBe(false);
  });

  it('has an editorialApproval block with hash, signature, and timestamp', () => {
    expect(approved.editorialApproval).toMatchObject({
      approvalHash: expect.stringMatching(/^[0-9a-f]{64}$/),
      editorialSignature: expect.any(String),
      approvedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
    });
  });

  it('binds the approval hash to the EXACT synthetic fixture content', () => {
    const fixturePath = new URL(
      '../../../content/thinking-games/fixtures/synthetic-release-manifest-v1.json',
      import.meta.url,
    );
    const raw = readFileSync(fixturePath, 'utf8');
    expect(sha256(raw)).toBe(approved.editorialApproval.approvalHash);
  });
});
