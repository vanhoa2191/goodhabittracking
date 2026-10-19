import { expect, test, type Locator, type Page } from '@playwright/test';
import { setupOrUnlockParent } from './pin-helper';
import { translations } from '../../src/lib/i18n/translations';
import { getChromeCopy } from '../../src/lib/i18n/chrome-copy';

test.use({ reducedMotion: 'reduce', colorScheme: 'light' });

async function enterDemo(page: Page) {
  await page.goto('/');
  await page.getByTestId('landing-primary-action').click();
  await expect(page.getByRole('heading', { name: 'Nguyễn Minh An', exact: true })).toBeVisible();
}

async function selectTheme(page: Page, choice: 'light' | 'dark' | 'system') {
  const visibleOption = page.locator(`[data-testid="theme-${choice}"]:visible`);
  if (!(await visibleOption.isVisible())) await page.getByTestId('more-menu').click();
  await visibleOption.click();
  await expect(visibleOption).toHaveAttribute('aria-pressed', 'true');
  // Close the mobile menu so it cannot cover the timer trigger or shell.
  if (await page.getByTestId('more-menu-panel').isVisible()) {
    await page.getByTestId('more-menu').click();
  }
}

async function openTimer(page: Page) {
  await page.getByRole('button', { name: /\d+m Bắt đầu/ }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Đồng hồ thói quen', exact: true });
  await expect(dialog).toBeVisible();
  return dialog;
}

// Canvas converts CSS colors (including Tailwind's oklch) to sRGB bytes.
// Paint ancestor backgrounds in order to composite translucent surfaces, then
// composite the foreground over that background before WCAG linearization.
async function colors(target: Locator) {
  return target.evaluate((element) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d', { colorSpace: 'srgb', willReadFrequently: true });
    if (!ctx) throw new Error('sRGB canvas context unavailable');
    const ancestors: Element[] = [];
    for (let node: Element | null = element; node; node = node.parentElement) ancestors.unshift(node);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 1, 1);
    for (const node of ancestors) {
      const style = getComputedStyle(node);
      // Do not silently treat gradients or group opacity as a flat CSS color.
      if (style.backgroundImage !== 'none' || Number(style.opacity) !== 1) {
        throw new Error(`Unsupported painted background/opacity on ${node.tagName}`);
      }
      ctx.fillStyle = style.backgroundColor;
      ctx.fillRect(0, 0, 1, 1);
    }
    const background = Array.from(ctx.getImageData(0, 0, 1, 1).data).slice(0, 3);
    ctx.fillStyle = getComputedStyle(element).color;
    ctx.fillRect(0, 0, 1, 1);
    const foreground = Array.from(ctx.getImageData(0, 0, 1, 1).data).slice(0, 3);
    const luminance = (rgb: number[]) => rgb.reduce((sum, channel, index) => {
      const srgb = channel / 255;
      const linear = srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
      return sum + linear * [0.2126, 0.7152, 0.0722][index];
    }, 0);
    const backgroundLuminance = luminance(background);
    const foregroundLuminance = luminance(foreground);
    return {
      background, foreground, backgroundLuminance,
      contrast: (Math.max(backgroundLuminance, foregroundLuminance) + 0.05)
        / (Math.min(backgroundLuminance, foregroundLuminance) + 0.05),
    };
  });
}

async function settledColors(target: Locator) {
  let previous = '';
  let stableSamples = 0;
  await expect.poll(async () => {
    const current = JSON.stringify(await colors(target));
    stableSamples = current === previous ? stableSamples + 1 : 0;
    previous = current;
    return stableSamples;
  }, { message: 'computed colors settle before measurement', intervals: [100], timeout: 5_000 }).toBeGreaterThanOrEqual(3);
  return colors(target);
}

