'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { getSocialMutationCopy } from '@/lib/i18n/social-mutation-copy';
import type { LeaderboardPeriod, LeaderboardScope } from '@/types';
import { CreateGroupModal } from './CreateGroupModal';
import { JoinGroupModal } from './JoinGroupModal';
import { LeaderboardGroups } from './LeaderboardGroups';
import { LeaderboardHeader } from './LeaderboardHeader';
import { LeaderboardPodium } from './LeaderboardPodium';
import { LeaderboardPrivacyBar } from './LeaderboardPrivacyBar';
import { LeaderboardTable } from './LeaderboardTable';

export function LeaderboardSection() {
  const {
    activeChild,
    getLeaderboard,
    groups,
    createGroup,
    joinGroup,
    sendKudo,
    updateProfile,
  } = useAppStore();

  const { language } = useTranslation();
  const socialCopy = getSocialMutationCopy(language);

  const [scope, setScope] = useState<LeaderboardScope>('global');
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');

  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isJoinGroupOpen, setIsJoinGroupOpen] = useState(false);
  const [highFiveSuccessId, setHighFiveSuccessId] = useState<string | null>(null);
  const [sendingKudoId, setSendingKudoId] = useState<string | null>(null);
  const [socialError, setSocialError] = useState('');
  const leaderboardEntries = getLeaderboard(scope, period);
  const myGroups = groups.filter((group) =>
    activeChild ? group.memberChildIds.includes(activeChild.id) : false
  );

  const handleSendHighFive = async (toChildId: string) => {
    setSendingKudoId(toChildId);
    setSocialError('');
    const sent = await sendKudo(toChildId, '👏');
    setSendingKudoId(null);
    if (!sent) {
      setSocialError(socialCopy.kudoError);
      return;
    }
    setHighFiveSuccessId(toChildId);
    setTimeout(() => setHighFiveSuccessId(null), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <LeaderboardHeader activeTier={activeChild ? (activeChild.leagueTier || 'silver') : undefined} onCreateGroup={() => setIsCreateGroupOpen(true)} onJoinGroup={() => setIsJoinGroupOpen(true)} onPeriodChange={setPeriod} onScopeChange={setScope} period={period} scope={scope} />
      {activeChild && <LeaderboardPrivacyBar child={activeChild} onUpdate={updateProfile} />}
      <LeaderboardPodium entries={leaderboardEntries} period={period} />
      <LeaderboardTable entries={leaderboardEntries} error={socialError} highFiveSuccessId={highFiveSuccessId} onSendHighFive={(childId) => void handleSendHighFive(childId)} sendingKudoId={sendingKudoId} />
      <LeaderboardGroups groups={myGroups} onCreate={() => setIsCreateGroupOpen(true)} onJoin={() => setIsJoinGroupOpen(true)} />

      <CreateGroupModal
        activeChildId={activeChild?.id}
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreate={createGroup}
      />
      <JoinGroupModal
        isOpen={isJoinGroupOpen}
        onClose={() => setIsJoinGroupOpen(false)}
        onJoin={joinGroup}
      />
    </div>
  );
}
