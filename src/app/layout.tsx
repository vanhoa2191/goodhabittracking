import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
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
import { AnalyticsConsentProvider } from "@/lib/analytics-consent-context";

const displayFont = Fraunces({
  axes: ['SOFT', 'opsz'],
  display: 'swap',
  subsets: ['latin', 'vietnamese'],
  variable: '--font-display',
});

const uiFont = Plus_Jakarta_Sans({
  display: 'swap',
  subsets: ['latin', 'vietnamese'],
  variable: '--font-ui',
});

const monoFont = JetBrains_Mono({
  display: 'swap',
  subsets: ['latin', 'vietnamese'],
  variable: '--font-mono',
});

const appearanceScript = `(function(){try{var value=localStorage.getItem('kidhabit_theme');var dark=value==='dark'||(value==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',dark);document.documentElement.style.colorScheme=dark?'dark':'light'}catch(_){document.documentElement.classList.remove('dark')}})()`;

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
    icons: {
      icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
      apple: [{ url: '/apple-touch-icon.svg', type: 'image/svg+xml' }],
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialLanguage = await getRequestLanguage();

  return (
    <html lang={initialLanguage} className={`h-full antialiased ${displayFont.variable} ${uiFont.variable} ${monoFont.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: appearanceScript }} /></head>
      <body className="min-h-full flex flex-col bg-app-surface dark:bg-zinc-950 text-ink dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
        <AppearanceProvider>
          <I18nProvider initialLanguage={initialLanguage}>
            <AnalyticsConsentProvider>{children}</AnalyticsConsentProvider>
          </I18nProvider>
        </AppearanceProvider>
      </body>
    </html>
  );
}