test('A03 settled timer Pause text has at least 4.5:1 contrast in light and dark', async ({ page }) => {
  await enterDemo(page);
  for (const theme of ['light', 'dark'] as const) {
    await selectTheme(page, theme);
    const dialog = await openTimer(page);
    await dialog.getByRole('button', { name: 'Bắt đầu', exact: true }).click();
    const pause = dialog.getByRole('button', { name: 'Tạm dừng', exact: true });
    await expect(pause).toBeVisible();
    // Clicking leaves the pointer over the darker hover color. Measure the
    // settled resting state, where the verified contrast defect occurs.
    await page.mouse.move(0, 0);
    const measured = await settledColors(pause);
    expect.soft(measured.contrast, `${theme} Pause: ${JSON.stringify(measured)}`).toBeGreaterThanOrEqual(4.5);
    await dialog.getByRole('button', { name: 'Đóng', exact: true }).click();
  }
});

test('A05 app shell follows light, dark and system selections through the UI and reload', async ({ page }) => {
  await enterDemo(page);
  const shell = page.getByTestId('app-surface');
  const checkSurface = async (theme: 'light' | 'dark', step: string) => {
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe(theme);
    const measured = await settledColors(shell);
    if (theme === 'dark') {
      expect.soft(measured.backgroundLuminance, `${step}: dark shell ${JSON.stringify(measured)}`).toBeLessThan(0.1);
    } else {
      expect.soft(measured.backgroundLuminance, `${step}: light shell ${JSON.stringify(measured)}`).toBeGreaterThan(0.7);
    }
  };
  await selectTheme(page, 'light');
  await checkSurface('light', 'explicit light');
  await selectTheme(page, 'dark');
  await checkSurface('dark', 'explicit dark');
  await page.reload();
  await checkSurface('dark', 'persisted dark');
  await selectTheme(page, 'light');
  await checkSurface('light', 'return to light');
  await selectTheme(page, 'system');
  await page.emulateMedia({ colorScheme: 'dark' });
  await checkSurface('dark', 'system dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await checkSurface('light', 'system light');
});

test('A07 timer close and controls are at least 44 CSSpx at every font scale on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await enterDemo(page);
  for (const percentage of ['100%', '108%', '118%']) {
    await page.getByTestId('more-menu').click();
    await page.getByRole('button', { name: /^Aa / }).click();
    const settings = page.getByRole('dialog', { name: 'Cài đặt chữ', exact: true });
    const size = settings.getByRole('button', { name: new RegExp(percentage) });
    await size.click();
    await expect(size).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--app-font-scale').trim()))
      .toBe(String(Number.parseInt(percentage, 10) / 100));
    await settings.getByRole('button', { name: 'Đóng', exact: true }).click();
    const dialog = await openTimer(page);
    const checkControls = async (state: string) => {
      const controls = await dialog.getByRole('button').evaluateAll((buttons) => buttons.map((button) => {
        const box = button.getBoundingClientRect();
        return {
          name: button.getAttribute('aria-label') || button.getAttribute('title') || button.textContent?.trim(),
          width: box.width, height: box.height,
        };
      }));
      expect(controls.length, 'timer has close, reset and start/pause controls').toBeGreaterThanOrEqual(3);
      for (const control of controls) {
        expect.soft(control.width, `${percentage} ${state} ${control.name} width`).toBeGreaterThanOrEqual(44);
        expect.soft(control.height, `${percentage} ${state} ${control.name} height`).toBeGreaterThanOrEqual(44);
      }
    };
    await checkControls('ready');
    await dialog.getByRole('button', { name: 'Bắt đầu', exact: true }).click();
    await expect(dialog.getByRole('button', { name: 'Tạm dừng', exact: true })).toBeVisible();
    await page.mouse.move(0, 0);
    await checkControls('running');
    await dialog.getByRole('button', { name: 'Đóng', exact: true }).click();
  }
});


type ControlMeasure = { name: string; tag: string; width: number; height: number };

