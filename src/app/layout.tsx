import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/context";
import {
  detectLanguage,
  LANGUAGE_PREFERENCE_KEY,
  parseAcceptLanguage,
} from "@/lib/i18n/language-detection";
import { translations } from "@/lib/i18n/translations";
import { AppearanceProvider } from "@/lib/appearance-context";
import { AppStoreProvider } from "@/lib/store";

const getRequestLanguage = cache(async () => {
  const [requestHeaders, requestCookies] = await Promise.all([headers(), cookies()]);
  return detectLanguage({
    savedLanguage: requestCookies.get(LANGUAGE_PREFERENCE_KEY)?.value ?? null,
    preferredLocales: parseAcceptLanguage(requestHeaders.get("accept-language")),
    countryCode: requestHeaders.get("cf-ipcountry"),
  });
});

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();
  const copy = translations[language];
  return {
    title: `${copy.appName} - ${copy.appSlogan}`,
    description: copy.appSlogan,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialLanguage = await getRequestLanguage();

  return (
    <html lang={initialLanguage} className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50/50 dark:bg-zinc-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
        <AppearanceProvider>
          <I18nProvider initialLanguage={initialLanguage}>
            <AppStoreProvider>{children}</AppStoreProvider>
          </I18nProvider>
        </AppearanceProvider>
      </body>
    </html>
  );
}
