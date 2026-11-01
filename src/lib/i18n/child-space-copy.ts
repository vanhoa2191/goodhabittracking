/** Tab labels for the child's own space. Other languages fall back to English until they are translated. */
const copy = {
  vi: { space: 'Không gian', spaceFull: 'Không gian của bé', rewardsBadges: 'Quà & huy hiệu' },
  en: { space: 'My space', spaceFull: 'My space', rewardsBadges: 'Rewards & badges' },
} as const;

export function getChildSpaceTabCopy(language: string) {
  return language === 'vi' ? copy.vi : copy.en;
}
