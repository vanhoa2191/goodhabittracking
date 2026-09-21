import { describe, expect, it } from 'vitest';
import type { Language } from '@/types';
import { getParentSecondaryCopy } from '@/lib/i18n/parent-secondary-copy';
import { getParentSettingsCopy } from '@/lib/i18n/parent-settings-copy';
import { getKidDashboardCopy } from '@/lib/i18n/kid-dashboard-copy';
import { getHeaderCopy } from '@/lib/i18n/header-copy';
import { getLandingUiCopy } from '@/lib/i18n/landing-ui-copy';
import { getOnboardingCopy } from '@/lib/i18n/onboarding-copy';
import { getParentPrimaryCopy } from '@/lib/i18n/parent-primary-copy';
import { getDeviceConnectCopy } from '@/lib/i18n/device-connect-copy';
import { localizeWitTemplate } from '@/lib/i18n/wit-template-copy';
import { localizeAgeAdaptedHabit } from '@/lib/i18n/age-habit-copy';
import { generateAgeAdaptedHabits } from '@/lib/wit-framework';
import type { AgeStage } from '@/types';
import { localizeDemoActivity, localizeDemoReward } from '@/lib/i18n/demo-content-copy';
import { getPortraitGuideCopy } from '@/lib/i18n/portrait-guide-copy';
import { DEFAULT_BADGES, INITIAL_ACTIVITIES, INITIAL_REWARDS, WIT_HABIT_PACKS } from '@/lib/constants';

const languages: Language[] = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];

