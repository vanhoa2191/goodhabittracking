import { describe, expect, it, vi } from 'vitest';
import { getOnboardingExtraCopy } from '@/lib/i18n/onboarding-extra-copy';
import { getOnboardingWizardCopy } from '@/lib/i18n/onboarding-wizard-copy';
import { getProfileMutationCopy, getProfileMutationError } from '@/lib/i18n/profile-mutation-copy';
import { submitOnboarding, type SubmitDeps } from '@/lib/onboarding/submit';
import { createInitialDraft, type WizardDraft } from '@/lib/onboarding/wizard';
import { MEANINGFUL_REWARD_TEMPLATES } from '@/lib/reward-templates';

const profileId = 'child-1';

function makeDraft(): WizardDraft {
  return { ...createInitialDraft(), childName: '  Minh An  ', hasConsent: true };
}

function makeDeps() {
  return {
    language: 'vi',
    requestId: 'req-1',
    signedIn: true,
    isPro: false,
    fetcher: vi.fn<SubmitDeps['fetcher']>().mockResolvedValue(new Response(null, { status: 200 })),
    activateFreeTrial: vi.fn<SubmitDeps['activateFreeTrial']>().mockResolvedValue({ success: true }),
    createProfile: vi.fn<SubmitDeps['createProfile']>().mockResolvedValue({ success: true, profileId, refreshed: true }),
    createReward: vi.fn<SubmitDeps['createReward']>().mockResolvedValue(true),
  } satisfies SubmitDeps;
}

