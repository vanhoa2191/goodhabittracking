'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Heart,
  Baby,
  User,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  ArrowRight,
  Smile,
  BookOpen,
  Zap,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { AgeStage } from '@/types';
import { getStageFromAge, getStageInfo, generateAgeAdaptedHabits } from '@/lib/wit-framework';
import { sounds } from '@/lib/sound';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const {
    parentProfile,
    updateParentProfile,
    createProfile,
    applyAgeHabitsBundle,
    profiles,
    setActiveChildId,
  } = useAppStore();
  const { t } = useTranslation();

  const [step, setStep] = useState<1 | 2>(1);

  // Parent form state
  const [parentName, setParentName] = useState(parentProfile?.name || '');
  const [parentRole, setParentRole] = useState<'mother' | 'father' | 'grandparent' | 'guardian'>(
    parentProfile?.role || 'mother'
  );
  const [phoneOrEmail, setPhoneOrEmail] = useState(parentProfile?.phoneOrEmail || '');

  // Child form state
  const [childName, setChildName] = useState('');
  const [childNickname, setChildNickname] = useState('');
  const [childAge, setChildAge] = useState<number>(5);
  const [childAvatar, setChildAvatar] = useState('🌟');
  const [childThemeColor, setChildThemeColor] = useState('#6366f1');
  const [autoApplyHabits, setAutoApplyHabits] = useState(true);

  if (!isOpen) return null;

  const currentStage: AgeStage = getStageFromAge(childAge);
  const stageInfo = getStageInfo(currentStage);
  const previewHabits = generateAgeAdaptedHabits(null, currentStage);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName.trim()) {
      alert('Vui lòng nhập tên của ba mẹ để tiện xưng hô trong ứng dụng nhé!');
      return;
    }
    updateParentProfile({
      name: parentName.trim(),
      role: parentRole,
      phoneOrEmail: phoneOrEmail.trim(),
    });
    sounds.playClick();
    setStep(2);
  };

  const handleCompleteRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName.trim()) {
      alert('Vui lòng nhập tên của bé yêu!');
      return;
    }

    // Create child profile with age & ageStage
    createProfile({
      name: childName.trim(),
      nickname: childNickname.trim() || `Bé ${childName.trim().split(/\s+/).pop()}`,
      avatar: childAvatar,
      themeColor: childThemeColor,
      points: 20,
      totalEarned: 20,
      level: 1,
      streak: 1,
      age: childAge,
      birthYear: new Date().getFullYear() - childAge,
      ageStage: currentStage,
      showRealNameOnLeaderboard: false,
      isPublicOnLeaderboard: true,
    });

    sounds.playLevelUp();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-zinc-800 flex flex-col max-h-[92vh] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Đăng Ký &amp; Cá Nhân Hóa Theo Lứa Tuổi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {step === 1
                  ? 'Bước 1/2: Thông tin Người Thân Giáo (Ba Mẹ)'
                  : 'Bước 2/2: Thông tin Bé &amp; Thích ứng Hành Động (16 Chân Dung)'}
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 overscroll-contain">
          {step === 1 ? (
            /* STEP 1: PARENT INFORMATION */
            <form onSubmit={handleNextStep} className="space-y-5">
              {/* Philosophy banner */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-3">
                <Heart className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs text-indigo-950 dark:text-indigo-200">
                  <span className="font-bold block">
                    &ldquo;Trở thành trước khi Giáo dục &ndash; Thân giáo làm gương&rdquo;
                  </span>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    Trẻ em không học qua việc nghe đạo lý, trẻ học bằng mắt qua hiện thực của cha mẹ. Khi ba mẹ an vui và thắp sáng ngọn đèn nhân cách, con sẽ tự khắc chuyển hóa!
                  </p>
                </div>
              </div>

              {/* Parent Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tên của Ba Mẹ / Người nuôi dưỡng *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Mẹ Lan, Bố Tuấn, Bà Ngoại..."
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="w-full py-2.5 px-3.5 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Parent Role */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Vai trò của bạn trong gia đình
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'mother', label: '👩 Mẹ yêu' },
                    { id: 'father', label: '👨 Bố yêu' },
                    { id: 'grandparent', label: '👵 Ông / Bà' },
                    { id: 'guardian', label: '🧑 Người giám hộ' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setParentRole(r.id as any)}
                      className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all text-center cursor-pointer ${
                        parentRole === r.id
                          ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-xs'
                          : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone or Email for backup / sync */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Số điện thoại hoặc Email (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Nhập để lưu trữ và nhận cẩm nang nuôi dạy con..."
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                  className="w-full py-2.5 px-3.5 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Dữ liệu được bảo mật an toàn, dùng để đồng bộ lộ trình trên nhiều thiết bị.
                </span>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Tiếp Tục: Thêm Thông Tin Bé</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: CHILD INFORMATION & AGE ADAPTATION */
            <form onSubmit={handleCompleteRegistration} className="space-y-5">
              {/* Child Name & Nickname */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Họ và Tên bé *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Minh An..."
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    className="w-full py-2.5 px-3.5 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Biệt danh của bé
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Bé Bo, Sóc Nhí, Cún Con..."
                    value={childNickname}
                    onChange={(e) => setChildNickname(e.target.value)}
                    className="w-full py-2.5 px-3.5 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Age Selector with Dynamic Golden Stage Card */}
              <div className="p-4 rounded-3xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span>Độ tuổi của bé hiện tại:</span>
                  </label>
                  <div className="flex items-center gap-1 bg-white dark:bg-zinc-700 px-3 py-1 rounded-full border border-slate-200 dark:border-zinc-600">
                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-300">
                      {childAge}
                    </span>
                    <span className="text-xs font-bold text-slate-500">tuổi</span>
                  </div>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min={0}
                  max={18}
                  value={childAge}
                  onChange={(e) => setChildAge(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 dark:bg-zinc-700 rounded-lg"
                />

                {/* Dynamic Stage Banner */}
                <div className={`p-3.5 rounded-2xl bg-gradient-to-r ${stageInfo.color} text-white shadow-sm space-y-1`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{stageInfo.icon}</span>
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wider block opacity-90">
                          {stageInfo.label} &bull; {stageInfo.title}
                        </span>
                        <h4 className="text-sm font-black">{stageInfo.subtitle}</h4>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] opacity-95 leading-relaxed pt-1">
                    {stageInfo.summary}
                  </p>
                </div>
              </div>

              {/* Avatar Mascot & Color Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Linh vật may mắn của bé ({childAvatar})
                </label>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {['🦁', '🐰', '🐼', '👶', '🦊', '🐱', '🐶', '🦄', '🚀', '🌟', '👑', '🦸'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setChildAvatar(emoji)}
                      className={`w-11 h-11 rounded-2xl text-2xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                        childAvatar === emoji
                          ? 'bg-indigo-100 border-2 border-indigo-600 scale-110 shadow-sm'
                          : 'bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview of Age-Adapted Habits Bundle */}
              <div className="p-4 rounded-3xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                      Gói Hành Động Thích Ứng ({stageInfo.label})
                    </span>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    <input
                      type="checkbox"
                      checked={autoApplyHabits}
                      onChange={(e) => setAutoApplyHabits(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Tự động nạp mẫu</span>
                  </label>
                </div>

                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {previewHabits.map((act, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-base">{act.icon}</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                          {act.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full shrink-0">
                        +{act.points} ⭐
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-3 px-5 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 fill-current" />
                  <span>Hoàn Tất &amp; Bắt Đầu Rèn Luyện</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
