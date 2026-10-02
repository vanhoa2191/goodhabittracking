'use client';

import { useTranslation } from '@/lib/i18n/context';
import { getAuthNoticeCopy } from '@/lib/i18n/auth-notice-copy';

/** Says why Google sign-in could not be opened, in the page, in the person's language, and can be dismissed. */
export function SignInErrorNotice({ message, onDismiss }: { readonly message: string | null; readonly onDismiss: () => void }) {
  const { language } = useTranslation();
  const copy = getAuthNoticeCopy(language);
  if (!message) return null;
  return (
    <div role="alert" className="mx-auto mt-4 flex max-w-3xl items-start justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
      <span>{copy.googleSignInFailed(message)}</span>
      <button type="button" onClick={onDismiss} className="min-h-11 shrink-0 rounded-lg px-3 font-bold underline">{copy.dismiss}</button>
    </div>
  );
}
