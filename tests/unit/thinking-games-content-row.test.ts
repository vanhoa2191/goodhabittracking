import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { PuzzleItem } from '@/lib/thinking-games/types';
import {
  pinnedContentFromAttempt,
  puzzleItemFromContentRow,
} from '@/lib/thinking-games/server/content-row';
import { ThinkingGameRequestError, pauseThinkingGame } from '@/lib/store/thinking-games-client';

type PilotItem = {
  id: string;
  contentVersion: string;
  dayIndex: number;
  slotType: string;
  ageTrack: string;
  locale: string;
  gameTypeId: string;
  ruleVariantId: string;
  status: string;
  validSolutionPredicate: string;
  fingerprint: string;
  solution: unknown;
  skillGroup: string;
  title: string;
  invitation: string;
  tutorial: string;
  explanation: string;
  boardData: unknown;
  hints: readonly [string, string];
  praiseKeys: Record<string, string>;
  targetSeconds: number;
  source: unknown;
  editorial: unknown;
  [key: string]: unknown;
};

const pilot = JSON.parse(readFileSync(
  join(process.cwd(), 'content/thinking-games/pilot/pilot-manifest-v1.json'),
  'utf8',
)) as { items: PilotItem[] };

const fixtureItem = pilot.items.find(
  (item) => item.gameTypeId === 'g03-t1' && item.ageTrack === 'age_6_8',
) as PilotItem;

if (!fixtureItem) {
  throw new Error('pilot g03-t1 age_6_8 fixture missing');
}

function contentRow(overrides: Record<string, unknown> = {}) {
  const { solution, ...publicPayload } = fixtureItem as Record<string, unknown>;
  return {
    id: fixtureItem.id,
    content_version: fixtureItem.contentVersion,
    day_index: fixtureItem.dayIndex,
    slot_type: fixtureItem.slotType,
    age_track: fixtureItem.ageTrack,
    locale: fixtureItem.locale,
    game_type_id: fixtureItem.gameTypeId,
    rule_variant_id: fixtureItem.ruleVariantId,
    status: fixtureItem.status,
    checker_id: fixtureItem.validSolutionPredicate,
    public_payload: publicPayload,
    grading_payload: { solution, validSolutionPredicate: fixtureItem.validSolutionPredicate },
    fingerprint: fixtureItem.fingerprint,
    ...overrides,
  };
}

function attemptWith(content: Record<string, unknown>, pin: Record<string, unknown> = {}) {
  return {
    child_id: '11111111-1111-4111-8111-111111111111',
    entitlement_id: '44444444-4444-4444-8444-444444444444',
    thinking_game_entitlements: {
      content_id: fixtureItem.id,
      content_version: fixtureItem.contentVersion,
      ...pin,
      thinking_game_content: content,
    },
  };
}

function pinned(contentId: string, contentVersion: string) {
  return { contentId, contentVersion };
}

