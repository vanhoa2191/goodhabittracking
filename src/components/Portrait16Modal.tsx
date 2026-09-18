'use client';

import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Sparkles,
  Heart,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  HelpCircle,
  Zap,
  Award,
  ArrowRight,
  Sun,
  Smile,
  Eye,
  MessageCircle,
  Flame,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { AgeStage } from '@/types';
import {
  PORTRAITS_16,
  SEVEN_GIVINGS,
  SIX_GOLD_WORDS,
  PARENT_SELF_CHECKLIST,
  getStageInfo,
} from '@/lib/wit-framework';
import { sounds } from '@/lib/sound';

interface Portrait16ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Portrait16Modal({ isOpen, onClose }: Portrait16ModalProps) {
  const { activeChild, applyAgeHabitsBundle } = useAppStore();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'matrix' | 'bothi' | 'thangiao'>('matrix');
  const [selectedStage, setSelectedStage] = useState<AgeStage>(activeChild?.ageStage || '3-6');
  const [checkedChecklist, setCheckedChecklist] = useState<number[]>([]);

  if (!isOpen) return null;

  const stageInfo = getStageInfo(selectedStage);

  const handleApplyHabits = () => {
    if (!activeChild) {
      alert('Vui lòng chọn hoặc tạo hồ sơ bé trước!');
      return;
    }
    applyAgeHabitsBundle(activeChild.id, selectedStage);
    alert(`Đã áp dụng thành công bộ hành động (${stageInfo.label}) cho bé ${activeChild.name}!`);
    onClose();
  };

