import { describe, expect, it, vi } from 'vitest';
import { loadChildHabitPrograms } from '@/lib/store/habit-programs-client';

const row = {
  log_id: '11111111-1111-4111-8111-111111111111',
  family_id: '22222222-2222-4222-8222-222222222222',
  child_id: '33333333-3333-4333-8333-333333333333',
  activity_id: '44444444-4444-4444-8444-444444444444',
  support_level: 'prompted',
  recorded_by: 'child',
  recorded_at: '2026-09-30T09:00:00.000Z',
};

describe('child habit program client', () => {
  it('returns parsed observations and cue plans', async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ supportObservations: [row], cuePlans: [] })));
    await expect(loadChildHabitPrograms(request)).resolves.toEqual({ supportObservations: [row], cuePlans: [] });
    expect(request).toHaveBeenCalledWith('/api/child/habit-programs', { cache: 'no-store' });
  });

  it('returns null when the request fails or the payload is not valid', async () => {
    await expect(loadChildHabitPrograms(async () => new Response('no', { status: 503 }))).resolves.toBeNull();
    await expect(loadChildHabitPrograms(async () => new Response(JSON.stringify({ supportObservations: [{ ...row, support_level: 'perfect' }], cuePlans: [] })))).resolves.toBeNull();
    await expect(loadChildHabitPrograms(async () => new Response(JSON.stringify({ nope: true })))).resolves.toBeNull();
  });
});
