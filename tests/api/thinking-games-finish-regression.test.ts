import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookieGet, getParentContext, rpc, maybeSingle, secondEq, firstEq, select, from } = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  getParentContext: vi.fn(),
  rpc: vi.fn(),
  maybeSingle: vi.fn(),
  secondEq: vi.fn(),
  firstEq: vi.fn(),
  select: vi.fn(),
  from: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ get: cookieGet })),
}));
vi.mock('@/lib/auth/parent-context', () => ({ getParentContext }));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: vi.fn(() => ({ from, rpc })),
}));

import { POST as childFinish } from '@/app/api/child/thinking-games/finish/route';
import { POST as parentFinish } from '@/app/api/domain/thinking-games/finish/route';

const CHILD_ID = '11111111-1111-4111-8111-111111111111';
const ATTEMPT_ID = '22222222-2222-4222-8222-222222222222';
const COMMAND_ID = '33333333-3333-4333-8333-333333333333';

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
  [key: string]: unknown;
};

const pilot = JSON.parse(readFileSync(join(process.cwd(), 'content/thinking-games/pilot/pilot-manifest-v1.json'), 'utf8')) as {
  items: PilotItem[];
};
const pilotItem = pilot.items.find((item) => item.gameTypeId === 'g01-t1' && item.ageTrack === 'age_6_8');
if (!pilotItem) throw new Error('pilot g01-t1 age_6_8 fixture missing');
const fixtureItem = pilotItem as PilotItem;

function contentRow(overrides: Record<string, unknown> = {}) {
  const { solution, ...publicPayload } = fixtureItem;
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
    child_id: CHILD_ID,
    entitlement_id: '44444444-4444-4444-8444-444444444444',
    thinking_game_entitlements: {
      content_id: fixtureItem.id,
      content_version: fixtureItem.contentVersion,
      ...pin,
      thinking_game_content: content,
    },
  };
}

function request(path: string, body: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function childRequest(answer: unknown) {
  return request('/api/child/thinking-games/finish', { attemptId: ATTEMPT_ID, answer, commandId: COMMAND_ID });
}

function parentRequest(answer: unknown) {
  return request('/api/domain/thinking-games/finish', {
    childId: CHILD_ID, attemptId: ATTEMPT_ID, answer, commandId: COMMAND_ID,
  });
}

describe('thinking-games finish DB-row regression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('ENABLE_THINKING_GAMES_INTERNAL_CATALOG', 'true');
    cookieGet.mockReturnValue({ value: 'opaque-child-session' });
    getParentContext.mockResolvedValue({ familyId: 'family-a', role: 'owner', user: { id: 'parent-a' } });
    maybeSingle.mockResolvedValue({ data: attemptWith(contentRow()), error: null });
    secondEq.mockReturnValue({ maybeSingle });
    firstEq.mockReturnValue({ eq: secondEq, maybeSingle });
    select.mockReturnValue({ eq: firstEq });
    from.mockReturnValue({ select });
    rpc.mockImplementation(async (name: string) => ({
      data: {
        ok: true,
        status: name === 'thinking_game_parent_finish_as' ? 'finished' : 'finished',
        data: { attemptId: ATTEMPT_ID, won: true },
      },
      error: null,
    }));
  });

  it('accepts the real DB public/grading shape and grades a correct child answer', async () => {
    const response = await childFinish(childRequest(fixtureItem.solution));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, status: 'finished' });
    expect(rpc).toHaveBeenCalledWith('thinking_game_finish_verified', expect.objectContaining({
      attempt_id: ATTEMPT_ID,
      won: true,
    }));
  });

  it('grades a wrong child answer as retry instead of returning 409', async () => {
    rpc.mockResolvedValueOnce({
      data: { ok: true, status: 'retry', data: { attemptId: ATTEMPT_ID, won: false } },
      error: null,
    });
    const response = await childFinish(childRequest('not-the-answer'));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, status: 'retry' });
    expect(rpc).toHaveBeenCalledWith('thinking_game_finish_verified', expect.objectContaining({ won: false }));
  });

  it('rejects a content row that does not match the entitlement pin', async () => {
    maybeSingle.mockResolvedValue({
      data: attemptWith(contentRow({ content_version: 'other-version' })),
      error: null,
    });
    const response = await childFinish(childRequest(fixtureItem.solution));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ ok: false, code: 'invalid_puzzle' });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('rejects a malformed public payload without reaching the RPC', async () => {
    maybeSingle.mockResolvedValue({
      data: attemptWith(contentRow({ public_payload: { id: fixtureItem.id } })),
      error: null,
    });
    const response = await childFinish(childRequest(fixtureItem.solution));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ ok: false, code: 'invalid_puzzle' });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('keeps the paired parent transport on the same corrected DB-row contract', async () => {
    const response = await parentFinish(parentRequest(fixtureItem.solution));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, status: 'finished' });
    expect(rpc).toHaveBeenCalledWith('thinking_game_parent_finish_as', expect.objectContaining({
      actor_user_id: 'parent-a',
      target_child_id: CHILD_ID,
      attempt_id: ATTEMPT_ID,
      won: true,
    }));
  });
});