async function measureVisible(page: Page, containerSel: string): Promise<ControlMeasure[]> {
  return page.evaluate((sel: string) => {
    const container = document.querySelector(sel);
    const controls: ControlMeasure[] = [];
    if (container) {
      container.querySelectorAll('button, a').forEach((el) => {
        const r = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        if (r.width > 0 && r.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && parseFloat(style.opacity) > 0) {
          const name = el.getAttribute('aria-label') || el.getAttribute('title') || (el.textContent || '').trim().slice(0, 30) || el.tagName;
          controls.push({ name, tag: el.tagName, width: r.width, height: r.height });
        }
      });
    }
    return controls;
  }, containerSel);
}

const HEADER_VIEWPORTS = [
  { name: 'mobile375', w: 375, h: 812 },
  { name: 'tablet768', w: 768, h: 1024 },
  { name: 'desktop1280', w: 1280, h: 900 },
  { name: 'desktop1536', w: 1536, h: 900 },
];
const FONT_SCALES = ['100%', '108%', '118%'] as const;
const SCALE_KEYS: Record<typeof FONT_SCALES[number], string> = { '100%': 'normal', '108%': 'large', '118%': 'xlarge' };

// Sets localStorage before navigation on a fresh page. Each test gets its own
// page (Playwright default isolation), so addInitScript is called exactly once —
// no accumulation of competing callbacks across iterations.
async function setFontScaleViaLocal(page: Page, percentage: '100%' | '108%' | '118%') {
  await page.addInitScript((size: string) => {
    localStorage.setItem('kidhabit_font_size', size);
    localStorage.setItem('kidhabit_font_family', 'rounded');
    localStorage.setItem('kidhabit_theme', 'light');
  }, SCALE_KEYS[percentage]);
}

// Polls for --app-font-scale to reach the expected value after the
// AppearanceProvider useEffect runs, then waits for fonts to finish loading
// so layout is stable before measurement.
async function assertFontScale(page: Page, percentage: '100%' | '108%' | '118%') {
  const expected = String(Number.parseInt(percentage, 10) / 100);
  await expect.poll(
    async () => await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--app-font-scale').trim()),
    { message: `--app-font-scale should be ${expected} for ${percentage}`, timeout: 10_000 },
  ).toBe(expected);
  await page.evaluate(() => document.fonts.ready);
}

// Waits for fonts to settle and no running CSS animations/transitions on the
// header, ensuring getBoundingClientRect returns final layout values.
async function waitForLayoutSettle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(async () => {
    return await page.evaluate(() => {
      const header = document.querySelector('header');
      if (!header) return -1;
      return Array.from(header.getAnimations()).filter((a) => a.playState === 'running').length;
    });
  }, { message: 'header animations settle', timeout: 5_000 }).toBe(0);
}

// Common setup for header tests: fresh page, viewport, localStorage, nav, scale assert.
async function setupHeaderPage(page: Page, baseURL: string | undefined, vp: { w: number; h: number }, percentage: typeof FONT_SCALES[number]) {
  expect(baseURL, 'Playwright baseURL is required').toBeTruthy();
  await page.setViewportSize({ width: vp.w, height: vp.h });
  await setFontScaleViaLocal(page, percentage);
  await page.goto(`${baseURL}/?demo=1`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Nguyễn Minh An', exact: true })).toBeVisible({ timeout: 15_000 });
  await assertFontScale(page, percentage);
  await waitForLayoutSettle(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth),
    `header at ${vp.w}px and ${percentage} must not expand the page`).toBeLessThanOrEqual(vp.w);
}

