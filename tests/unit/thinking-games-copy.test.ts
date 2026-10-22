import { describe, expect, it } from 'vitest';
import {
  getThinkingGamesCopy,
  getThinkingGamesViCopy,
  isThinkingGameLocaleSupported,
  SUPPORTED_THINKING_GAME_LOCALES,
  THINKING_GAMES_VI_COPY,
} from '@/lib/i18n/thinking-games-copy';

describe('thinking-games-copy', () => {
  it('exposes only approved locales explicitly and rejects unreviewed locales', () => {
    expect(SUPPORTED_THINKING_GAME_LOCALES).toEqual(['vi']);
    expect(isThinkingGameLocaleSupported('vi')).toBe(true);
    expect(isThinkingGameLocaleSupported('en')).toBe(false);
    expect(isThinkingGameLocaleSupported('fr')).toBe(false);

    expect(getThinkingGamesCopy('vi')).not.toBeNull();
    expect(getThinkingGamesCopy('en')).toBeNull();
    expect(getThinkingGamesCopy('de')).toBeNull();
    expect(getThinkingGamesCopy('ja')).toBeNull();
  });

  it('provides complete copy for all required game states', () => {
    const copy = getThinkingGamesViCopy();

    // 1. invitation
    expect(copy.invitation.mainTitle).toBeTruthy();
    expect(copy.invitation.bonusTitle).toBeTruthy();
    expect(copy.invitation.mainBody).toContain('Bạn');
    expect(copy.invitation.startAction).toBe('Cùng thử nhé');

    // 2. tutorial
    expect(copy.tutorial.title).toBeTruthy();
    expect(copy.tutorial.defaultGuidance).toBeTruthy();
    expect(copy.tutorial.understandAction).toBe('Mình hiểu rồi');

    // 3. playing
    expect(copy.playing.pauseAction).toBe('Tạm dừng');
    expect(copy.playing.hintAction).toBe('Gợi ý');
    expect(copy.playing.exitAction).toBeTruthy();
    expect(copy.playing.hintsRemaining(2)).toContain('2');

    // 4. paused
    expect(copy.paused.title).toBeTruthy();
    expect(copy.paused.resumeAction).toBe('Chơi tiếp');
    expect(copy.paused.exitAction).toBe('Nghỉ ngơi');

    // 5. hints
    expect(copy.hints.level1Title).toBeTruthy();
    expect(copy.hints.level2Title).toBeTruthy();
    expect(copy.hints.defaultHint1).toBeTruthy();
    expect(copy.hints.defaultHint2).toBeTruthy();

    // 6. wrong
    expect(copy.wrong.title).toBeTruthy();
    expect(copy.wrong.body).toContain('mình');
    expect(copy.wrong.retryAction).toBeTruthy();

    // 7. retry
    expect(copy.retry.title).toBeTruthy();
    expect(copy.retry.confirmAction).toBeTruthy();

    // 8. finish
    expect(copy.finish.title).toBeTruthy();
    expect(copy.finish.persistPraise).toContain('kiên trì');
    expect(copy.finish.strategyPraise).toContain('quan sát');

    // 9. explanation
    expect(copy.explanation.title).toBeTruthy();
    expect(copy.explanation.understandAction).toBeTruthy();

    // 10. exit
    expect(copy.exit.title).toBeTruthy();
    expect(copy.exit.confirmAction).toBeTruthy();
    expect(copy.exit.cancelAction).toBeTruthy();

    // 11. loading
    expect(copy.loading.title).toBeTruthy();

    // 12. error & contract codes
    expect(copy.error.title).toBeTruthy();
    expect(copy.error.codes.feature_off).toBeTruthy();
    expect(copy.error.codes.bedtime).toBeTruthy();
    expect(copy.error.codes.age_track_unavailable).toBeTruthy();
    expect(copy.error.codes.bonus_pending_approval).toBeTruthy();
    expect(copy.error.codes.bonus_quiet_hours).toBeTruthy();
    expect(copy.error.codes.day_changed).toBeTruthy();
    expect(copy.error.codes.offline_no_entitlement).toBeTruthy();

    // 13. networkPending
    expect(copy.networkPending.title).toBeTruthy();
    expect(copy.networkPending.body).toBeTruthy();

    // 14. approvalWaiting
    expect(copy.approvalWaiting.title).toBeTruthy();
    expect(copy.approvalWaiting.body).toBeTruthy();

    // 15. bonusLocked
    expect(copy.bonusLocked.title).toBeTruthy();

    // 16. bedtime
    expect(copy.bedtime.title).toBeTruthy();
    expect(copy.bedtime.goodnightAction).toBeTruthy();

    // 17. missingContent
    expect(copy.missingContent.title).toBeTruthy();
  });

  it('consistently uses peer pronouns (mình – bạn) and forbids adult-child pronouns (con, bé)', () => {
    // Extract all string values recursively
    const extractStrings = (obj: unknown): string[] => {
      if (typeof obj === 'string') return [obj];
      if (typeof obj === 'function') {
        if (obj.length === 1) {
          return [obj(1)];
        }
        if (obj.length === 2) {
          return [obj(1, 2)];
        }
        return [];
      }
      if (obj && typeof obj === 'object') {
        return Object.values(obj).flatMap(extractStrings);
      }
      return [];
    };

    const allStrings = extractStrings(THINKING_GAMES_VI_COPY);
    expect(allStrings.length).toBeGreaterThan(30);

    // Verify peer pronouns exist
    const combined = allStrings.join(' ');
    expect(combined.toLowerCase()).toMatch(/bạn/);
    expect(combined.toLowerCase()).toMatch(/mình/);

    // Verify forbidden adult words do NOT exist in the game copy
    // Specifically word boundaries for "con" and "bé" (except words like "hoàn tất" or "khung" or "còn" which are not "con")
    for (const text of allStrings) {
      // Must not contain " con " or end with " con" or start with "Con "
      expect(text).not.toMatch(/\bcon\b/i);
      expect(text).not.toMatch(/\bbé\b/i);
    }
  });
});