  const toggleChecklist = (idx: number) => {
    sounds.playClick();
    setCheckedChecklist((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-zinc-800 flex flex-col max-h-[92vh] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Cẩm Nang 16 Chân Dung &amp; 7 Bố Thí
                </h2>
                <span className="hidden sm:inline-flex text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  0 - 18 Tuổi
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Vật chất hóa 9 Nhân cách &bull; 5 Phẩm chất &bull; 2 Năng lực &bull; 7 Bố thí đời người
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-95"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Top Tabs */}
        <div className="shrink-0 flex p-2 bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-100 dark:border-zinc-800 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>16 Chân Dung &amp; 4 Giai Đoạn</span>
          </button>

          <button
            onClick={() => setActiveTab('bothi')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'bothi'
                ? 'bg-white dark:bg-zinc-900 text-pink-600 dark:text-pink-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-pink-500" />
            <span>7 Bố Thí Đời Người</span>
          </button>

          <button
            onClick={() => setActiveTab('thangiao')}
            className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'thangiao'
                ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Thân Giáo &amp; 6 Chữ Vàng</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 overscroll-contain">
          {activeTab === 'matrix' && (
            <div className="space-y-5">
              {/* 4 Golden Stage Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    Chọn lứa tuổi của con:
                  </span>
                  {activeChild && (
                    <span className="text-[11px] text-slate-400">
                      Bé hiện tại: <strong>{activeChild.name}</strong> ({activeChild.age || 5} tuổi)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['0-3', '3-6', '6-12', '12-18'] as AgeStage[]).map((st) => {
                    const info = getStageInfo(st);
                    const isSelected = selectedStage === st;
                    return (
                      <button
                        key={st}
                        onClick={() => {
                          setSelectedStage(st);
                          sounds.playClick();
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-xs'
                            : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{info.icon}</span>
                          <div>
                            <span className="text-xs font-black block text-slate-800 dark:text-slate-100">
                              {info.label}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate block max-w-[110px]">
                              {info.title.split('&')[0]}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stage Overview Banner */}
              <div className={`p-4 rounded-3xl bg-gradient-to-r ${stageInfo.color} text-white shadow-md space-y-2`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                      {stageInfo.label} &bull; {stageInfo.title}
                    </span>
                    <h3 className="text-base sm:text-lg font-black">{stageInfo.subtitle}</h3>
                    <p className="text-xs text-white/90 leading-relaxed max-w-2xl">
                      {stageInfo.summary}
                    </p>
                  </div>

                  {activeChild && (
                    <button
                      onClick={handleApplyHabits}
                      className="shrink-0 py-2.5 px-4 rounded-2xl bg-white text-indigo-700 hover:bg-amber-50 font-black text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Zap className="w-4 h-4 text-amber-500 fill-current" />
                      <span>Áp Dụng Cho Bé {activeChild.name.split(' ').pop()}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 16 Portraits List for this stage */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Hành động chi tiết 16 Chân dung ({stageInfo.label}):
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PORTRAITS_16.map((item) => {
                    const action = item.actionsByStage[selectedStage];
                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/80 hover:border-indigo-300 transition-all space-y-2 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl p-1 rounded-xl bg-slate-50 dark:bg-zinc-700">
                              {item.icon}
                            </span>
                            <div>
                              <span className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-100 block">
                                {item.name}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                {item.category === 'personality'
                                  ? 'Nhân cách'
                                  : item.category === 'virtue'
                                  ? 'Phẩm chất'
                                  : item.category === 'capacity'
                                  ? 'Năng lực'
                                  : 'Tầm nhìn'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800 text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                          {action}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bothi' && (
            <div className="space-y-5">
              {/* Introduction to 7 Givings */}
              <div className="p-4 rounded-3xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white shadow-md space-y-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                  7 Bố Thí Đời Người &bull; Giáo Dục Tận Gốc
                </span>
                <h3 className="text-base sm:text-lg font-black">
                  Khởi Tạo Phước Đức &amp; Bồi Dưỡng Nhân Cách Cho Con
                </h3>
                <p className="text-xs text-pink-100 leading-relaxed max-w-2xl">
                  Bố thí không phải chỉ là tiền bạc, mà là 7 điều giản dị ai cũng có thể cho đi mỗi ngày: Nụ cười, ánh mắt, lời nói, lòng biết ơn, sự bao dung, hành động nhân ái và sự nhường nhịn.
                </p>
              </div>

              {/* 7 Givings Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SEVEN_GIVINGS.map((g, idx) => (
                  <div
                    key={g.id}
                    className="p-4 rounded-3xl bg-white dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700 space-y-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/40 text-2xl flex items-center justify-center shrink-0">
                        {g.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-sm text-slate-800 dark:text-slate-100">
                            {g.name}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300">
                            {idx + 1}/7
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-pink-600 dark:text-pink-400">
                          {g.subName}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        <strong>Ý nghĩa:</strong> {g.meaning}
                      </div>
                      <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                        ⭐ <strong>Thực hành:</strong> {g.dailyPractice}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'thangiao' && (
            <div className="space-y-6">
              {/* Golden Rule of Parental Modeling */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 text-white shadow-md space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                  Nghệ Thuật Thân Giáo Làm Gương
                </span>
                <h3 className="text-base sm:text-lg font-black">
                  &ldquo;Nói được mà dạy con đạo lý thì chưa phù hợp &ndash; Hãy sở hữu hiện thực trước!&rdquo;
                </h3>
                <p className="text-xs text-amber-100 leading-relaxed max-w-2xl">
                  Để con sở hữu 16 chân dung, cha mẹ phải là người sống trong hiện thực đó. Khi cha mẹ thực sự An vui, đứa trẻ sẽ hấp thu năng lượng đó và tự động chuyển hóa.
                </p>
              </div>

              {/* 6 Gold Words */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Công Thức 6 Chữ Vàng Của Cha Mẹ Thông Thái:</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {SIX_GOLD_WORDS.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 space-y-1"
                    >
                      <span className="font-black text-sm text-indigo-600 dark:text-indigo-400 block">
                        ✨ {item.word}
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {item.meaning}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5 Daily Self-Reflection Questions */}
              <div className="p-5 rounded-3xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h4 className="font-black text-sm text-slate-800 dark:text-slate-100">
                        Checklist 5 Câu Hỏi Tự Vấn Cho Cha Mẹ Mỗi Tối
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Dành 2 phút trước khi ngủ để soi chiếu hiện thực của chính mình
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                    {checkedChecklist.length}/5 hoàn thành
                  </span>
                </div>

                <div className="space-y-2">
                  {PARENT_SELF_CHECKLIST.map((question, idx) => {
                    const isChecked = checkedChecklist.includes(idx);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleChecklist(idx)}
                        className={`p-3 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                            : 'bg-slate-50 dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 shrink-0"
                        />
                        <span className="text-xs font-semibold leading-relaxed">
                          {question}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/70">
          <div className="text-xs text-slate-400">
            Trở thành &bull; Làm gương &bull; Bộc lộ nhất quán
          </div>
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Đóng cẩm nang
          </button>
        </div>
      </div>
    </div>
  );
}
