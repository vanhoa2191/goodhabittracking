import { describe, expect, it, vi } from 'vitest';
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
import { admitReleaseManifest, getThinkingGameCatalog } from '@/lib/thinking-games/server/catalog';
import { RELEASE_MANIFEST_DIGEST } from '@/lib/thinking-games/server/release-manifest';

function sha256(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

describe('synthetic release fixture', () => {
  it('passes release-profile validation (is the preparation baseline)', { timeout: 30000 }, () => {
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
    const serving = parseManifest(loadRelease());
    expect(serving.manifestVersion).toBe('release-365-v3');
    expect(serving.manifestVersion).not.toBe(parseManifest(loadSyntheticReleaseFixture()).manifestVersion);
    expect(serving.editorialApproval).toMatchObject({
      editorialSignature: expect.stringContaining('Product owner explicitly asked on 2026-10-30'),
    });
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

describe('approved production serving release', () => {
  it('validates the approved four-track year and admits only the pinned bytes', { timeout: 30000 }, () => {
    const raw = readFileSync(new URL('../../../content/thinking-games/manifests/release-365-v3.json', import.meta.url), 'utf8');
    const manifest = parseManifest(JSON.parse(raw));
    const digest = sha256(raw);
    expect(validateManifest(manifest, { profile: 'release' })).toMatchObject({
      ok: true,
      metrics: { itemCount: 2920, dayCount: 365, typeIds: 24, variantPairs: 96, skillCount: 8 },
    });
    expect(manifest.ageTracks).toEqual(['age_3_5', 'age_6_8', 'age_9_12', 'age_13_plus']);
    expect(manifest.locales).toEqual(['vi']);
    expect(new Set(manifest.items.map((item) => item.contentVersion))).toEqual(new Set(['release-365-v3']));
    expect(digest).toBe(RELEASE_MANIFEST_DIGEST);
    expect(admitReleaseManifest(manifest, RELEASE_MANIFEST_DIGEST, digest)).toBe(true);
    expect(admitReleaseManifest(manifest, '', digest)).toBe(false);
    expect(admitReleaseManifest(manifest, RELEASE_MANIFEST_DIGEST, sha256(`${raw}\n`))).toBe(false);
    expect(admitReleaseManifest({ ...manifest, editorialApproval: null }, RELEASE_MANIFEST_DIGEST, digest)).toBe(false);
    const unapproved = {
      ...manifest,
      items: manifest.items.map((item, index) => index === 0 ? { ...item, status: 'design_only' as const } : item),
    };
    expect(admitReleaseManifest(unapproved, RELEASE_MANIFEST_DIGEST, digest)).toBe(false);
  });

  it('admits the bundled production catalog only while its release flag is enabled', { timeout: 30000 }, () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ENABLE_THINKING_GAMES', 'true');
    vi.stubEnv('ENABLE_THINKING_GAMES_INTERNAL_CATALOG', 'false');
    const admission = getThinkingGameCatalog();
    expect(admission).toMatchObject({ ok: true, profile: 'release' });
    if (!admission.ok) throw new Error(`Release admission failed: ${admission.code}`);
    expect(admission.manifest.manifestVersion).toBe('release-365-v3');
    expect(admission.manifest.items).toHaveLength(2920);
    expect(admission.manifest.ageTracks).toEqual(['age_3_5', 'age_6_8', 'age_9_12', 'age_13_plus']);
    expect(sha256(JSON.stringify(admission.manifest, null, 2) + '\n')).toBe(RELEASE_MANIFEST_DIGEST);
    expect(getThinkingGameCatalog()).toBe(admission);
    vi.stubEnv('ENABLE_THINKING_GAMES', 'false');
    expect(getThinkingGameCatalog()).toEqual({ ok: false, code: 'catalog_not_approved' });
    vi.stubEnv('ENABLE_THINKING_GAMES', 'true');
    expect(getThinkingGameCatalog()).toBe(admission);
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

  it('passes release-profile validation after stamping approval', { timeout: 30000 }, () => {
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