test.describe('A07 header touch targets (kid mode)', () => {
  test.setTimeout(30_000);
  for (const vp of HEADER_VIEWPORTS) {
    for (const percentage of FONT_SCALES) {
      test(`kid ${vp.name} @ ${percentage} — all header controls >= 44 CSSpx (raw fractional)`, async ({ page, baseURL }) => {
        await setupHeaderPage(page, baseURL, vp, percentage);

        const moreBtn = page.locator('[data-testid="more-menu"]');
        const isMobile = vp.w < 1280;
        if (isMobile && await moreBtn.isVisible()) {
          await moreBtn.click();
          await expect(page.locator('[data-testid="more-menu-panel"]')).toBeVisible();
          await waitForLayoutSettle(page);
        }

        const headerControls = await measureVisible(page, 'header');
        expect(headerControls.length, `kid ${vp.name} @ ${percentage}: visible header controls`).toBeGreaterThanOrEqual(2);
        for (const c of headerControls) {
          expect.soft(c.width, `kid ${vp.name} @ ${percentage} "${c.name}" (${c.tag}) width ${c.width}`).toBeGreaterThanOrEqual(44);
          expect.soft(c.height, `kid ${vp.name} @ ${percentage} "${c.name}" (${c.tag}) height ${c.height}`).toBeGreaterThanOrEqual(44);
        }

        if (isMobile && await page.locator('[data-testid="more-menu-panel"]').isVisible()) {
          const menuControls = await measureVisible(page, '[data-testid="more-menu-panel"]');
          expect(menuControls.length, `kid ${vp.name} @ ${percentage}: visible menu controls`).toBeGreaterThanOrEqual(1);
          for (const c of menuControls) {
            expect.soft(c.width, `menu ${vp.name} @ ${percentage} "${c.name}" (${c.tag}) width ${c.width}`).toBeGreaterThanOrEqual(44);
            expect.soft(c.height, `menu ${vp.name} @ ${percentage} "${c.name}" (${c.tag}) height ${c.height}`).toBeGreaterThanOrEqual(44);
          }
          await moreBtn.click();
          await expect(page.locator('[data-testid="more-menu-panel"]')).toHaveCount(0);
        }
      });
    }
  }
});

test.describe('A07 header touch targets (parent mode)', () => {
  test.setTimeout(90_000);
  for (const vp of HEADER_VIEWPORTS) {
    for (const percentage of FONT_SCALES) {
      test(`parent ${vp.name} @ ${percentage} — all header controls >= 44 CSSpx after PIN`, async ({ page, baseURL }) => {
        await setupHeaderPage(page, baseURL, vp, percentage);
        const t = translations['vi'];

        // Enter parent mode via PIN — wait for button and dialog explicitly
        await expect(page.getByRole('button', { name: t.parentMode, exact: true })).toBeVisible({ timeout: 10_000 });
        await page.getByRole('button', { name: t.parentMode, exact: true }).click();
        await expect(page.getByRole('dialog', { name: /PIN/i })).toBeVisible({ timeout: 10_000 });
        await setupOrUnlockParent(page);

        // Hard-assert parent mode actually switched (no caught timeout, no conditional fake pass)
        await expect(page.locator('header[data-app-shell="parent"]')).toBeVisible({ timeout: 10_000 });
        await expect(page.locator('header[data-app-shell="parent"]')).toHaveCount(1);
        // Verify a parent-only control is visible (proves parent mode, not kid)
        const chromeCopy = getChromeCopy('vi');
        await expect(page.locator(`header a[aria-label="${chromeCopy.home}"]`)).toBeVisible({ timeout: 5_000 });
        await waitForLayoutSettle(page);
        expect(await page.evaluate(() => document.documentElement.scrollWidth),
          `parent header at ${vp.w}px and ${percentage} must not expand the page`).toBeLessThanOrEqual(vp.w);

        const moreBtn = page.locator('[data-testid="more-menu"]');
        const isMobile = vp.w < 1536;
        if (isMobile && await moreBtn.isVisible()) {
          await moreBtn.click();
          await expect(page.locator('[data-testid="more-menu-panel"]')).toBeVisible();
          await waitForLayoutSettle(page);
        }

        const headerControls = await measureVisible(page, 'header');
        expect(headerControls.length, `parent ${vp.name} @ ${percentage}: visible header controls`).toBeGreaterThanOrEqual(3);
        for (const c of headerControls) {
          expect.soft(c.width, `parent ${vp.name} @ ${percentage} "${c.name}" (${c.tag}) width ${c.width}`).toBeGreaterThanOrEqual(44);
          expect.soft(c.height, `parent ${vp.name} @ ${percentage} "${c.name}" (${c.tag}) height ${c.height}`).toBeGreaterThanOrEqual(44);
        }

        if (await page.locator('[data-testid="more-menu-panel"]').isVisible()) {
          const menuControls = await measureVisible(page, '[data-testid="more-menu-panel"]');
          expect(menuControls.length, `parent ${vp.name} @ ${percentage}: visible menu controls`).toBeGreaterThanOrEqual(1);
          for (const c of menuControls) {
            expect.soft(c.width, `menu ${vp.name} @ ${percentage} "${c.name}" (${c.tag}) width ${c.width}`).toBeGreaterThanOrEqual(44);
            expect.soft(c.height, `menu ${vp.name} @ ${percentage} "${c.name}" (${c.tag}) height ${c.height}`).toBeGreaterThanOrEqual(44);
          }
          await moreBtn.click();
          await expect(page.locator('[data-testid="more-menu-panel"]')).toHaveCount(0);
        }
      });
    }
  }
});

