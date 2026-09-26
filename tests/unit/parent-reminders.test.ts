import { describe, expect, it } from 'vitest';
import { resolveParentReminderDelivery, shouldShowParentReminder } from '@/lib/parent-reminders';

describe('parent reminder safety boundary', () => {
  it('keeps every reminder off until the parent opts in', () => {
    expect(resolveParentReminderDelivery({ consented: false, permission: 'granted' })).toBe('disabled');
  });

  it('uses only an in-app reminder before browser permission is granted', () => {
    expect(resolveParentReminderDelivery({ consented: true, permission: 'default' })).toBe('in_app_only');
    expect(resolveParentReminderDelivery({ consented: true, permission: 'denied' })).toBe('in_app_only');
    expect(resolveParentReminderDelivery({ consented: true, permission: 'unsupported' })).toBe('in_app_only');
  });

  it('allows browser delivery only with consent and device permission', () => {
    expect(resolveParentReminderDelivery({ consented: true, permission: 'granted' })).toBe('browser_ready');
  });

  it('shows an actionable in-app reminder only for active families with pending work', () => {
    expect(shouldShowParentReminder({ consented: true, familyPaused: false, pendingCount: 2 })).toBe(true);
    expect(shouldShowParentReminder({ consented: false, familyPaused: false, pendingCount: 2 })).toBe(false);
    expect(shouldShowParentReminder({ consented: true, familyPaused: true, pendingCount: 2 })).toBe(false);
    expect(shouldShowParentReminder({ consented: true, familyPaused: false, pendingCount: 0 })).toBe(false);
  });
});
