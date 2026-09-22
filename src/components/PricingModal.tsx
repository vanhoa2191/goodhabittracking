'use client';

import React, { useState } from 'react';
import {
  X,
  Check,
  Sparkles,
  Zap,
  Crown,
  ShieldCheck,
  HeartHandshake,
  CheckCircle2,
  QrCode,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { PRICING_PLANS } from '@/lib/payos';
import { SubscriptionPlan, Language } from '@/types';
import { useTranslation } from '@/lib/i18n/context';
import { ModalShell } from '@/components/ui/ModalShell';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Localized plan descriptions and titles
const PLAN_LOCALIZATION: Record<
  string,
  Record<Language, { name: string; desc: string; period: string; badge?: string; cta: string }>
> = {
  monthly: {
    vi: {
      name: 'Gói Siêu Nhân',
      desc: 'Chỉ bằng 1/2 ly trà sữa, tạo dựng nếp sống vững chắc cho con',
      period: '/ tháng',
      badge: 'Linh hoạt',
      cta: 'Nâng cấp Gói Tháng (49k)',
    },
    en: {
      name: 'Super Hero Plan',
      desc: 'Less than half a milk tea, building solid habits for your child',
      period: '/ month',
      badge: 'Flexible',
      cta: 'Upgrade Monthly (49k)',
    },
    fr: {
      name: 'Forfait Super-Héros',
      desc: 'Moins cher qu’un goûter, bâtissez des habitudes durables pour votre enfant',
      period: '/ mois',
      badge: 'Flexible',
      cta: 'Passer au Mensuel (49k)',
    },
    de: {
      name: 'Superhelden-Paket',
      desc: 'Weniger als ein Snack, baut nachhaltige Gewohnheiten für Ihr Kind auf',
      period: '/ Monat',
      badge: 'Flexibel',
      cta: 'Monatsplan wählen (49k)',
    },
    it: {
      name: 'Piano Supereroe',
      desc: 'Meno di una merenda, crea solide abitudini quotidiane per tuo figlio',
      period: '/ mese',
      badge: 'Flessibile',
      cta: 'Passa al Mensile (49k)',
    },
    es: {
      name: 'Plan Superhéroe',
      desc: 'Menos que un snack, construye hábitos sólidos para tus hijos',
      period: '/ mes',
      badge: 'Flexible',
      cta: 'Mejorar a Mensual (49k)',
    },
    zh: {
      name: '超级英雄套餐',
      desc: '不到半杯奶茶的费用，为孩子培养坚实的好习惯',
      period: '/ 月',
      badge: '灵活便捷',
      cta: '升级月度会员 (49k)',
    },
    ja: {
      name: 'スーパーヒーロープラン',
      desc: 'おやつ1回分以下の手頃さで、お子様の一生モノの良い習慣を育みます',
      period: '/ 月',
      badge: 'お手軽',
      cta: '月額プランに登録 (49k)',
    },
    ko: {
      name: '슈퍼 히어로 플랜',
      desc: '간식 한 번 가격으로, 아이의 평생 좋은 습관을 만들어 줍니다',
      period: '/ 월',
      badge: '유연한 선택',
      cta: '월간 플랜 업그레이드 (49k)',
    },
  },
  yearly: {
    vi: {
      name: 'Gói Đồng Hành',
      desc: 'Lựa chọn tốt nhất và kinh tế nhất cho cả năm rèn luyện nếp sống',
      period: '/ năm',
      badge: '👑 KHUYÊN DÙNG • TIẾT KIỆM 32%',
      cta: 'Chọn Gói Năm (399k - Tiết kiệm 32%)',
    },
    en: {
      name: 'Companion Plan',
      desc: 'Best value and most economical for a whole year of habit building',
      period: '/ year',
      badge: '👑 RECOMMENDED • SAVE 32%',
      cta: 'Choose Yearly (399k - Save 32%)',
    },
    fr: {
      name: 'Forfait Compagnon',
      desc: 'Le meilleur rapport qualité-prix pour accompagner votre enfant toute l’année',
      period: '/ an',
      badge: '👑 RECOMMANDÉ • -32%',
      cta: 'Choisir l’Annuel (399k - Économisez 32%)',
    },
    de: {
      name: 'Begleiter-Paket',
      desc: 'Die beste und wirtschaftlichste Wahl für ein ganzes Jahr Gewohnheitstraining',
      period: '/ Jahr',
      badge: '👑 EMPFOHLEN • 32% SPAREN',
      cta: 'Jahresplan (399k - 32% Rabatt)',
    },
    it: {
      name: 'Piano Compagno',
      desc: 'La scelta migliore e più economica per un intero anno di crescita',
      period: '/ anno',
      badge: '👑 CONSIGLIATO • RISPARMIA 32%',
      cta: 'Scegli Annuale (399k - Risparmia 32%)',
    },
    es: {
      name: 'Plan Compañero',
      desc: 'La mejor y más económica opción para todo un año de crecimiento',
      period: '/ año',
      badge: '👑 RECOMENDADO • AHORRA 32%',
      cta: 'Elegir Anual (399k - Ahorra 32%)',
    },
    zh: {
      name: '陪伴成长套餐',
      desc: '最具性价比的全年成长计划，陪伴孩子养成自律品格',
      period: '/ 年',
      badge: '👑 推荐首选 • 立省 32%',
      cta: '选择年度特惠 (399k - 省32%)',
    },
    ja: {
      name: '伴走プラン',
      desc: '1年間の習慣づくりに最もお得で経済的なベストチョイス',
      period: '/ 年',
      badge: '👑 一番人気 • 32%OFF',
      cta: '年額プランを選択 (399k - 32%お得)',
    },
    ko: {
      name: '동행 플랜',
      desc: '1년 동안 꾸준히 습관을 다지기에 가장 경제적이고 효과적인 선택',
      period: '/ 년',
      badge: '👑 추천 • 32% 할인',
      cta: '연간 플랜 선택 (399k - 32% 할인)',
    },
  },
};

export function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const {
    isPro,
    subscriptionPlan,
    activateFreeTrial,
    openCheckoutModal,
    getSubscriptionDetails,
  } = useAppStore();

  const { language, t } = useTranslation();
  const [trialError, setTrialError] = useState<string | null>(null);
  const [isActivatingTrial, setIsActivatingTrial] = useState(false);

  if (!isOpen) return null;

  const subDetails = getSubscriptionDetails();
  const offerLabel = t.specialOffer.replace(/^[🎁👑]\s*/u, '');

  const handleActivateTrial = async () => {
    setIsActivatingTrial(true);
    setTrialError(null);
    const result = await activateFreeTrial();
    setIsActivatingTrial(false);
    if (result.success) onClose();
    else setTrialError(result.error ?? t.connectFail);
  };

  const handleSelectPlan = (planId: SubscriptionPlan) => {
    if (planId === 'free') {
      onClose();
      return;
    }
    if (planId === 'trial') {
      void handleActivateTrial();
      return;
    }
    openCheckoutModal(planId);
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} label={t.pricingModalTitle} maxWidth="5xl">
        {/* Fixed Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
              <Crown className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {t.pricingModalTitle}
                </h2>
                <span className="hidden sm:inline-flex text-xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  {t.vietQrOneTouch || 'VietQR 1-Chạm'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.pricingModalSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title={t.close}
            aria-label={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
          {/* 1. Highlight Banner: 7-Day Free Trial */}
          <div data-testid="trial-summary" className="rounded-3xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm dark:border-indigo-800 dark:bg-indigo-950/40 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="max-w-2xl space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                    {offerLabel}
                  </span>
                  <span className="text-sm font-bold text-indigo-800 dark:text-indigo-200">{t.noCreditCardNeeded}</span>
                </div>
                <h3 className="text-lg font-black tracking-tight text-slate-950 dark:text-white sm:text-xl">
                  {t.freeTrialTitle}
                </h3>
                <p className="text-sm font-medium leading-6 text-slate-700 dark:text-slate-200">
                  {t.freeTrialDesc}
                </p>
              </div>

              <div className="shrink-0">
                {subscriptionPlan === 'trial' ? (
                  <div className="flex items-center gap-2 rounded-2xl border border-emerald-300 bg-white px-4 py-3 text-sm font-extrabold text-emerald-800 shadow-sm dark:border-emerald-800 dark:bg-zinc-900 dark:text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>{t.trialActiveRemaining.replace('{days}', String(subDetails.daysRemaining ?? 7))}</span>
                  </div>
                ) : isPro ? (
                  <div className="flex items-center gap-2 rounded-2xl border border-amber-300 bg-white px-4 py-3 text-sm font-extrabold text-amber-800 shadow-sm dark:border-amber-800 dark:bg-zinc-900 dark:text-amber-300">
                    <Crown className="w-5 h-5" />
                    <span>{t.yourPlanIs.replace('{plan}', subDetails.label)}</span>
                  </div>
                ) : (
                  <button
                    onClick={handleActivateTrial}
                    disabled={isActivatingTrial}
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-md transition-colors hover:bg-indigo-700 active:scale-95 disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:w-auto"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500 fill-current" />
                    <span>{isActivatingTrial ? t.checkingPayment : t.activateTrialBtn}</span>
                  </button>
                )}
              </div>
            </div>

          </div>

          {trialError && (
            <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
              {trialError}
            </div>
          )}

          {/* 2. Pricing Plans Grid */}
          <div data-testid="paid-plan-grid" className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-5 lg:grid-cols-2">
            {PRICING_PLANS.filter((p) => p.id !== 'free' && p.id !== 'trial').map((plan) => {
              const isCurrent = subscriptionPlan === plan.id;
              const loc = PLAN_LOCALIZATION[plan.id]?.[language] || PLAN_LOCALIZATION[plan.id]?.vi || {
                name: plan.name,
                desc: plan.description,
                period: plan.periodLabel,
                badge: plan.badge,
                cta: plan.ctaText,
              };
              const badge = plan.popular
                ? loc.badge?.replace(/^👑\s*/u, '').split('•')[0].trim()
                : loc.badge?.replace(/^[🎁👑]\s*/u, '');

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-3xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 ${
                    plan.popular
                      ? 'bg-gradient-to-b from-indigo-50/70 via-white to-indigo-50/30 dark:from-indigo-950/40 dark:via-zinc-900 dark:to-zinc-900 border-2 border-indigo-600 shadow-xl'
                      : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs hover:border-indigo-300'
                  }`}
                >
                  {/* Top Badge */}
                  {badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span
                        className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm ${
                          plan.popular
                            ? 'bg-indigo-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {badge}
                      </span>
                    </div>
                  )}

                  <div className="space-y-4 pt-1">
                    <div>
                      <h4 className="font-black text-base text-slate-800 dark:text-slate-100 flex items-center justify-between">
                        <span>{loc.name}</span>
                        {plan.savings && (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                            {plan.savings}
                          </span>
                        )}
                      </h4>
                      <p className="mt-2 min-h-[48px] text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                        {loc.desc}
                      </p>
                    </div>

                    {/* Price display */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-700/60">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                          {plan.price.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
                        </span>
                        <span className="text-xs font-bold text-slate-500">VNĐ</span>
                        <span className="text-xs text-slate-400 font-medium">{loc.period}</span>
                      </div>
                      {plan.originalPrice && (
                        <div className="text-xs text-slate-400 line-through mt-0.5">
                          {plan.originalPrice.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} VNĐ
                        </div>
                      )}
                      {plan.dailyEquivalent && (
                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                          ⚡ {plan.dailyEquivalent}
                        </div>
                      )}
                    </div>

                    {/* Feature list */}
                    <ul className="space-y-2.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-5">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Plan CTA Button */}
                  <div className="pt-5 mt-4 border-t border-slate-100 dark:border-zinc-800">
                    <button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isCurrent}
                      className={`w-full min-h-[48px] py-3 px-4 rounded-2xl font-extrabold text-xs sm:text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        isCurrent
                          ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 cursor-not-allowed shadow-none'
                          : plan.popular
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-none cursor-pointer'
                          : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 cursor-pointer'
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      <span>{isCurrent ? t.planActivated : loc.cta}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. Detailed Comparison Table */}
          <div className="bg-slate-50 dark:bg-zinc-900/60 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-zinc-800 space-y-4">
            <h4 className="font-black text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{t.pricingModalSubtitle}</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-400 font-bold">
                    <th className="py-2.5 px-3 whitespace-nowrap">{t.tasks}</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">{t.freePlanCol}</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">{t.trialPlanCol}</th>
                    <th className="py-2.5 px-3 text-center text-indigo-600 dark:text-indigo-400 font-black whitespace-nowrap">
                      {t.proPlanCol}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-zinc-800/60 text-slate-700 dark:text-slate-300">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold">{t.selectChild}</td>
                    <td className="py-2.5 px-3 text-center text-slate-500">1</td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-600">{t.unlimited}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-indigo-600 dark:text-indigo-400">{t.unlimited}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold">{t.cloudStorageMode}</td>
                    <td className="py-2.5 px-3 text-center text-slate-400">—</td>
                    <td className="py-2.5 px-3 text-center text-emerald-600">✓</td>
                    <td className="py-2.5 px-3 text-center font-bold text-indigo-600 dark:text-indigo-400">✓</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold">{t.witSectionTitle}</td>
                    <td className="py-2.5 px-3 text-center text-slate-500">10</td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-600">50+</td>
                    <td className="py-2.5 px-3 text-center font-bold text-indigo-600 dark:text-indigo-400">50+</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold">{t.weeklyRoadmap} & {t.monthlyRoadmap}</td>
                    <td className="py-2.5 px-3 text-center text-slate-400">—</td>
                    <td className="py-2.5 px-3 text-center text-emerald-600">✓</td>
                    <td className="py-2.5 px-3 text-center font-bold text-indigo-600 dark:text-indigo-400">✓</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold">{t.topRankings}</td>
                    <td className="py-2.5 px-3 text-center text-slate-500">✓</td>
                    <td className="py-2.5 px-3 text-center text-emerald-600">✓</td>
                    <td className="py-2.5 px-3 text-center font-bold text-indigo-600 dark:text-indigo-400">✓</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Trust Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 space-y-1">
              <div className="w-8 h-8 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">{t.noCreditCardNeeded}</h5>
              <p className="text-xs text-slate-400">{t.freeTrialDays}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 space-y-1">
              <div className="w-8 h-8 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">{t.vietQrOneTouch || 'VietQR'}</h5>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{t.scanWithBankApp}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 space-y-1">
              <div className="w-8 h-8 mx-auto rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">{t.appName}</h5>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{t.appSlogan}</p>
            </div>
          </div>
        </div>

        {/* Fixed Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/80">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{t.bankStandardNotice}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto min-h-[44px] py-2.5 px-5 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {t.decideLater}
            </button>
          </div>
        </div>
    </ModalShell>
  );
}
