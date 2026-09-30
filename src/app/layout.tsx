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
import { ParentReminderProvider } from "@/lib/parent-reminder-context";
import { getSiteOrigin } from "@/lib/site";
import { PwaRuntime } from "@/components/PwaRuntime";
import { SessionHintSync } from "@/components/SessionHintSync";

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

const appearanceScript = `(function(){try{var value=localStorage.getItem('kidhabit_theme');var dark=value==='dark'||(value==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',dark);document.documentElement.style.colorScheme=dark?'dark':'light';var known=localStorage.getItem('kidhabit_child_paired')==='true'||sessionStorage.getItem('kidhabit_in_app')==='true';if(known)document.documentElement.dataset.knownAppSession='true'}catch(_){document.documentElement.classList.remove('dark')}})()`;

const getRequestContext = cache(async () => {
  const [requestHeaders, requestCookies] = await Promise.all([headers(), cookies()]);
  return {
    language: detectLanguage({
      savedLanguage: requestCookies.get(LANGUAGE_PREFERENCE_KEY)?.value ?? null,
      preferredLocales: parseAcceptLanguage(requestHeaders.get("accept-language")),
      countryCode: requestHeaders.get("cf-ipcountry"),
    }),
    hasKnownAppSession: requestCookies.getAll().some(({ name, value }) => name.startsWith('sb-') && name.endsWith('-auth-token') && Boolean(value)),
  };
});

export async function generateMetadata(): Promise<Metadata> {
  const { language } = await getRequestContext();
  const copy = translations[language];
  const title = `${copy.appName} - ${copy.appSlogan}`;
  return {
    metadataBase: getSiteOrigin(),
    title,
    description: copy.appSlogan,
    alternates: { canonical: '/' },
    robots: { index: false, follow: false, noarchive: true },
    manifest: '/manifest.webmanifest',
    icons: {
      icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
      apple: [{ url: '/pwa/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    openGraph: {
      type: 'website',
      title,
      description: copy.appSlogan,
      url: '/',
      siteName: copy.appName,
      locale: language === 'vi' ? 'vi_VN' : language,
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: copy.appName }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: copy.appSlogan,
      images: ['/opengraph-image'],
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { language: initialLanguage, hasKnownAppSession } = await getRequestContext();
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <html lang={initialLanguage} data-known-app-session={hasKnownAppSession ? 'true' : undefined} className={`h-full antialiased ${displayFont.variable} ${uiFont.variable} ${monoFont.variable}`} suppressHydrationWarning>
      <head>
        <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: appearanceScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-app-surface dark:bg-zinc-950 text-ink dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
        <PwaRuntime />
        <AppearanceProvider>
          <I18nProvider initialLanguage={initialLanguage}>
            <AnalyticsConsentProvider><ParentReminderProvider>{children}<SessionHintSync /></ParentReminderProvider></AnalyticsConsentProvider>
          </I18nProvider>
        </AppearanceProvider>
      </body>
    </html>
  );
}
