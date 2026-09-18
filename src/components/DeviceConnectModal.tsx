'use client';

import React, { useState } from 'react';
import { X, Smartphone, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppStore } from '@/lib/store';
import { sounds } from '@/lib/sound';
import { useTranslation } from '@/lib/i18n/context';

interface DeviceConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeviceConnectModal({ isOpen, onClose, onSuccess }: DeviceConnectModalProps) {
  const {
    connectWithFamilyCode,
    familyCode,
    isFamilyConnected,
    profiles,
    activeChildId,
    setActiveChildId,
    setMode,
  } = useAppStore();
  const { t } = useTranslation();

  const [enteredCode, setEnteredCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [connectedFamilyName, setConnectedFamilyName] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleConnect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!enteredCode.trim()) {
      setErrorMsg('Vui lòng nhập mã kết nối hiển thị trên máy phụ huynh.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const result = await connectWithFamilyCode(enteredCode);

    setLoading(false);

    if (result.success) {
      setIsSuccess(true);
      setConnectedFamilyName(result.familyName || 'Gia đình Siêu Nhân');
      sounds.playFanfare();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      if (onSuccess) onSuccess();
    } else {
      setErrorMsg(result.message || 'Mã không đúng hoặc chưa được kích hoạt. Vui lòng kiểm tra lại.');
    }
  };

  const handleFinish = () => {
    setMode('kid');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div
        className="relative w-full max-w-md max-h-[90dvh] flex flex-col bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden my-auto border border-slate-100 dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-zinc-900 dark:to-zinc-900">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-800 dark:text-slate-100">
                {isSuccess ? 'Liên Kết Thành Công!' : 'Bé Vào Bằng Mã Gia Đình'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isSuccess ? 'Đã đồng bộ dữ liệu của con' : 'Kết nối máy con với tài khoản ba mẹ'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
          {!isSuccess ? (
            <>
              <div className="text-center space-y-1.5 py-1">
                <span className="text-4xl">🦁🚀</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Nhập mã 4 đến 6 ký tự hiển thị tại mục{' '}
                  <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                    &quot;Mã kết nối thiết bị cho bé&quot;
                  </strong>{' '}
                  trên máy của ba mẹ.
                </p>
              </div>

              {/* Form Input */}
              <form onSubmit={handleConnect} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider text-center">
                    Mã kết nối gia đình
                  </label>
                  <input
                    type="text"
                    value={enteredCode}
                    onChange={(e) => {
                      setEnteredCode(e.target.value.toUpperCase());
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="VD: HERO-8492"
                    maxLength={12}
                    autoFocus
                    className="w-full text-center text-xl sm:text-2xl font-mono font-black tracking-widest py-3.5 px-4 rounded-2xl bg-slate-50 dark:bg-zinc-800 border-2 border-indigo-200 dark:border-indigo-800 focus:border-indigo-600 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-zinc-600 text-slate-800 dark:text-slate-100 uppercase"
                  />
                  <p className="text-[11px] text-center text-slate-400 mt-1">
                    (Có thể nhập có hoặc không có chữ &apos;HERO-&apos;)
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs font-medium animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !enteredCode.trim()}
                  className="w-full min-h-[46px] rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none transition-all cursor-pointer active:scale-98"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang kết nối...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>🚀 Kết Nối Ngay</span>
                    </>
                  )}
                </button>
              </form>

              {/* Step instructions */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 space-y-2 text-xs">
                <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Cách kết nối nhanh và an toàn cho bé:</span>
                </div>
                <ul className="text-slate-500 dark:text-slate-400 space-y-1 pl-4 list-disc text-[11px]">
                  <li>Mở KidHabit Hero trên máy tính/điện thoại của ba mẹ.</li>
                  <li>Vào <strong>Chế độ phụ huynh</strong> &rarr; xem <strong>Mã liên kết thiết bị con</strong>.</li>
                  <li>Nhập mã này vào đây là máy bé được nạp toàn bộ nhiệm vụ &amp; đổi quà mà không sợ bị lộ mật khẩu ba mẹ!</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                  Chào mừng đến với {connectedFamilyName}!
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Máy này đã được liên kết với mã <strong className="font-mono text-indigo-600">{familyCode}</strong>. Toàn bộ nhiệm vụ của bé đã sẵn sàng!
                </p>
              </div>

              {/* Select Child Profile if multiple exist */}
              {profiles.length > 1 && (
                <div className="text-left space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center">
                    Bé nào đang sử dụng thiết bị này?
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {profiles.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setActiveChildId(p.id)}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                          p.id === activeChildId
                            ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 ring-2 ring-indigo-500'
                            : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-2xl mb-1">{p.avatar}</div>
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">{p.name}</div>
                        <div className="text-[10px] text-amber-500 font-semibold">⭐ {p.points} sao</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleFinish}
                className="w-full min-h-[44px] rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 dark:shadow-none transition-all cursor-pointer active:scale-98"
              >
                <span>Bắt Đầu Làm Nhiệm Vụ ⭐</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-3 sm:p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {isSuccess ? 'Đóng' : 'Để sau'}
          </button>
        </div>
      </div>
    </div>
  );
}