describe('submitOnboarding', () => {
  it('runs consent, trial, profile, rewards in order', async () => {
    const draft = makeDraft();
    const deps = makeDeps();
    const calls: string[] = [];
    deps.fetcher.mockImplementation(async () => {
      calls.push('consent');
      return new Response(null, { status: 200 });
    });
    deps.activateFreeTrial.mockImplementation(async () => {
      calls.push('trial');
      return { success: true };
    });
    deps.createProfile.mockImplementation(async () => {
      calls.push('profile');
      return { success: true, profileId, refreshed: true };
    });
    deps.createReward.mockImplementation(async () => {
      calls.push('reward');
      return true;
    });

    expect(await submitOnboarding(draft, deps)).toEqual({ ok: true, profileId, rewardsFailed: false });
    expect(calls).toEqual(['consent', 'trial', 'profile', 'reward']);
    expect(deps.fetcher).toHaveBeenCalledExactlyOnceWith('/api/privacy/consent', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ policyVersion: '2026-09-19', childDataConsent: true }),
    });
    expect(deps.createProfile).toHaveBeenCalledExactlyOnceWith({
      name: 'Minh An',
      nickname: 'Bé An',
      age: 5,
      birthYear: new Date().getFullYear() - 5,
      avatar: 'mascot:leo',
      themeColor: '#F59E0B',
      ageStage: '3-6',
      points: 20,
      totalEarned: 20,
      level: 1,
      streak: 1,
      showRealNameOnLeaderboard: false,
      isPublicOnLeaderboard: false,
    }, 'req-1', {
      starterHabits: draft.habits.slice(0, 2).map(({ templateIndex, requiresApproval }) => ({ templateIndex, requiresApproval })),
    });
    const rewardCopy = getOnboardingWizardCopy('vi').rewardTitles['experience-bedtime-story'];
    const template = MEANINGFUL_REWARD_TEMPLATES.find((reward) => reward.id === 'experience-bedtime-story');
    expect(deps.createReward).toHaveBeenCalledExactlyOnceWith({
      title: rewardCopy.title,
      description: rewardCopy.description,
      icon: template?.icon,
      costPoints: 25,
      stock: -1,
      isActive: true,
    });
  });

  it('skips the trial for a Pro family', async () => {
    const deps = makeDeps();
    expect(await submitOnboarding(makeDraft(), { ...deps, isPro: true })).toEqual({ ok: true, profileId, rewardsFailed: false });
    expect(deps.fetcher).toHaveBeenCalledOnce();
    expect(deps.activateFreeTrial).not.toHaveBeenCalled();
    expect(deps.createProfile).toHaveBeenCalledOnce();
  });

  it('skips consent and trial when signed out', async () => {
    const deps = makeDeps();
    expect(await submitOnboarding(makeDraft(), { ...deps, signedIn: false })).toEqual({ ok: true, profileId, rewardsFailed: false });
    expect(deps.fetcher).not.toHaveBeenCalled();
    expect(deps.activateFreeTrial).not.toHaveBeenCalled();
    expect(deps.createProfile).toHaveBeenCalledOnce();
  });

  it.each(['non-OK response', 'rejected fetch'])('stops on consent failure (%s)', async (failure) => {
    const deps = makeDeps();
    if (failure === 'non-OK response') deps.fetcher.mockResolvedValue(new Response(null, { status: 500 }));
    else deps.fetcher.mockRejectedValue(new TypeError('offline'));

    expect(await submitOnboarding(makeDraft(), deps)).toEqual({ ok: false, message: getProfileMutationCopy('vi').privacyError });
    expect(deps.activateFreeTrial).not.toHaveBeenCalled();
    expect(deps.createProfile).not.toHaveBeenCalled();
    expect(deps.createReward).not.toHaveBeenCalled();
  });

  it.each(['unsuccessful result', 'rejected activation'])('stops on trial failure (%s)', async (failure) => {
    const deps = makeDeps();
    if (failure === 'unsuccessful result') deps.activateFreeTrial.mockResolvedValue({ success: false });
    else deps.activateFreeTrial.mockRejectedValue(new Error('offline'));

    expect(await submitOnboarding(makeDraft(), deps)).toEqual({ ok: false, message: getOnboardingExtraCopy('vi').trialFailed });
    expect(deps.createProfile).not.toHaveBeenCalled();
    expect(deps.createReward).not.toHaveBeenCalled();
  });

  it('reports the profile error and keeps the request id for retry', async () => {
    const deps = makeDeps();
    const failure = { success: false, code: 'profile_mutation_failed' } as const;
    deps.createProfile.mockResolvedValueOnce(failure);

    expect(await submitOnboarding(makeDraft(), deps)).toEqual({ ok: false, message: getProfileMutationError('vi', failure) });
    expect(deps.createReward).not.toHaveBeenCalled();
    expect(await submitOnboarding(makeDraft(), { ...deps, isPro: true })).toEqual({ ok: true, profileId, rewardsFailed: false });
    expect(deps.createProfile.mock.calls.map((call) => call[1])).toEqual(['req-1', 'req-1']);
    expect(deps.fetcher).toHaveBeenCalledTimes(2);
    expect(deps.activateFreeTrial).toHaveBeenCalledOnce();
  });

  it('preserves specific profile errors and their support code', async () => {
    const deps = makeDeps();
    const failure = { success: false, code: 'child_limit_reached', correlationId: 'support-1' } as const;
    deps.createProfile.mockResolvedValue(failure);
    expect(await submitOnboarding(makeDraft(), deps)).toEqual({ ok: false, message: getProfileMutationError('vi', failure) });
    expect(deps.createReward).not.toHaveBeenCalled();
  });

  it('maps a thrown profile error to the generic profile error', async () => {
    const deps = makeDeps();
    deps.createProfile.mockRejectedValue(new Error('offline'));
    expect(await submitOnboarding(makeDraft(), deps)).toEqual({
      ok: false,
      message: getProfileMutationError('vi', { success: false, code: 'profile_mutation_failed' }),
    });
    expect(deps.createReward).not.toHaveBeenCalled();
  });

  it('continues when a reward fails', async () => {
    const deps = makeDeps();
    deps.createReward.mockResolvedValueOnce(false).mockRejectedValueOnce(new Error('offline'));
    const draft = makeDraft();
    const rewards = draft.rewards.map((reward, index) => ({ ...reward, selected: index < 2 }));

    expect(await submitOnboarding({ ...draft, rewards }, deps)).toEqual({ ok: true, profileId, rewardsFailed: true });
    expect(deps.createReward).toHaveBeenCalledTimes(2);
    expect(deps.createReward.mock.calls.map(([reward]) => reward.title)).toEqual([
      getOnboardingWizardCopy('vi').rewardTitles['experience-bedtime-story'].title,
      getOnboardingWizardCopy('vi').rewardTitles['experience-meal-choice'].title,
    ]);
  });

  it('awaits each reward before creating the next', async () => {
    const deps = makeDeps();
    let finishFirstReward!: (success: boolean) => void;
    let firstRewardStarted!: () => void;
    const firstRewardStartedPromise = new Promise<void>((resolve) => { firstRewardStarted = resolve; });
    deps.createReward.mockImplementationOnce(() => {
      firstRewardStarted();
      return new Promise<boolean>((resolve) => { finishFirstReward = resolve; });
    });
    const draft = makeDraft();
    const rewards = draft.rewards.map((reward, index) => ({ ...reward, selected: index < 2 }));

    const submission = submitOnboarding({ ...draft, rewards }, deps);
    await firstRewardStartedPromise;
    expect(deps.createReward).toHaveBeenCalledOnce();
    finishFirstReward(true);
    expect(await submission).toEqual({ ok: true, profileId, rewardsFailed: false });
    expect(deps.createReward).toHaveBeenCalledTimes(2);
  });

  it('creates no reward when none selected', async () => {
    const deps = makeDeps();
    const draft = makeDraft();
    const rewards = draft.rewards.map((reward) => ({ ...reward, selected: false }));
    expect(await submitOnboarding({ ...draft, rewards }, deps)).toEqual({ ok: true, profileId, rewardsFailed: false });
    expect(deps.createReward).not.toHaveBeenCalled();
  });

  it('creates no reward for a family that already has children', async () => {
    const deps = makeDeps();
    const draft = {
      ...createInitialDraft({ language: 'vi', hasChildren: true, existingRewardTitles: [] }),
      childName: 'Minh An',
      hasConsent: true,
    };
    expect(await submitOnboarding(draft, deps)).toEqual({ ok: true, profileId, rewardsFailed: false });
    expect(deps.createReward).not.toHaveBeenCalled();
  });

  it('uses the selected nickname, habits and localized reward with the edited cost', async () => {
    const deps = makeDeps();
    const draft = makeDraft();
    const rewardCopy = getOnboardingWizardCopy('en').rewardTitles['experience-bedtime-story'];
    expect(await submitOnboarding({
      ...draft,
      childNickname: '  Annie  ',
      habits: [],
      rewards: draft.rewards.map((reward) => ({ ...reward, costPoints: 50 })),
    }, { ...deps, language: 'en' })).toEqual({ ok: true, profileId, rewardsFailed: false });
    expect(deps.createProfile).toHaveBeenCalledWith(expect.objectContaining({ nickname: 'Annie', ageStage: '3-6' }), 'req-1', { starterHabits: [] });
    expect(deps.createReward).toHaveBeenCalledWith(expect.objectContaining({
      title: rewardCopy.title,
      description: rewardCopy.description,
      costPoints: 50,
    }));
  });
});