test.describe('A07 compact ThemeSelector buttons and selection persistence', () => {
  test.setTimeout(30_000);
  for (const percentage of FONT_SCALES) {
    test(`compact @ 1536px ${percentage} — buttons >= 44 CSSpx + theme persists via reload`, async ({ page, baseURL }) => {
      const vp = { w: 1536, h: 900 };
      await setupHeaderPage(page, baseURL, vp, percentage);

      // Compact ThemeSelector is in the header at 2xl (1536px)
      const themeButtons = page.locator('[data-testid^="theme-"]');
      const themeCount = await themeButtons.count();
      expect(themeCount, `compact theme buttons at 1536px @ ${percentage}`).toBe(3);
      const measures = await themeButtons.evaluateAll((btns) => btns.map((b) => {
        const r = b.getBoundingClientRect();
        return { name: b.getAttribute('data-testid') || '', width: r.width, height: r.height };
      }));
      for (const m of measures) {
        expect.soft(m.width, `compact theme @ ${percentage} ${m.name} width ${m.width}`).toBeGreaterThanOrEqual(44);
        expect.soft(m.height, `compact theme @ ${percentage} ${m.name} height ${m.height}`).toBeGreaterThanOrEqual(44);
      }

      // Select dark theme, verify aria-pressed and localStorage persist
      const darkBtn = page.locator('[data-testid="theme-dark"]');
      await darkBtn.click();
      await expect(darkBtn).toHaveAttribute('aria-pressed', 'true');
      expect(await page.evaluate(() => localStorage.getItem('kidhabit_theme'))).toBe('dark');

      // Switch back to light
      const lightBtn = page.locator('[data-testid="theme-light"]');
      await lightBtn.click();
      await expect(lightBtn).toHaveAttribute('aria-pressed', 'true');
      expect(await page.evaluate(() => localStorage.getItem('kidhabit_theme'))).toBe('light');

      // Reload and verify persistence
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Nguyễn Minh An', exact: true })).toBeVisible();
      await assertFontScale(page, percentage);
      await expect(page.locator('[data-testid="theme-light"]')).toHaveAttribute('aria-pressed', 'true');
    });
  }
});

