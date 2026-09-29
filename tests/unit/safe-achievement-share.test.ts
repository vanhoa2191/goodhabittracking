import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildSafeAchievementShare } from '@/lib/safe-achievement-share';

describe('privacy-safe achievement sharing', () => {
  beforeEach(() => vi.stubEnv('NEXT_PUBLIC_MARKETING_URL', 'https://www.example'));

  it('builds generic Vietnamese copy without child or task identifiers', () => {
    const share = buildSafeAchievementShare('vi');
    const serialized = JSON.stringify(share);
    expect(share.title).toBe('Cột mốc gia đình cùng KidHabit Hero');
    expect(share.url).toBe('https://www.example/');
    expect(serialized).not.toMatch(/Bé Cloud|Thói quen buổi sáng|2018|mascot:leo|tracking|ref=/i);
  });

  it('never adds a personalized tracking identifier', () => {
    const share = buildSafeAchievementShare('en');
    expect(share.url).not.toContain('?');
    expect(share.url).not.toContain('#');
  });
});