describe('parent secondary screens localization', () => {
  it('provides complete reward, analytics, and settings copy for every locale', () => {
    for (const language of languages) {
      expect(Object.values(getParentSecondaryCopy(language)).every(Boolean)).toBe(true);
      expect(Object.values(getParentSettingsCopy(language)).every(Boolean)).toBe(true);
      expect(Object.values(getKidDashboardCopy(language)).every(Boolean)).toBe(true);
      expect(Object.values(getHeaderCopy(language)).every(Boolean)).toBe(true);
      expect(Object.values(getLandingUiCopy(language)).every(Boolean)).toBe(true);
      expect(getKidDashboardCopy(language).infantJournal('Mia')).toContain('Mia');
    }
  });

  it('does not show Vietnamese interface copy in other locales', () => {
    for (const language of languages.filter((item) => item !== 'vi')) {
      const rendered = [
        ...Object.values(getParentSecondaryCopy(language)),
        ...Object.values(getParentSettingsCopy(language)),
        ...Object.values(getKidDashboardCopy(language)).filter((value) => typeof value === 'string'),
        ...Object.values(getHeaderCopy(language)),
        ...Object.values(getLandingUiCopy(language)).filter((value) => typeof value === 'string'),
      ].join(' ');
      expect(rendered).not.toMatch(/thói quen|phần thưởng|gia đình|thiết bị|sao lưu|đăng nhập|mã PIN/i);
    }
  });

  it('localizes every built-in demo habit and reward without changing custom content', () => {
    const nativeLanguages = languages.filter((item) => item !== 'vi' && item !== 'en');
    for (const activity of INITIAL_ACTIVITIES) {
      const english = localizeDemoActivity(activity, 'en');
      expect(english.title).not.toBe(activity.title);
      for (const language of nativeLanguages) {
        expect(localizeDemoActivity(activity, language).title).not.toBe(english.title);
      }
    }
    for (const reward of INITIAL_REWARDS) {
      const english = localizeDemoReward(reward, 'en');
      expect(english.title).not.toBe(reward.title);
      for (const language of nativeLanguages) {
        expect(localizeDemoReward(reward, language).title).not.toBe(english.title);
      }
    }
    const custom = { ...INITIAL_ACTIVITIES[0], id: 'custom-habit' };
    expect(localizeDemoActivity(custom, 'en')).toBe(custom);
    const editedBuiltIn = { ...INITIAL_REWARDS[0], title: 'Family movie night' };
    expect(localizeDemoReward(editedBuiltIn, 'fr').title).toBe('Family movie night');
  });

  it('provides native badge names and descriptions in every supported locale', () => {
    for (const badge of DEFAULT_BADGES) {
      for (const language of languages) {
        expect(badge.name[language]).toBeTruthy();
        expect(badge.description[language]).toBeTruthy();
      }
    }
  });

  it('provides a complete native onboarding journey for every supported locale', () => {
    for (const language of languages) {
      const copy = getOnboardingCopy(language);
      expect(copy.title).toBeTruthy();
      expect(Object.values(copy.roles).every(Boolean)).toBe(true);
      expect(Object.values(copy.stageLabels).every(Boolean)).toBe(true);
      for (const stage of Object.values(copy.stages)) {
        expect(stage.title).toBeTruthy();
        expect(stage.subtitle).toBeTruthy();
        expect(stage.summary).toBeTruthy();
        expect(stage.habitTitles).toHaveLength(6);
        expect(stage.habitTitles.every(Boolean)).toBe(true);
      }
      if (language !== 'vi') {
        expect(JSON.stringify(copy)).not.toMatch(/Vui lòng|thói quen|gia đình|Độ tuổi|Tự động|Quay lại/i);
      }
    }
  });

  it('provides native copy for the primary parent management screens', () => {
    for (const language of languages) {
      const copy = getParentPrimaryCopy(language);
      expect(Object.values(copy).every(Boolean)).toBe(true);
      expect(copy.forChild('Mia')).toContain('Mia');
      expect(copy.streakDays(7)).toContain('7');
      if (language !== 'vi') {
        const rendered = Object.values(copy).filter((value) => typeof value === 'string').join(' ');
        expect(rendered).not.toMatch(/thói quen|gia đình|mã kết nối|độ tuổi|sao chép|biệt danh/i);
      }
    }
  });

  it('provides a complete native child-device connection flow', () => {
    for (const language of languages) {
      const copy = getDeviceConnectCopy(language);
      expect(Object.values(copy).every(Boolean)).toBe(true);
      expect(copy.guideSteps).toHaveLength(3);
      expect(copy.welcomeChild('Mia')).toContain('Mia');
      if (language !== 'vi') {
        expect(JSON.stringify(copy)).not.toMatch(/kết nối|phụ huynh|nhiệm vụ|phần thưởng|để sau/i);
      }
    }
  });

  it('localizes every WIT library template outside Vietnamese', () => {
    for (const pack of WIT_HABIT_PACKS) {
      pack.items.forEach((template, index) => {
        for (const language of languages.filter((item) => item !== 'vi')) {
          const localized = localizeWitTemplate(template, index, language);
          expect(localized.title).not.toBe(template.title);
          expect(localized.description).not.toBe(template.description);
        }
      });
    }
  });

  it('localizes every generated age-based habit while preserving user edits', () => {
    const stages: AgeStage[] = ['0-3', '3-6', '6-12', '12-18'];
    for (const stage of stages) {
      for (const activity of generateAgeAdaptedHabits(null, stage)) {
        for (const language of languages.filter((item) => item !== 'vi')) {
          const localized = localizeAgeAdaptedHabit(activity, language);
          expect(localized.title).not.toBe(activity.title);
          expect(localized.description).not.toBe(activity.description);
        }
        const edited = { ...activity, title: 'Custom family habit' };
        expect(localizeAgeAdaptedHabit(edited, 'en')).toBe(edited);
      }
    }
  });

  it('provides the complete 16-strength guide in every supported locale', () => {
    const vietnamese = getPortraitGuideCopy('vi');
    for (const language of languages) {
      const copy = getPortraitGuideCopy(language);
      expect(copy.portraits).toHaveLength(16);
      expect(copy.givings).toHaveLength(7);
      expect(copy.goldWords).toHaveLength(6);
      expect(copy.checklist).toHaveLength(5);
      expect(Object.values(copy.ui.categories).every(Boolean)).toBe(true);
      for (const portrait of copy.portraits) {
        expect(Object.values(portrait.actionsByStage).every(Boolean)).toBe(true);
      }
      if (language !== 'vi') {
        expect(copy.portraits.map((item) => item.name)).not.toEqual(vietnamese.portraits.map((item) => item.name));
        expect(JSON.stringify(copy)).not.toMatch(/Vui lòng|chân dung|bố thí|thân giáo|hoàn thành|lứa tuổi/i);
      }
    }
  });
});
