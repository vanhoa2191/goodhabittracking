import { describe, expect, it } from 'vitest';
import { buildSafeAchievementShare } from '@/lib/safe-achievement-share';

describe('privacy-safe achievement sharing', () => {
  it('builds generic Vietnamese copy without child or task identifiers', () => {
    const share = buildSafeAchievementShare('vi');
    const serialized = JSON.stringify(share);
    expect(share.title).toBe('Cột mốc gia đình cùng KidHabit Hero');
    expect(share.url).toBe('/');
    expect(serialized).not.toMatch(/Bé Cloud|Thói quen buổi sáng|2018|mascot:leo|tracking|ref=/i);
  });

  it('never adds a personalized tracking identifier', () => {
    const share = buildSafeAchievementShare('en');
    expect(share.url).not.toContain('?');
    expect(share.url).not.toContain('#');
  });
});
