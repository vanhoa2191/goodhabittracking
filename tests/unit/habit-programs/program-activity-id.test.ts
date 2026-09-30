import { describe, expect, it } from 'vitest';
import { programActivityId } from '@/lib/habit-programs/program-activity-id';

const childA = '22222222-2222-4222-8222-222222222222';
const childB = '33333333-3333-4333-8333-333333333333';

describe('the id of a habit started from a program', () => {
  it('is a valid UUID that is the same every time for the same child and habit', async () => {
    const first = await programActivityId(childA, 'GD3-HT-02');
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    await expect(programActivityId(childA, 'GD3-HT-02')).resolves.toBe(first);
  });

  it('differs between children and between habits, so nothing collides', async () => {
    const ids = await Promise.all([
      programActivityId(childA, 'GD3-HT-02'),
      programActivityId(childB, 'GD3-HT-02'),
      programActivityId(childA, 'GD3-HT-01'),
    ]);
    expect(new Set(ids).size).toBe(3);
  });
});
