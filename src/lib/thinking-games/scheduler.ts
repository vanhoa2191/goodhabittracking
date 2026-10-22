import { createSeededRandom, hashSeed, shuffleDeterministic, stableSeedKey } from './seeded';
import { parsePuzzleItem, toPublicPuzzle } from './schema';
import type {
  GameAgeTrack,
  AttemptContentPin,
  GameErrorCode,
  Locale,
  PublicPuzzle,
  PuzzleItem,
  SlotType,
  ThinkingGamesManifest,
} from './types';

export type AssignmentRequest = Readonly<{
  manifest: ThinkingGamesManifest;
  childId: string;
  dayIndex: number;
  slotType: SlotType;
  ageTrack: GameAgeTrack;
  locale: Locale;
  contentVersion: string;
}>;

export const INTERNAL_PILOT_PROFILE = 'internal_pilot' as const;
export type AssignmentContentProfile = 'public' | typeof INTERNAL_PILOT_PROFILE;
export type AssignmentOptions = Readonly<{
  contentProfile?: AssignmentContentProfile;
}>;

export type Assignment = Readonly<{
  item: PuzzleItem;
  publicPuzzle: PublicPuzzle;
  pin: AttemptContentPin;
  seededOrder: readonly string[];
}>;

export function assignmentKey(request: Omit<AssignmentRequest, 'manifest'>): string {
  return stableSeedKey([
    request.childId,
    request.dayIndex,
    request.slotType,
    request.contentVersion,
  ]);
}

function admits(item: PuzzleItem, profile: AssignmentContentProfile): boolean {
  if (item.status === 'retired') return false;
  if (profile === INTERNAL_PILOT_PROFILE) return true;
  return item.status === 'approved' && item.editorial !== null;
}

export function resolveAssignment(
  request: AssignmentRequest,
  options: AssignmentOptions = {},
): { ok: true; assignment: Assignment } | { ok: false; code: GameErrorCode } {
  if (request.dayIndex < 1) return { ok: false, code: 'content_unavailable' };
  if (request.dayIndex > 365) return { ok: false, code: 'journey_complete' };
  if (!request.manifest.ageTracks.includes(request.ageTrack)) {
    return { ok: false, code: 'age_track_unavailable' };
  }
  if (!request.manifest.locales.includes(request.locale)) {
    return { ok: false, code: 'locale_unavailable' };
  }
  const matching = request.manifest.items
    .filter((item) =>
      item.dayIndex === request.dayIndex
      && item.slotType === request.slotType
      && item.ageTrack === request.ageTrack
      && item.locale === request.locale
      && item.contentVersion === request.contentVersion)
    .sort((a, b) => a.fingerprint.localeCompare(b.fingerprint));
  if (matching.length === 0) return { ok: false, code: 'content_unavailable' };
  const profile = options.contentProfile ?? 'public';
  const candidates = matching.filter((item) => admits(item, profile));
  if (candidates.length === 0) return { ok: false, code: 'content_not_approved' };

  const key = assignmentKey(request);
  const random = createSeededRandom(key);
  const seededOrder = shuffleDeterministic(random, candidates.map((item) => item.fingerprint));
  const selectedIndex = hashSeed(key) % candidates.length;
  const selected = candidates[selectedIndex];
  if (!selected) return { ok: false, code: 'content_unavailable' };
  try {
    const item = parsePuzzleItem(selected);
    return {
      ok: true,
      assignment: {
        item,
        publicPuzzle: toPublicPuzzle(item),
        pin: {
          contentVersion: item.contentVersion,
          itemId: item.id,
          fingerprint: item.fingerprint,
        },
        seededOrder,
      },
    };
  } catch {
    return { ok: false, code: 'invalid_puzzle' };
  }
}

export function resolveInternalPilotAssignment(
  request: AssignmentRequest,
): { ok: true; assignment: Assignment } | { ok: false; code: GameErrorCode } {
  return resolveAssignment(request, { contentProfile: INTERNAL_PILOT_PROFILE });
}

export function assertContentPin(pin: AttemptContentPin, item: PuzzleItem): boolean {
  return pin.contentVersion === item.contentVersion
    && pin.itemId === item.id
    && pin.fingerprint === item.fingerprint;
}
