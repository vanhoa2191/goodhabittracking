import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/context";
import { AppearanceProvider } from "@/lib/appearance-context";
import { AppStoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "KidHabit Hero - Hành Trình Xây Dựng Thói Quen Tốt Cho Trẻ",
  description: "Web app theo dõi thói quen hàng ngày cho con với gamification, tích sao đổi quà và thống kê tiến độ.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50/50 dark:bg-zinc-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
        <AppearanceProvider>
          <I18nProvider>
            <AppStoreProvider>{children}</AppStoreProvider>
          </I18nProvider>
        </AppearanceProvider>
      </body>
    </html>
  );
}
