import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookieGet, cookieDelete, getParentContext, rpc } = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  cookieDelete: vi.fn(),
  getParentContext: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('next/headers', () => ({ cookies: vi.fn(async () => ({ get: cookieGet, delete: cookieDelete })) }));
vi.mock('@/lib/auth/parent-context', () => ({ getParentContext }));
vi.mock('@/lib/experience-flags', () => ({ defaultExperienceFlags: { dreamCity: true } }));
vi.mock('@/lib/pairing/crypto', () => ({
  CHILD_SESSION_COOKIE: 'child-session',
  sha256Hex: vi.fn(async () => 'hashed-token'),
}));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: vi.fn(async () => ({ rpc })) }));

import { GET as getChildCity, POST as purchaseChildCity } from '@/app/api/child/city/route';
import { POST as purchaseParentCity } from '@/app/api/domain/city/route';

const familyId = '11111111-1111-4111-8111-111111111111';
const childId = '22222222-2222-4222-8222-222222222222';
const purchase = {
  family_id: familyId,
  child_id: childId,
  item_id: 'garden',
  points_spent: 30,
  purchased_at: '2026-09-26T12:00:00.000Z',
};

function request(path: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('dream city API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieGet.mockReturnValue({ value: 'child-token' });
    getParentContext.mockResolvedValue({ familyId, user: { id: 'parent' } });
  });

  it('loads only the purchases authorized for the paired child', async () => {
    rpc.mockResolvedValue({ data: { status: 'ready', purchases: [purchase] }, error: null });
    const response = await getChildCity();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ purchases: [purchase] });
    expect(rpc).toHaveBeenCalledWith('read_child_city', { session_token_hash: 'hashed-token' });
  });

  it('uses a server-authoritative purchase and returns its remaining balance', async () => {
    rpc.mockResolvedValue({ data: { status: 'built', purchase, remainingPoints: 55 }, error: null });
    const response = await purchaseChildCity(request('/api/child/city', { itemId: 'garden' }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'built', purchase, remainingPoints: 55 });
    expect(rpc).toHaveBeenCalledWith('purchase_child_city_item', {
      session_token_hash: 'hashed-token', target_item_id: 'garden',
    });
  });

  it('does not call the database for invalid items and clears revoked sessions', async () => {
    expect((await purchaseChildCity(request('/api/child/city', { itemId: 'castle' }))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
    rpc.mockResolvedValue({ data: { status: 'session_invalid' }, error: null });
    expect((await getChildCity()).status).toBe(401);
    expect(cookieDelete).toHaveBeenCalledWith('child-session');
  });

  it('scopes parent purchases to the current family and rejects a foreign result', async () => {
    rpc.mockResolvedValue({ data: { status: 'built', purchase: { ...purchase, family_id: childId }, remainingPoints: 55 }, error: null });
    const response = await purchaseParentCity(request('/api/domain/city', { childId, itemId: 'garden' }));
    expect(response.status).toBe(503);
    expect(rpc).toHaveBeenCalledWith('purchase_parent_city_item', {
      target_family_id: familyId, target_child_id: childId, target_item_id: 'garden',
    });
  });

  it('requires a parent session before attempting a purchase', async () => {
    getParentContext.mockResolvedValue(null);
    expect((await purchaseParentCity(request('/api/domain/city', { childId, itemId: 'garden' }))).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('reports insufficient points and idempotent repeat purchases', async () => {
    rpc.mockResolvedValueOnce({ data: { status: 'insufficient_points', remainingPoints: 29 }, error: null });
    expect((await purchaseParentCity(request('/api/domain/city', { childId, itemId: 'garden' }))).status).toBe(409);
    rpc.mockResolvedValueOnce({ data: { status: 'already_built', purchase, remainingPoints: 55 }, error: null });
    const response = await purchaseParentCity(request('/api/domain/city', { childId, itemId: 'garden' }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: 'already_built', remainingPoints: 55 });
  });
});
