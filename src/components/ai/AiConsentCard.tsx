'use client';

import { useTranslation } from '@/lib/i18n/context';
import { getAiCopy } from '@/lib/i18n/ai-copy';
import { useAiConsent } from '@/lib/store/ai-client';
import { HelpTip } from '@/components/help/HelpTip';

/** The parent's own, withdrawable agreement to AI suggestions, saying exactly what is and is never sent. */
export function AiConsentCard() {
  const { language } = useTranslation();
  const copy = getAiCopy(language);
  const { enabled, saving, failed, save } = useAiConsent();

  return (
    <section data-testid="ai-consent-card" aria-labelledby="ai-consent-title" className="space-y-3 rounded-3xl border border-slate-100 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-1">
        <h4 id="ai-consent-title" className="text-sm font-black text-slate-800 dark:text-slate-100">{copy.consentTitle}</h4>
        <HelpTip topic="ai.consent" />
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300">{copy.consentIntro}</p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
        <li>{copy.consentSends}</li>
        <li>{copy.consentNever}</li>
        <li>{copy.consentOnlyHelp}</li>
      </ul>
      <label className="flex min-h-11 items-center gap-3 text-sm font-bold text-slate-800 dark:text-slate-100">
        <input
          type="checkbox"
          className="h-6 w-6 accent-indigo-600"
          checked={enabled === true}
          disabled={enabled === null || saving}
          onChange={(event) => void save(event.target.checked)}
        />
        {copy.consentToggle}
      </label>
      {failed && <p role="alert" className="text-xs font-bold text-rose-600">{copy.consentFailed}</p>}
    </section>
  );
}
