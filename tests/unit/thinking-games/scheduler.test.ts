import { describe, expect, it } from 'vitest';

import {
  GAME_AGE_TRACKS,
  assertContentPin,
  assignmentKey,
  parseManifest,
  resolveAssignment,
  resolveInternalPilotAssignment,
} from '@/lib/thinking-games';
import type { ThinkingGamesManifest } from '@/lib/thinking-games';
import { loadPilot } from './helpers';

const pilot = parseManifest(loadPilot());

function request(manifest: ThinkingGamesManifest, overrides: Partial<Parameters<typeof resolveAssignment>[0]> = {}) {
  return {
    manifest,
    childId: 'child-1',
    dayIndex: 1,
    slotType: 'main' as const,
    ageTrack: 'age_6_8' as const,
    locale: 'vi' as const,
    contentVersion: 'pilot-2026-10-21',
    ...overrides,
  };
}

describe('scheduler', () => {
  it('pins the same content across retries and exposes a stable assignment key', () => {
    const first = resolveInternalPilotAssignment(request(pilot));
    const second = resolveInternalPilotAssignment(request(pilot));
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.assignment.pin).toEqual(second.assignment.pin);
    expect(first.assignment.item.id).toBe('D001-main-68');
    expect(first.assignment.publicPuzzle).not.toHaveProperty('solution');
    expect(assertContentPin(first.assignment.pin, first.assignment.item)).toBe(true);
    expect(assertContentPin({ ...first.assignment.pin, fingerprint: '0'.repeat(16) }, first.assignment.item)).toBe(false);
    expect(assignmentKey(request(pilot))).toBe(assignmentKey(request(pilot)));
    expect(assignmentKey(request(pilot))).not.toBe(assignmentKey(request(pilot, { childId: 'child-2' })));
  });

  it('chooses deterministically when more than one candidate matches', () => {
    const cloned = JSON.parse(JSON.stringify(pilot)) as ThinkingGamesManifest;
    const copy = JSON.parse(JSON.stringify(pilot.items.find((item) => item.dayIndex === 4 && item.slotType === 'main' && item.ageTrack === 'age_6_8')));
    copy.dayIndex = 1;
    copy.id = 'D001-main-68x';
    const manifest = parseManifest({ ...cloned, items: [...cloned.items, copy] });
    const first = resolveInternalPilotAssignment(request(manifest));
    const second = resolveInternalPilotAssignment(request(manifest));
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.assignment.pin).toEqual(second.assignment.pin);
    expect(first.assignment.seededOrder).toHaveLength(2);
  });

  it('rejects unreviewed pilot content for the public profile', () => {
    expect(resolveAssignment(request(pilot))).toEqual({ ok: false, code: 'content_not_approved' });
    expect(resolveInternalPilotAssignment(request(pilot)).ok).toBe(true);
  });

  it('serves an approved editorial item through the public profile', () => {
    const cloned = JSON.parse(JSON.stringify(pilot)) as ThinkingGamesManifest;
    const approved = cloned.items.find((item) => item.dayIndex === 1 && item.slotType === 'main' && item.ageTrack === 'age_6_8') as unknown as { status: string; editorial: unknown } | undefined;
    expect(approved).toBeDefined();
    if (!approved) return;
    approved.status = 'approved';
    approved.editorial = {
      reviewedBy: 'reviewer',
      reviewedAt: '2026-10-21T00:00:00.000Z',
      ageReviewedBy: 'age-reviewer',
      ageReviewedAt: '2026-10-21T00:00:00.000Z',
    };
    const manifest = parseManifest(cloned);
    const resolved = resolveAssignment(request(manifest));
    expect(resolved.ok).toBe(true);
    if (resolved.ok) expect(resolved.assignment.item.status).toBe('approved');
  });

  it('accepts a four-track manifest but still requires matching content', () => {
    const fourTrack = parseManifest({ ...JSON.parse(JSON.stringify(pilot)), ageTracks: [...GAME_AGE_TRACKS] });
    expect(resolveAssignment(request(fourTrack, { ageTrack: 'age_3_5' }))).toEqual({ ok: false, code: 'content_unavailable' });
    expect(resolveInternalPilotAssignment(request(fourTrack, { ageTrack: 'age_13_plus' }))).toEqual({ ok: false, code: 'content_unavailable' });
  });

  it('returns explicit errors for journey, age and missing content', () => {
    expect(resolveAssignment(request(pilot, { dayIndex: 366 }))).toEqual({ ok: false, code: 'journey_complete' });
    expect(resolveAssignment(request(pilot, { dayIndex: 99 }))).toEqual({ ok: false, code: 'content_unavailable' });
    const youngOnly = parseManifest({ ...JSON.parse(JSON.stringify(pilot)), ageTracks: ['age_6_8'] });
    expect(resolveAssignment(request(youngOnly, { ageTrack: 'age_9_12' }))).toEqual({
      ok: false,
      code: 'age_track_unavailable',
    });
  });
});