test('A07 more-menu opens and closes with the same keyboard keys, focus traps and restores', async ({ page, baseURL }) => {
  expect(baseURL, 'Playwright baseURL is required').toBeTruthy();
  await page.setViewportSize({ width: 375, height: 812 });
  await setFontScaleViaLocal(page, '100%');
  await page.goto(`${baseURL}/?demo=1`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Nguyễn Minh An', exact: true })).toBeVisible();
  await assertFontScale(page, '100%');
  await waitForLayoutSettle(page);

  const moreBtn = page.getByTestId('more-menu');
  await expect(moreBtn).toHaveAttribute('aria-expanded', 'false');
  await moreBtn.focus();
  await page.keyboard.press('Enter');
  await expect(moreBtn).toHaveAttribute('aria-expanded', 'true');
  const menu = page.getByTestId('more-menu-panel');
  await expect(menu).toBeVisible();

  // Focus should be inside the menu
  const hasFocus = await page.evaluate(() => {
    const m = document.querySelector('[data-testid="more-menu-panel"]');
    return !!m && m.contains(document.activeElement);
  });
  expect(hasFocus, 'focus stays inside the menu after Enter').toBe(true);

  // Escape closes and restores focus to the more-menu button
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(moreBtn).toBeFocused();
  await expect(moreBtn).toHaveAttribute('aria-expanded', 'false');

  // The same Enter key reopens
  await page.keyboard.press('Enter');
  await expect(moreBtn).toHaveAttribute('aria-expanded', 'true');
  await expect(menu).toBeVisible();

  // Verify theme selection persists inside the menu after close/reopen
  const menuTheme = menu.locator('[data-testid="theme-light"]');
  await expect(menuTheme).toBeVisible({ timeout: 5000 });
  await menuTheme.click();
  await expect(menuTheme).toHaveAttribute('aria-pressed', 'true');
  // Close menu
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  // Reopen — selection persists
  await page.keyboard.press('Enter');
  await expect(menu).toBeVisible();
  await expect(menu.locator('[data-testid="theme-light"]')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
});

// --- A07 header overflow: bounded 06a1 regression for profile shrink boundary ---

const HEADER_OVERFLOW_LOCALES = ['vi', 'it'] as const;

async function setupHeaderPageWithLocale(
  page: Page,
  baseURL: string | undefined,
  vp: { w: number; h: number },
  percentage: typeof FONT_SCALES[number],
  locale: typeof HEADER_OVERFLOW_LOCALES[number],
) {
  expect(baseURL, 'Playwright baseURL is required').toBeTruthy();
  await page.setViewportSize({ width: vp.w, height: vp.h });
  await page.context().addCookies([{
    name: 'kidhabit_language',
    value: locale,
    url: new URL('/', baseURL as string).href,
  }]);
  await setFontScaleViaLocal(page, percentage);
  await page.goto(`${baseURL}/?demo=1`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Nguyễn Minh An', exact: true })).toBeVisible({ timeout: 15_000 });
  await assertFontScale(page, percentage);
  await waitForLayoutSettle(page);
}

test.describe('A07 header no-horizontal-overflow at 375px', () => {
  test.setTimeout(30_000);
  for (const locale of HEADER_OVERFLOW_LOCALES) {
    for (const percentage of FONT_SCALES) {
      test(`${locale} @ ${percentage} — header fits 375px without overflow; all controls >= 44px`, async ({ page, baseURL }) => {
        await setupHeaderPageWithLocale(page, baseURL, { w: 375, h: 812 }, percentage, locale);

        // Document-level: no horizontal page overflow (raw fractional, not rounded)
        await expect.poll(
          () => page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
          { message: `${locale} @ ${percentage}: no horizontal document overflow`, timeout: 5_000 },
        ).toBeLessThanOrEqual(0);

        // All visible header controls >= 44 CSSpx raw fractional (measureVisible now
        // includes offscreen controls so clipping is asserted, not silently discarded)
        const headerControls = await measureVisible(page, 'header');
        expect(headerControls.length, `${locale} @ ${percentage}: visible header controls`).toBeGreaterThanOrEqual(2);
        for (const c of headerControls) {
          expect.soft(c.width, `${locale} @ ${percentage} "${c.name}" (${c.tag}) width ${c.width}`).toBeGreaterThanOrEqual(44);
          expect.soft(c.height, `${locale} @ ${percentage} "${c.name}" (${c.tag}) height ${c.height}`).toBeGreaterThanOrEqual(44);
        }

        // More-menu trigger must stay within the right edge of the 375px viewport
        const moreRect = await page.locator('[data-testid="more-menu"]').boundingBox();
        if (moreRect) {
          expect.soft(moreRect.x + moreRect.width, `${locale} @ ${percentage}: more-menu within viewport`).toBeLessThanOrEqual(375);
        }
      });
    }
  }
});
