import { afterEach, describe, expect, it, vi } from 'vitest';
import { familyAlertLevels, isCareEmailsEnabled, scheduleCareMessages } from '@/lib/lifecycle/care';

const row = (family_id: string, child_id: string, local_date: string, mood: 'sad' | 'worried' | 'angry') => ({ family_id, child_id, local_date, mood });

describe('care email scheduling', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('is off unless the flag is exactly true', () => {
    expect(isCareEmailsEnabled()).toBe(false);
    vi.stubEnv('LIFECYCLE_CARE_EMAILS_ENABLED', '1');
    expect(isCareEmailsEnabled()).toBe(false);
    vi.stubEnv('LIFECYCLE_CARE_EMAILS_ENABLED', 'true');
    expect(isCareEmailsEnabled()).toBe(true);
  });

  it('reuses evaluateMoodAlert per child and keeps the strongest level per family', () => {
    const rows = [
      row('f1', 'c1', '2026-11-01', 'sad'), row('f1', 'c1', '2026-10-31', 'sad'), row('f1', 'c1', '2026-10-30', 'worried'),
      row('f2', 'c2', '2026-11-01', 'sad'), row('f2', 'c2', '2026-10-31', 'sad'),
      row('f3', 'c3', '2026-11-01', 'angry'), row('f3', 'c3', '2026-10-31', 'angry'), row('f3', 'c3', '2026-10-30', 'angry'),
      row('f3', 'c3', '2026-10-29', 'angry'), row('f3', 'c3', '2026-10-28', 'angry'),
      row('f3', 'c4', '2026-11-01', 'sad'), row('f3', 'c4', '2026-10-31', 'sad'), row('f3', 'c4', '2026-10-30', 'sad'),
    ];
    const levels = familyAlertLevels(rows, '2026-11-01');
    expect(levels.get('f1')).toBe('watch');
    expect(levels.has('f2')).toBe(false);
    expect(levels.get('f3')).toBe('concern');
  });

  it('enqueues the alert with only a level in the payload, then runs the scheduler', async () => {
    const calls: Array<[string, unknown]> = [];
    const rpc = vi.fn(async (name: string, args?: unknown) => {
      calls.push([name, args]);
      if (name === 'care_space_mood_snapshot') {
        return { data: [row('f1', 'c1', '2026-11-01', 'sad'), row('f1', 'c1', '2026-10-31', 'sad'), row('f1', 'c1', '2026-10-30', 'sad')], error: null };
      }
      return { data: null, error: null };
    });
    const result = await scheduleCareMessages({ rpc } as never, new Date('2026-11-01T05:00:00Z'));
    expect(result.ok).toBe(true);
    expect(calls.map(([name]) => name)).toEqual(['care_space_mood_snapshot', 'enqueue_care_message', 'schedule_care_messages', 'schedule_onboarding_messages']);
    expect(calls[1][1]).toEqual({ target_family_id: 'f1', target_template_key: 'care_space_alert', target_payload: { status: 'watch' } });
  });

  it('reports a failure but still tries the other producer', async () => {
    const rpc = vi.fn(async (name: string) => (name === 'care_space_mood_snapshot' ? { data: null, error: { message: 'x' } } : { data: null, error: null }));
    const result = await scheduleCareMessages({ rpc } as never);
    expect(result.ok).toBe(false);
    expect(rpc).toHaveBeenCalledWith('schedule_care_messages');
    expect(rpc).toHaveBeenCalledWith('schedule_onboarding_messages');
  });

  it('reports an onboarding producer failure', async () => {
    const rpc = vi.fn(async (name: string) => ({ data: null, error: name === 'schedule_onboarding_messages' ? { message: 'x' } : null }));
    expect((await scheduleCareMessages({ rpc } as never)).ok).toBe(false);
  });
});