describe('puzzleItemFromContentRow (P0 finish-Api 409 regression)', () => {
  it('reconstructs a valid PuzzleItem from a raw DB row with split payloads', () => {
    const puzzle = puzzleItemFromContentRow(contentRow(), pinned(fixtureItem.id, fixtureItem.contentVersion)) as PuzzleItem;

    expect(puzzle.solution).toEqual(fixtureItem.solution);
    expect(puzzle.validSolutionPredicate).toBe(fixtureItem.validSolutionPredicate);
    expect(puzzle.id).toBe(fixtureItem.id);
    expect(puzzle.contentVersion).toBe(fixtureItem.contentVersion);
    expect(puzzle.dayIndex).toBe(fixtureItem.dayIndex);
    expect(puzzle.slotType).toBe(fixtureItem.slotType);
    expect(puzzle.ageTrack).toBe(fixtureItem.ageTrack);
    expect(puzzle.locale).toBe(fixtureItem.locale);
    expect(puzzle.status).toBe('design_only');
    expect(puzzle.fingerprint).toBe(fixtureItem.fingerprint);
    expect(puzzle.title).toBe(fixtureItem.title);
    expect(puzzle.boardData).toEqual(fixtureItem.boardData);
  });

  it('pins fail-closed when content_id does not match the entitlement', () => {
    expect(() => puzzleItemFromContentRow(contentRow(), pinned('D999-main-68', fixtureItem.contentVersion)))
      .toThrow('does not match the pinned entitlement');
  });

  it('pins fail-closed when content_version does not match', () => {
    const row = contentRow({ content_version: 'other-version' });
    expect(() => puzzleItemFromContentRow(row, pinned(fixtureItem.id, fixtureItem.contentVersion)))
      .toThrow('does not match the pinned entitlement');
  });

  it('pins fail-closed when public_payload is missing', () => {
    const row = contentRow({ public_payload: undefined });
    expect(() => puzzleItemFromContentRow(row, pinned(fixtureItem.id, fixtureItem.contentVersion)))
      .toThrow('payloads are missing');
  });

  it('pins fail-closed when grading_payload is missing', () => {
    const row = contentRow({ grading_payload: undefined });
    expect(() => puzzleItemFromContentRow(row, pinned(fixtureItem.id, fixtureItem.contentVersion)))
      .toThrow('payloads are missing');
  });

  it('pins fail-closed when grading solution is missing', () => {
    const row = contentRow({
      grading_payload: { validSolutionPredicate: fixtureItem.validSolutionPredicate },
    });
    expect(() => puzzleItemFromContentRow(row, pinned(fixtureItem.id, fixtureItem.contentVersion)))
      .toThrow('grading solution is missing');
  });

  it('pins fail-closed when checker_id conflicts with grading predicate', () => {
    const row = contentRow({
      grading_payload: { solution: fixtureItem.solution, validSolutionPredicate: 'path-planning-v1' },
    });
    expect(() => puzzleItemFromContentRow(row, pinned(fixtureItem.id, fixtureItem.contentVersion)))
      .toThrow('does not match its grading predicate');
  });
});

describe('pinnedContentFromAttempt (P0 finish-Api relation traversal)', () => {
  it('traverses the attempt → entitlement → content nested relation', () => {
    const result = pinnedContentFromAttempt(attemptWith(contentRow()));
    expect(result).not.toBeNull();
    expect(result!.contentId).toBe(fixtureItem.id);
    expect(result!.contentVersion).toBe(fixtureItem.contentVersion);
    expect(result!.content.id).toBe(fixtureItem.id);
    expect(result!.content.content_version).toBe(fixtureItem.contentVersion);
    expect(result!.content.public_payload).toBeDefined();
    expect(result!.content.grading_payload).toBeDefined();
  });

  it('returns null when content relation is absent', () => {
    const attempt = { child_id: 'x', thinking_game_entitlements: { content_id: 'y' } };
    expect(pinnedContentFromAttempt(attempt)).toBeNull();
  });

  it('returns null when attempt is not a record', () => {
    expect(pinnedContentFromAttempt(null)).toBeNull();
    expect(pinnedContentFromAttempt(undefined)).toBeNull();
    expect(pinnedContentFromAttempt('string')).toBeNull();
  });
});

describe('thinking-games client 409 attempt_expired mapping', () => {
  const jsonResponse = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

  it('throws a refused ThinkingGameRequestError for 409 attempt_expired', async () => {
    const requester = async () => jsonResponse({
      ok: false, schemaVersion: 'v1', code: 'attempt_expired', messageKey: 'thinkingGames.attempt_expired',
    }, 409);

    await expect(pauseThinkingGame({
      attemptId: '22222222-2222-4222-8222-222222222222',
      commandId: '33333333-3333-4333-8333-333333333333',
    }, requester)).rejects.toMatchObject({
      status: 409, code: 'attempt_expired', outcome: 'refused',
    });
  });

  it('throws a refused ThinkingGameRequestError for 409 invalid_puzzle', async () => {
    const requester = async () => jsonResponse({
      ok: false, schemaVersion: 'v1', code: 'invalid_puzzle', messageKey: 'thinkingGames.invalid_puzzle',
    }, 409);

    await expect(pauseThinkingGame({
      attemptId: '22222222-2222-4222-8222-222222222222',
      commandId: '33333333-3333-4333-8333-333333333333',
    }, requester)).rejects.toBeInstanceOf(ThinkingGameRequestError);
  });

  it('maps a malformed 409 body to invalid_response with unknown outcome', async () => {
    const requester = async () => jsonResponse({ success: true }, 409);

    await expect(pauseThinkingGame({
      attemptId: '22222222-2222-4222-8222-222222222222',
      commandId: '33333333-3333-4333-8333-333333333333',
    }, requester)).rejects.toMatchObject({
      status: 409, code: 'invalid_response', outcome: 'unknown',
    });
  });
});
