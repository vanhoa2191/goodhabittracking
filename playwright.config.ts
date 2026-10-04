import { defineConfig, devices } from '@playwright/test';

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseUrl ?? 'http://127.0.0.1:3000';
const localBrowserChannel = process.env.PLAYWRIGHT_USE_SYSTEM_CHROME ? 'chrome' : undefined;
const e2eSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://e2e-test.supabase.co';
const e2eSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'e2e-anon-key';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'list',
  // Shared CI runners are slower than a laptop; keep local feedback fast but give polls room in CI.
  expect: { timeout: process.env.CI ? 15_000 : 5_000 },
  use: {
    baseURL,
    locale: 'vi-VN',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: 'npm run dev -- --webpack --hostname 127.0.0.1',
        env: {
          NEXT_PUBLIC_SUPABASE_URL: e2eSupabaseUrl,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: e2eSupabaseAnonKey,
          NEXT_PUBLIC_DAILY_MASCOT_LETTER: 'true',
          NEXT_PUBLIC_DAILY_JOURNAL: 'true',
          NEXT_PUBLIC_PARENT_REENGAGEMENT: 'true',
          NEXT_PUBLIC_HABIT_PROGRAMS: 'true',
          NEXT_PUBLIC_DAILY_EASE: 'true',
          NEXT_PUBLIC_INDEPENDENCE: 'true',
          NEXT_PUBLIC_HABIT_COACH: 'true',
          KIDHABIT_E2E_ADMIN_BYPASS: 'true',
          NEXT_PUBLIC_ENABLE_PWA_DEV: 'true',
          NEXT_PUBLIC_APP_URL: baseURL,
          NEXT_PUBLIC_MARKETING_URL: 'https://www.example.test',
          NEXT_PUBLIC_DEPLOY_TARGET: 'app',
        },
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: localBrowserChannel },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'], channel: localBrowserChannel },
    },
  ],
});
