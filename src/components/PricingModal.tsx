'use client';

import React from 'react';
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
      badge: '👑 KHUYÊN DÙNG • TIẾT KIỆM 35%',
      cta: 'Chọn Gói Năm (399k - Tiết kiệm 35%)',
    },
    en: {
      name: 'Companion Plan',
      desc: 'Best value and most economical for a whole year of habit building',
      period: '/ year',
      badge: '👑 RECOMMENDED • SAVE 35%',
      cta: 'Choose Yearly (399k - Save 35%)',
    },
    fr: {
      name: 'Forfait Compagnon',
      desc: 'Le meilleur rapport qualité-prix pour accompagner votre enfant toute l’année',
      period: '/ an',
      badge: '👑 RECOMMANDÉ • -35%',
      cta: 'Choisir l’Annuel (399k - Économisez 35%)',
    },
    de: {
      name: 'Begleiter-Paket',
      desc: 'Die beste und wirtschaftlichste Wahl für ein ganzes Jahr Gewohnheitstraining',
      period: '/ Jahr',
      badge: '👑 EMPFOHLEN • 35% SPAREN',
      cta: 'Jahresplan (399k - 35% Rabatt)',
    },
    it: {
      name: 'Piano Compagno',
      desc: 'La scelta migliore e più economica per un intero anno di crescita',
      period: '/ anno',
      badge: '👑 CONSIGLIATO • RISPARMIA 35%',
      cta: 'Scegli Annuale (399k - Risparmia 35%)',
    },
    es: {
      name: 'Plan Compañero',
      desc: 'La mejor y más económica opción para todo un año de crecimiento',
      period: '/ año',
      badge: '👑 RECOMENDADO • AHORRA 35%',
      cta: 'Elegir Anual (399k - Ahorra 35%)',
    },
    zh: {
      name: '陪伴成长套餐',
      desc: '最具性价比的全年成长计划，陪伴孩子养成自律品格',
      period: '/ 年',
      badge: '👑 推荐首选 • 立省 35%',
      cta: '选择年度特惠 (399k - 省35%)',
    },
    ja: {
      name: '伴走プラン',
      desc: '1年間の習慣づくりに最もお得で経済的なベストチョイス',
      period: '/ 年',
      badge: '👑 一番人気 • 35%OFF',
      cta: '年額プランを選択 (399k - 35%お得)',
    },
    ko: {
      name: '동행 플랜',
      desc: '1년 동안 꾸준히 습관을 다지기에 가장 경제적이고 효과적인 선택',
      period: '/ 년',
      badge: '👑 추천 • 35% 할인',
      cta: '연간 플랜 선택 (399k - 35% 할인)',
    },
  },
  lifetime: {
    vi: {
      name: 'Gói Trọn Đời',
      desc: 'Đầu tư 1 lần duy nhất, con và cả gia đình sử dụng mãi mãi',
      period: 'Trọn đời',
      badge: '💎 HERO VIP TRỌN ĐỜI',
      cta: 'Sở hữu Trọn Đời (799k)',
    },
    en: {
      name: 'Lifetime Hero Plan',
      desc: 'One-time investment, perpetual access for your entire family',
      period: 'Lifetime',
      badge: '💎 LIFETIME HERO VIP',
      cta: 'Get Lifetime Access (799k)',
    },
    fr: {
      name: 'Forfait À Vie',
      desc: 'Investissement unique, accès illimité pour toute votre famille',
      period: 'À vie',
      badge: '💎 VIP À VIE',
      cta: 'Obtenir l’Accès À Vie (799k)',
    },
    de: {
      name: 'Lebenslanges Paket',
      desc: 'Einmalige Investition, lebenslanger Zugang für die ganze Familie',
      period: 'Lebenslang',
      badge: '💎 LEBENSLANGER VIP',
      cta: 'Lebenslang sichern (799k)',
    },
    it: {
      name: 'Piano a Vita',
      desc: 'Un solo investimento, accesso per sempre per tutta la tua famiglia',
      period: 'A vita',
      badge: '💎 VIP A VITA',
      cta: 'Ottieni Accesso a Vita (799k)',
    },
    es: {
      name: 'Plan de por Vida',
      desc: 'Una única inversión, acceso ilimitado para toda la familia',
      period: 'De por vida',
      badge: '💎 VIP DE POR VIDA',
      cta: 'Obtener de por Vida (799k)',
    },
    zh: {
      name: '终身英雄套餐',
      desc: '仅需一次性投资，全家永久享受所有 Pro 专属特权',
      period: '终身',
      badge: '💎 终身尊享 VIP',
      cta: '终身买断 (799k)',
    },
    ja: {
      name: 'ライフタイムプラン',
      desc: '1度のお支払いで、ご家族全員がずっと使い続けられる買い切りプラン',
      period: '買い切り',
      badge: '💎 永久VIP',
      cta: '買い切りプランを購入 (799k)',
    },
    ko: {
      name: '평생 소장 플랜',
      desc: '단 한 번의 투자로 온 가족이 평생 사용하는 프리미엄 혜택',
      period: '평생',
      badge: '💎 평생 VIP 소장',
      cta: '평생 소장하기 (799k)',
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

  if (!isOpen) return null;

  const subDetails = getSubscriptionDetails();

  const handleActivateTrial = () => {
    activateFreeTrial();
    onClose();
  };

  const handleSelectPlan = (planId: SubscriptionPlan) => {
    if (planId === 'free') {
      onClose();
      return;
    }
    if (planId === 'trial') {
      handleActivateTrial();
      return;
    }
    openCheckoutModal(planId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-5xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-zinc-800 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
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
                <span className="hidden sm:inline-flex text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
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
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-indigo-600 to-violet-600 p-5 text-white shadow-lg">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-black tracking-wider uppercase">
                    {t.specialOffer}
                  </span>
                  <span className="text-xs font-bold text-amber-200">{t.noCreditCardNeeded}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black tracking-tight">
                  {t.freeTrialTitle}
                </h3>
                <p className="text-xs text-indigo-100 leading-relaxed">
                  {t.freeTrialDesc}
                </p>
              </div>

              <div className="shrink-0">
                {subscriptionPlan === 'trial' ? (
                  <div className="px-4 py-2.5 rounded-2xl bg-white/20 backdrop-blur-md text-white text-xs font-bold border border-white/30 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>{t.trialActiveRemaining.replace('{days}', String(subDetails.daysRemaining ?? 7))}</span>
                  </div>
                ) : isPro ? (
                  <div className="px-4 py-2.5 rounded-2xl bg-white/20 backdrop-blur-md text-white text-xs font-bold border border-white/30 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-300" />
                    <span>{t.yourPlanIs.replace('{plan}', subDetails.label)}</span>
                  </div>
                ) : (
                  <button
                    onClick={handleActivateTrial}
                    className="w-full sm:w-auto min-h-[48px] px-5 py-3 rounded-2xl bg-white text-indigo-700 hover:bg-amber-50 text-xs sm:text-sm font-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500 fill-current" />
                    <span>{t.activateTrialBtn}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Decorative background circle */}
            <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          </div>

          {/* 2. Pricing Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRICING_PLANS.filter((p) => p.id !== 'free' && p.id !== 'trial').map((plan) => {
              const isCurrent = subscriptionPlan === plan.id;
              const loc = PLAN_LOCALIZATION[plan.id]?.[language] || PLAN_LOCALIZATION[plan.id]?.vi || {
                name: plan.name,
                desc: plan.description,
                period: plan.periodLabel,
                badge: plan.badge,
                cta: plan.ctaText,
              };

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
                  {loc.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span
                        className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm ${
                          plan.popular
                            ? 'bg-indigo-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {loc.badge}
                      </span>
                    </div>
                  )}

                  <div className="space-y-4 pt-1">
                    <div>
                      <h4 className="font-black text-base text-slate-800 dark:text-slate-100 flex items-center justify-between">
                        <span>{loc.name}</span>
                        {plan.savings && (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                            {plan.savings}
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 min-h-[32px] leading-relaxed">
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
                        <div className="text-[11px] text-slate-400 line-through mt-0.5">
                          {plan.originalPrice.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} VNĐ
                        </div>
                      )}
                      {plan.dailyEquivalent && (
                        <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                          ⚡ {plan.dailyEquivalent}
                        </div>
                      )}
                    </div>

                    {/* Feature list */}
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-tight">{feat}</span>
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
              <table className="w-full text-xs text-left">
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
              <p className="text-[11px] text-slate-400">{t.freeTrialDays}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 space-y-1">
              <div className="w-8 h-8 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">{t.vietQrOneTouch || 'VietQR'}</h5>
              <p className="text-[11px] text-slate-400">{t.scanWithBankApp}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 space-y-1">
              <div className="w-8 h-8 mx-auto rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">{t.appName}</h5>
              <p className="text-[11px] text-slate-400">{t.appSlogan}</p>
            </div>
          </div>
        </div>

        {/* Fixed Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/80">
          <div className="flex items-center gap-2 text-xs text-slate-500">
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
      </div>
    </div>
  );
}
