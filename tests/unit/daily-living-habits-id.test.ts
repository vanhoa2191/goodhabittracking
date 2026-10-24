import { describe, expect, it } from 'vitest';
import { dailyLivingActivityId, isDailyLivingTemplateId, TEST_VECTOR } from '@/lib/daily-living-habits-id';

describe('dailyLivingActivityId — deterministic UUIDv5', () => {
  it('matches the external test vector (Python uuid.uuid5)', async () => {
    const id = await dailyLivingActivityId(TEST_VECTOR.familyId, TEST_VECTOR.childId, TEST_VECTOR.templateId);
    expect(id).toBe(TEST_VECTOR.expected);
  });

  it('produces same ID for same inputs (deterministic)', async () => {
    const id1 = await dailyLivingActivityId('aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'WIT-DLY-01');
    const id2 = await dailyLivingActivityId('aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'WIT-DLY-01');
    expect(id1).toBe(id2);
  });

  it('produces different IDs for different families', async () => {
    const id1 = await dailyLivingActivityId('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'WIT-DLY-01');
    const id2 = await dailyLivingActivityId('33333333-3333-4333-8333-333333333333', '22222222-2222-4222-8222-222222222222', 'WIT-DLY-01');
    expect(id1).not.toBe(id2);
  });

  it('produces different IDs for different children (same family, same template)', async () => {
    const id1 = await dailyLivingActivityId('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'WIT-DLY-01');
    const id2 = await dailyLivingActivityId('11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333', 'WIT-DLY-01');
    expect(id1).not.toBe(id2);
  });

  it('produces different IDs for different templates (same family, same child)', async () => {
    const id1 = await dailyLivingActivityId('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'WIT-DLY-01');
    const id2 = await dailyLivingActivityId('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'WIT-DLY-02');
    expect(id1).not.toBe(id2);
  });

  it('uses "shared" scope when childId is null', async () => {
    const idWithNull = await dailyLivingActivityId('11111111-1111-4111-8111-111111111111', null, 'WIT-DLY-01');
    const idWithShared = await dailyLivingActivityId('11111111-1111-4111-8111-111111111111', 'shared', 'WIT-DLY-01');
    expect(idWithNull).toBe(idWithShared);
  });

  it('produces valid UUIDv5 format (version 5, variant 10xx)', async () => {
    const id = await dailyLivingActivityId('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'WIT-DLY-01');
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('throws for non-DLY template IDs', async () => {
    await expect(dailyLivingActivityId('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'WIT-NUT-01')).rejects.toThrow();
    await expect(dailyLivingActivityId('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'WIT-CAP-01')).rejects.toThrow();
    await expect(dailyLivingActivityId('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'GD1-NT-01')).rejects.toThrow();
  });
});

describe('isDailyLivingTemplateId', () => {
  it('returns true for WIT-DLY-01 through WIT-DLY-10', () => {
    for (let i = 1; i <= 10; i++) {
      const id = `WIT-DLY-${i.toString().padStart(2, '0')}`;
      expect(isDailyLivingTemplateId(id)).toBe(true);
    }
  });

  it('returns false for legacy templates', () => {
    expect(isDailyLivingTemplateId('WIT-NUT-01')).toBe(false);
    expect(isDailyLivingTemplateId('WIT-CAP-01')).toBe(false);
  });

  it('returns false for framework templates', () => {
    expect(isDailyLivingTemplateId('GD1-NT-01')).toBe(false);
    expect(isDailyLivingTemplateId('GD3-SK-12')).toBe(false);
  });

  it('returns false for invalid formats', () => {
    expect(isDailyLivingTemplateId('WIT-DLY-1')).toBe(false);
    expect(isDailyLivingTemplateId('DLY-01')).toBe(false);
    expect(isDailyLivingTemplateId('')).toBe(false);
  });
});