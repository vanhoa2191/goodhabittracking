import type { ChildProfile, Language, Reward } from '@/types';
import { getOnboardingCopy } from '@/lib/i18n/onboarding-copy';
import { getOnboardingExtraCopy } from '@/lib/i18n/onboarding-extra-copy';
import { getOnboardingWizardCopy } from '@/lib/i18n/onboarding-wizard-copy';
import { getProfileMutationCopy, getProfileMutationError } from '@/lib/i18n/profile-mutation-copy';
import { MEANINGFUL_REWARD_TEMPLATES } from '@/lib/reward-templates';
import type { CreateProfileOptions, ProfileCreateResult } from '@/lib/store/profile-actions';
import { getStageFromAge } from '@/lib/wit-framework';
import { selectedStarterHabits, type WizardDraft } from './wizard';

export type SubmitDeps = {
  readonly language: Language;
  readonly requestId: string;
  readonly signedIn: boolean;
  readonly isPro: boolean;
  readonly fetcher: typeof fetch;
  readonly activateFreeTrial: () => Promise<{ readonly success: boolean }>;
  readonly createProfile: (
    profile: Omit<ChildProfile, 'id' | 'createdAt'>,
    requestId?: string,
    options?: CreateProfileOptions,
  ) => Promise<ProfileCreateResult>;
  readonly createReward: (reward: Omit<Reward, 'id' | 'createdAt'>) => Promise<boolean>;
};

export type SubmitResult =
  | { readonly ok: true; readonly profileId: string; readonly rewardsFailed: boolean }
  | { readonly ok: false; readonly message: string };

export async function submitOnboarding(draft: WizardDraft, deps: SubmitDeps): Promise<SubmitResult> {
  const copy = getOnboardingCopy(deps.language);
  const extra = getOnboardingExtraCopy(deps.language);
  const profileCopy = getProfileMutationCopy(deps.language);
  const wizardCopy = getOnboardingWizardCopy(deps.language);
  let failureMessage = profileCopy.privacyError;

  try {
    if (deps.signedIn) {
      const response = await deps.fetcher('/api/privacy/consent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ policyVersion: '2026-09-19', childDataConsent: true }),
      });
      if (!response.ok) return { ok: false, message: profileCopy.privacyError };

      if (!deps.isPro) {
        failureMessage = extra.trialFailed;
        const trialResult = await deps.activateFreeTrial();
        if (!trialResult.success) return { ok: false, message: extra.trialFailed };
      }
    }

    failureMessage = getProfileMutationError(deps.language, { success: false, code: 'profile_mutation_failed' });
    const name = draft.childName.trim();
    const profileResult = await deps.createProfile({
      name,
      nickname: draft.childNickname.trim() || `${copy.nicknamePrefix} ${name.split(/\s+/).pop()}`,
      avatar: draft.childAvatar,
      themeColor: draft.childThemeColor,
      points: 20,
      totalEarned: 20,
      level: 1,
      streak: 1,
      age: draft.childAge,
      birthYear: new Date().getFullYear() - draft.childAge,
      ageStage: getStageFromAge(draft.childAge),
      showRealNameOnLeaderboard: false,
      isPublicOnLeaderboard: false,
    }, deps.requestId, { starterHabits: selectedStarterHabits(draft) });
    if (!profileResult.success) {
      return { ok: false, message: getProfileMutationError(deps.language, profileResult) };
    }

    let rewardsFailed = false;
    for (const reward of draft.rewards) {
      if (!reward.selected) continue;
      try {
        const template = MEANINGFUL_REWARD_TEMPLATES.find((candidate) => candidate.id === reward.id);
        if (!template) throw new Error(`Missing onboarding reward template: ${reward.id}`);
        const rewardCopy = wizardCopy.rewardTitles[reward.id];
        const success = await deps.createReward({
          title: rewardCopy.title,
          description: rewardCopy.description,
          icon: template.icon,
          costPoints: reward.costPoints,
          stock: -1,
          isActive: true,
        });
        if (!success) rewardsFailed = true;
      } catch {
        rewardsFailed = true;
      }
    }

    return { ok: true, profileId: profileResult.profileId, rewardsFailed };
  } catch {
    return { ok: false, message: failureMessage };
  }
}
