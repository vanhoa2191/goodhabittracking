import { describe, expect, it, vi } from 'vitest';
import { emptyExperienceState } from '@/lib/experience-state';
import { createFamilyPauseAction } from '@/lib/store/family-pause-actions';

const familyId = '22222222-2222-4222-8222-222222222222';

describe('family pause action', () => {
  it('stores a local pause and resumes without changing other experience data', async () => {
    let experience = { ...emptyExperienceState, letters: [] };
    const setExperience = vi.fn((updater) => { experience = updater(experience); });
    const setPaused = createFamilyPauseAction({
      currentUser: null,
      familyId,
      setExperience,
      storageMode: 'local',
      syncCloudFamily: vi.fn(async () => false),
    });

    await expect(setPaused(true)).resolves.toBe(true);
    expect(experience.settings?.paused_at).toBeTruthy();
    expect(experience.settings?.pause_periods).toHaveLength(1);
    await expect(setPaused(false)).resolves.toBe(true);
    expect(experience.settings?.paused_at).toBeNull();
    expect(experience.settings?.pause_periods[0]?.endedAt).toBeTruthy();
    expect(experience.letters).toEqual([]);
  });

  it('does not report success or change local state if a cloud pause fails', async () => {
    const setExperience = vi.fn();
    const setPaused = createFamilyPauseAction({
      currentUser: { id: 'user-a' },
      familyId,
      setExperience,
      storageMode: 'cloud',
      syncCloudFamily: vi.fn(async () => true),
      requester: vi.fn(async () => new Response(null, { status: 409 })),
    });

    await expect(setPaused(true)).resolves.toBe(false);
    expect(setExperience).not.toHaveBeenCalled();
  });

  it('keeps a successful cloud pause visible when the follow-up refresh fails', async () => {
    let experience = emptyExperienceState;
    const setPaused = createFamilyPauseAction({
      currentUser: { id: 'user-a' },
      familyId,
      setExperience: (update) => { experience = typeof update === 'function' ? update(experience) : update; },
      storageMode: 'cloud',
      syncCloudFamily: vi.fn(async () => false),
      requester: vi.fn(async () => new Response(null, { status: 200 })),
    });

    await expect(setPaused(true)).resolves.toBe(true);
    expect(experience.settings?.paused_at).toBeTruthy();
  });
});
