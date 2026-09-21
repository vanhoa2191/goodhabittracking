import { describe, expect, it, vi } from 'vitest';
import {
  ProfileMutationRequestError,
  requestProfileMutation,
  type ProfileMutationRequester,
} from '@/lib/store/profile-mutation-client';

const profile = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Bé An',
  avatar: '🦁',
  themeColor: '#3b82f6',
  points: 0,
  totalEarned: 0,
  level: 1,
  streak: 0,
  createdAt: '2026-09-20T00:00:00.000Z',
} as const;

describe('profile mutation client', () => {
  it('sends only the typed profile mutation and parses success', async () => {
    const requester = vi.fn<ProfileMutationRequester>(async () => new Response(JSON.stringify({
      success: true,
      profileId: profile.id,
    }), { status: 200 }));

    const result = await requestProfileMutation({
      type: 'create', profile, starterActivities: [],
    }, requester);

    expect(result).toEqual({ profileId: profile.id });
    const body = requester.mock.calls[0]?.[1]?.body;
    expect(body).toEqual(expect.stringContaining(profile.id));
    expect(body).not.toEqual(expect.stringContaining('familyId'));
    expect(body).not.toEqual(expect.stringContaining('userId'));
  });

  it('rejects malformed success payloads', async () => {
    const requester = vi.fn<ProfileMutationRequester>(
      async () => new Response(JSON.stringify({ success: true }), { status: 200 }),
    );

    await expect(requestProfileMutation({
      type: 'delete', profileId: profile.id,
    }, requester)).rejects.toBeInstanceOf(ProfileMutationRequestError);
  });

  it('preserves expected server errors', async () => {
    const requester = vi.fn<ProfileMutationRequester>(async () => new Response(JSON.stringify({
      success: false,
      error: 'The child profile could not be saved.',
    }), { status: 409 }));

    await expect(requestProfileMutation({
      type: 'update', profileId: profile.id, updates: { name: 'Bé Minh' },
    }, requester)).rejects.toMatchObject({ status: 409 });
  });
});
