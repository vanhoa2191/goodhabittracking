import 'server-only';

import { parsePuzzleItem } from '@/lib/thinking-games';
import type { PuzzleItem } from '@/lib/thinking-games/types';

export type PinnedContent = {
  readonly content: Record<string, unknown>;
  readonly contentId: string;
  readonly contentVersion: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function relation(value: unknown): Record<string, unknown> | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  return isRecord(candidate) ? candidate : null;
}

/**
 * Reads the attempt -> entitlement -> content relation exactly as PostgREST returns it.
 * A to-one relation is normally an object, but accepting a single-element array keeps
 * the boundary stable across Supabase response shapes.
 */
export function pinnedContentFromAttempt(attempt: unknown): PinnedContent | null {
  if (!isRecord(attempt)) return null;
  const entitlement = relation(attempt.thinking_game_entitlements);
  if (!entitlement) return null;
  const content = relation(entitlement.thinking_game_content);
  if (!content) return null;
  if (typeof entitlement.content_id !== 'string' || typeof entitlement.content_version !== 'string') return null;
  return {
    content,
    contentId: entitlement.content_id,
    contentVersion: entitlement.content_version,
  };
}

/**
 * Rebuilds the reviewed PuzzleItem from its canonical database row.
 *
 * The public payload is only the child-visible projection. Identity, pin, status and
 * fingerprint come from their own columns, while the private solution/checker come from
 * grading_payload. No caller-provided win state is accepted.
 */
export function puzzleItemFromContentRow(content: unknown, pinned: Pick<PinnedContent, 'contentId' | 'contentVersion'>): PuzzleItem {
  if (!isRecord(content)) throw new Error('content row is missing');
  if (content.id !== pinned.contentId || content.content_version !== pinned.contentVersion) {
    throw new Error('content row does not match the pinned entitlement');
  }
  if (!isRecord(content.public_payload) || !isRecord(content.grading_payload)) {
    throw new Error('content row payloads are missing');
  }

  const publicPayload = content.public_payload;
  const gradingPayload = content.grading_payload;
  const checkerId = typeof content.checker_id === 'string' ? content.checker_id : null;
  const gradingPredicate = typeof gradingPayload.validSolutionPredicate === 'string'
    ? gradingPayload.validSolutionPredicate
    : null;
  if (checkerId && gradingPredicate && checkerId !== gradingPredicate) {
    throw new Error('content checker does not match its grading predicate');
  }
  if (!('solution' in gradingPayload) || gradingPayload.solution === undefined) {
    throw new Error('grading solution is missing');
  }
  const validSolutionPredicate = gradingPredicate ?? checkerId;
  if (!validSolutionPredicate) throw new Error('grading checker is missing');

  return parsePuzzleItem({
    ...publicPayload,
    schemaVersion: publicPayload.schemaVersion ?? 1,
    contentVersion: content.content_version,
    id: content.id,
    dayIndex: content.day_index,
    slotType: content.slot_type,
    ageTrack: content.age_track,
    locale: content.locale,
    gameTypeId: content.game_type_id,
    ruleVariantId: content.rule_variant_id,
    explanation: publicPayload.explanation ?? gradingPayload.explanation,
    solution: gradingPayload.solution,
    validSolutionPredicate,
    status: content.status,
    fingerprint: content.fingerprint,
    source: publicPayload.source ?? null,
    editorial: publicPayload.editorial ?? null,
  });
}
