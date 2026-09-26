'use client';

import { useState } from 'react';
import { BookOpen, Check, Landmark, Sprout, Telescope, Star } from 'lucide-react';
import { cityItems } from '@/lib/dream-city';
import type { CityItemId } from '@/lib/dream-city';
import { dreamCityCopy } from '@/lib/i18n/dream-city-copy';
import { useTranslation } from '@/lib/i18n/context';
import { useAppStore } from '@/lib/store';

const itemIcons = { garden: Sprout, library: BookOpen, bridge: Landmark, observatory: Telescope };

export function DreamCityCard() {
  const { activeChild, buildCityItem, experience } = useAppStore();
  const { language } = useTranslation();
  const copy = dreamCityCopy[language];
  const [building, setBuilding] = useState<CityItemId | null>(null);
  const [message, setMessage] = useState<'success' | 'error' | null>(null);
  if (!activeChild || activeChild.ageStage === '0-3') return null;
  const builtIds = new Set(experience.cityPurchases.filter((purchase) => purchase.child_id === activeChild.id).map((purchase) => purchase.item_id));

  const build = async (itemId: CityItemId) => {
    if (building) return;
    setBuilding(itemId);
    setMessage(null);
    const result = await buildCityItem(itemId);
    setMessage(result === 'built' || result === 'already_built' ? 'success' : 'error');
    setBuilding(null);
  };

  return (
    <section aria-labelledby="dream-city-title" className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm dark:border-amber-900/50 dark:bg-zinc-900 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id="dream-city-title" className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{copy.title}</h3>
          <p className="mt-2 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">{copy.description}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-sm font-bold text-amber-800 dark:bg-zinc-800 dark:text-amber-300">
          <Star size={16} aria-hidden="true" />{copy.available(activeChild.points)}
        </span>
      </div>
      <p className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-300">{copy.progress(builtIds.size, cityItems.length)}</p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {cityItems.map((item) => {
          const Icon = itemIcons[item.id];
          const isBuilt = builtIds.has(item.id);
          const canAfford = activeChild.points >= item.cost;
          return (
            <div key={item.id} className={`flex min-w-0 flex-col justify-between gap-4 rounded-2xl border p-4 ${isBuilt ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-amber-100 bg-white dark:border-zinc-700 dark:bg-zinc-800'}`}>
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"><Icon size={23} aria-hidden="true" /></span>
                <div className="min-w-0">
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100">{copy.items[item.id]}</h4>
                  <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">{item.cost} <Star className="inline" size={14} aria-hidden="true" /></p>
                </div>
              </div>
              {isBuilt ? (
                <span className="flex min-h-11 items-center justify-center gap-1 rounded-xl bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <Check size={16} aria-hidden="true" />{copy.built}
                </span>
              ) : (
                <button type="button" onClick={() => void build(item.id)} disabled={!canAfford || building !== null} className={`min-h-11 rounded-xl px-4 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-70 ${canAfford ? 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:hover:bg-indigo-600' : 'bg-slate-100 text-slate-700 dark:bg-zinc-700 dark:text-slate-200'}`}>
                  {building === item.id ? copy.building : canAfford ? copy.build : copy.notEnough}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {message && <p role={message === 'error' ? 'alert' : 'status'} className={`mt-4 text-sm font-bold ${message === 'error' ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>{message === 'error' ? copy.error : copy.success}</p>}
    </section>
  );
}
