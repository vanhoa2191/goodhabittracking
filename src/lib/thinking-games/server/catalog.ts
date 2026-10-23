import 'server-only';

import releaseManifest from '../../../../content/thinking-games/manifests/release-365-v1.json';

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseManifest, toGradingData, toPublicPuzzle, validateManifest } from '@/lib/thinking-games';
import type { GradingData, PublicPuzzle, PuzzleItem, ThinkingGamesManifest } from '@/lib/thinking-games/types';
import { getServerFeatures } from '@/lib/server-features';
import { RELEASE_MANIFEST_DIGEST, RELEASE_MANIFEST_VERSION } from './release-manifest';

export type ThinkingGameCatalogProfile = 'release' | 'internal-pilot';
export type CatalogAdmission =
  | { ok: true; profile: ThinkingGameCatalogProfile; manifest: ThinkingGamesManifest }
  | { ok: false; code: 'catalog_unavailable' | 'catalog_not_approved' };

let admittedRelease: Extract<CatalogAdmission, { ok: true }> | undefined;

function parseManifestFrom(raw: string): ThinkingGamesManifest {
  return parseManifest(JSON.parse(raw) as unknown);
}

function manifestDigest(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * Pure admission check for the release profile.  Every gate must pass;
 * the function fails closed on any missing piece.
 *
 * Required evidence:
 *  1. manifest.isPilotFixture === false
 *  2. non-empty items
 *  3. at least one approved item
 *  4. manifest.editorialApproval !== null  (human sign-off record)
 *  5. RELEASE_MANIFEST_DIGEST is non-empty  (trusted digest pinned)
 *  6. computed manifestDigest === trustedDigest
 *  7. validateManifest(manifest, { profile: 'release' }) succeeds
 *
 * No single gate — especially the server flag alone — grants admission.
 */
export function admitReleaseManifest(
  manifest: ThinkingGamesManifest,
  trustedDigest: string,
  manifestDigestValue: string,
): boolean {
  if (manifest.isPilotFixture) return false;
  if (manifest.items.length === 0) return false;
  if (!manifest.items.some((item) => item.status === 'approved')) return false;
  if (manifest.editorialApproval === null) return false;
  if (!trustedDigest) return false;
  if (manifestDigestValue !== trustedDigest) return false;
  const result = validateManifest(manifest, { profile: 'release' });
  if (!result.ok) return false;
  return true;
}

export function getThinkingGameCatalog(): CatalogAdmission {
  const features = getServerFeatures();
  if (features.thinkingGamesInternalCatalogEnabled) {
    const raw = readFileSync(
      join(process.cwd(), 'content/thinking-games/pilot/pilot-manifest-v1.json'),
      'utf8',
    );
    const manifest = parseManifestFrom(raw);
    if (!manifest.isPilotFixture || manifest.items.length === 0) return { ok: false, code: 'catalog_unavailable' };
    return { ok: true, profile: 'internal-pilot', manifest };
  }

  // Release path — fail closed unless:
  //   (a) the production-eligible release master flag is explicitly enabled AND
  //   (b) the bundled manifest passes every admission gate in admitReleaseManifest.
  if (!features.thinkingGamesReleaseEnabled) return { ok: false, code: 'catalog_not_approved' };
  // The bundled catalog cannot change during this isolate's lifetime. Validate
  // it once while retaining the master flag check on every request.
  if (admittedRelease) return admittedRelease;

  // Cloudflare Workers cannot read repository files at runtime. Keep private
  // content in this server-only bundle; canonical bytes preserve the reviewed pin.
  const raw = JSON.stringify(releaseManifest, null, 2) + '\n';
  const manifest = parseManifestFrom(raw);
  if (manifest.manifestVersion !== RELEASE_MANIFEST_VERSION) return { ok: false, code: 'catalog_not_approved' };
  const digest = manifestDigest(raw);

  if (!admitReleaseManifest(manifest, RELEASE_MANIFEST_DIGEST, digest)) {
    return { ok: false, code: 'catalog_not_approved' };
  }
  admittedRelease = { ok: true, profile: 'release', manifest };
  return admittedRelease;
}

export function findCatalogItem(
  manifest: ThinkingGamesManifest,
  input: { dayIndex: number; slotType: 'main' | 'bonus'; ageTrack: 'age_6_8' | 'age_9_12'; locale: 'vi' },
): PuzzleItem | null {
  return manifest.items
    .filter((item) => item.dayIndex === input.dayIndex && item.slotType === input.slotType
      && item.ageTrack === input.ageTrack && item.locale === input.locale
      && (manifest.isPilotFixture ? item.status === 'design_only' : item.status === 'approved'))
    .sort((a, b) => a.fingerprint.localeCompare(b.fingerprint))[0] ?? null;
}

export function publicCatalogItem(item: PuzzleItem): PublicPuzzle {
  return toPublicPuzzle(item);
}

export function gradingCatalogItem(item: PuzzleItem): GradingData {
  return toGradingData(item);
}

export function admitsPinnedItem(admission: Extract<CatalogAdmission, { ok: true }>, item: PuzzleItem): boolean {
  return admission.manifest.items.some((candidate) =>
    candidate.id === item.id
    && candidate.fingerprint === item.fingerprint
    && candidate.contentVersion === item.contentVersion
    && candidate.status === (admission.profile === 'internal-pilot' ? 'design_only' : 'approved'));
}
