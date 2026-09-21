'use client';

import React, { useState } from 'react';
import { ModalShell } from '@/components/ui/ModalShell';
import {
  X,
  BookOpen,
  Sparkles,
  Layers,
  Sun,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { AgeStage } from '@/types';
import { sounds } from '@/lib/sound';
import { useTranslation } from '@/lib/i18n/context';
import { getOnboardingCopy } from '@/lib/i18n/onboarding-copy';
import { getPortraitGuideCopy } from '@/lib/i18n/portrait-guide-copy';
import { useAgeHabitBundleMutation } from '@/lib/store/use-age-habit-bundle-mutation';
import { PortraitGivingPanel } from './PortraitGivingPanel';
import { PortraitMatrixPanel } from './PortraitMatrixPanel';
import { PortraitModelingPanel } from './PortraitModelingPanel';

interface Portrait16ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Portrait16Modal({ isOpen, onClose }: Portrait16ModalProps) {
  const { activeChild } = useAppStore();
  const { language } = useTranslation();
  const guide = getPortraitGuideCopy(language);
  const onboarding = getOnboardingCopy(language);

  const [activeTab, setActiveTab] = useState<'matrix' | 'bothi' | 'thangiao'>('matrix');
  const [selectedStage, setSelectedStage] = useState<AgeStage>(activeChild?.ageStage || '3-6');
  const [checkedChecklist, setCheckedChecklist] = useState<number[]>([]);
  const { applyAgeBundle, mutationError, pendingChildId } = useAgeHabitBundleMutation();

  if (!isOpen) return null;

  const stageLabel = onboarding.stageLabels[selectedStage];

  const handleApplyHabits = async () => {
    if (!activeChild) {
      alert(guide.ui.noChild);
      return;
    }
    const saved = await applyAgeBundle(activeChild.id, selectedStage);
    if (!saved) return;
    alert(guide.ui.applySuccess(stageLabel, activeChild.name));
    onClose();
  };

  const toggleChecklist = (idx: number) => {
    sounds.playClick();
    setCheckedChecklist((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} label={guide.ui.dialogLabel} maxWidth="4xl">
        {/* Modal Header */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {guide.ui.headerTitle}
                </h2>
                <span className="hidden sm:inline-flex text-xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  {guide.ui.ageBadge}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {guide.ui.headerSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-95"
            title={guide.ui.close}
            aria-label={guide.ui.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Top Tabs */}
        <div role="tablist" className="shrink-0 flex p-2 bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-100 dark:border-zinc-800 gap-1 overflow-x-auto">
          <button
            role="tab"
            aria-selected={activeTab === 'matrix'}
            onClick={() => setActiveTab('matrix')}
            className={`flex-1 min-w-[105px] sm:min-w-[130px] py-2 px-2 sm:px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{guide.ui.tabMatrix}</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'bothi'}
            onClick={() => setActiveTab('bothi')}
            className={`flex-1 min-w-[105px] sm:min-w-[120px] py-2 px-2 sm:px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'bothi'
                ? 'bg-white dark:bg-zinc-900 text-pink-600 dark:text-pink-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-pink-500" />
            <span>{guide.ui.tabGivings}</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'thangiao'}
            onClick={() => setActiveTab('thangiao')}
            className={`flex-1 min-w-[105px] sm:min-w-[130px] py-2 px-2 sm:px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'thangiao'
                ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>{guide.ui.tabModeling}</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 overscroll-contain">
          {activeTab === 'matrix' && (
            <PortraitMatrixPanel
              activeChild={activeChild}
              guide={guide}
              onboarding={onboarding}
              selectedStage={selectedStage}
              pending={pendingChildId === activeChild?.id}
              mutationError={mutationError}
              onStageChange={(stage) => {
                setSelectedStage(stage);
                sounds.playClick();
              }}
              onApply={() => void handleApplyHabits()}
            />
          )}
          {activeTab === 'bothi' && <PortraitGivingPanel guide={guide} />}
          {activeTab === 'thangiao' && (
            <PortraitModelingPanel
              checkedChecklist={checkedChecklist}
              guide={guide}
              onToggleChecklist={toggleChecklist}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/70">
          <div className="text-xs text-slate-400">
            {guide.ui.footer}
          </div>
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            {guide.ui.close}
          </button>
        </div>
    </ModalShell>
  );
}
