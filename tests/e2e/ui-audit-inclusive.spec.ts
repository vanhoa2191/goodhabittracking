import { expect, test, type Locator, type Page } from '@playwright/test';
import { translations } from '../../src/lib/i18n/translations';
import { getSmallModalsCopy } from '../../src/lib/i18n/small-modals-copy';
import { pairedChild } from './ui-audit-child-fixture';

test.use({ reducedMotion: 'reduce', colorScheme: 'light' });

const locales = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'] as const;
type Locale = typeof locales[number];
const vietnameseFonts = [
  ['Phông Rõ Ràng Thân Thiện (Mặc định)', 'Rõ ràng, ấm áp và dễ đọc'],
  ['Phông Tinh Gọn Hiện Đại', 'Rõ ràng, hiện đại, tối giản'],
  ['Phông Vui Tươi Trẻ Thơ', 'Năng động, tươi vui, hoạt bát'],
  ['Phông Cổ Điển Nhã Nhặn', 'Ấm áp, mộc mạc, truyền cảm'],
];
const vietnameseSizes = ['Vừa vặn', 'Lớn hơn một tí', 'Chữ to rõ ràng'];
// Semantic categories permit translated editorial wording, while rejecting
// untranslated options (including names that omit the word “Phông”).
const semantics: Record<Locale, { fonts: RegExp[]; sizes: RegExp[] }> = {
  vi: { fonts: [/Rõ Ràng Thân Thiện/i, /Tinh Gọn Hiện Đại/i, /Vui Tươi Trẻ Thơ/i, /Cổ Điển Nhã Nhặn/i], sizes: [/Vừa vặn/i, /Lớn hơn một tí/i, /Chữ to rõ ràng/i] },
  en: { fonts: [/rounded|friendly/i, /modern/i, /playful|cheerful/i, /serif|classic/i], sizes: [/normal|regular|standard|comfortable/i, /larger|large|bigger/i, /extra.large|very.large|large.*clear|clear.*large/i] },
  fr: { fonts: [/arrondi|convivial|chaleureux/i, /moderne/i, /ludique|joyeux|enfant/i, /empattement|classique/i], sizes: [/normal|standard|confort/i, /plus grand|agrandi/i, /très grand|extra.large|grand.*lisible/i] },
  de: { fonts: [/rund|freundlich/i, /modern/i, /verspielt|fröhlich|kinder/i, /serif|klassisch/i], sizes: [/normal|standard|passend/i, /größer|gross|groß/i, /extra.*groß|sehr groß|groß.*klar|groß.*lesbar/i] },
  it: { fonts: [/arrotondat|amichevole|accogliente/i, /modern/i, /giocos|allegr|bambin/i, /grazie|classic/i], sizes: [/normal|standard|comod[oa]/i, /più grande|ingrandit/i, /molto grande|extra.*grande|grande.*chiar/i] },
  es: { fonts: [/redondead|amigable/i, /modern/i, /divertid|alegre|infantil/i, /serif|clásic/i], sizes: [/normal|estándar|cómod/i, /más grande|ampliad/i, /muy grande|extra.*grande|grande.*clar/i] },
  zh: { fonts: [/圆|友好|亲切/, /现代|简洁/, /活泼|童趣|欢快/, /衬线|经典/], sizes: [/标准|正常|适中/, /较大|稍大|放大/, /特大|超大|大字|清晰/] },
  ja: { fonts: [/丸|親しみ|やさし/, /モダン|現代|すっきり/, /遊び|楽しい|子ども|ポップ/, /セリフ|クラシック|明朝/], sizes: [/標準|通常|普通/, /大きめ|少し大き/, /特大|とても大き|大きく.*見やす|大きく.*読みやす/] },
  ko: { fonts: [/둥근|친근|친숙/, /현대|모던|간결/, /발랄|장난|어린이|즐거운/, /세리프|고전|클래식/], sizes: [/보통|기본|표준/, /조금.*크|크게|큰/, /아주.*크|매우.*크|특대|더.*크|크고.*선명/] },
};

async function enterDemo(page: Page, locale: Locale, baseURL: string | undefined) {
  expect(baseURL, 'Playwright baseURL is required').toBeTruthy();
  await page.context().addCookies([{
    name: 'kidhabit_language', value: locale, url: new URL('/', baseURL).href,
  }]);
  await page.goto('/?demo=1');
  await expect(page.getByRole('heading', { name: 'Nguyễn Minh An', exact: true })).toBeVisible();
}

async function openFontSettings(page: Page, locale: Locale) {
  const t = translations[locale];
  const desktopTrigger = page.getByTitle(t.fontSettingsTitle, { exact: true });
  if (await desktopTrigger.isVisible()) {
    await desktopTrigger.click();
  } else {
    await page.getByTestId('more-menu').click();
    await page.getByRole('button', { name: `Aa ${t.fontSizeLabel}`, exact: true }).click();
  }
  const dialog = page.getByRole('dialog', {
    name: getSmallModalsCopy(locale).fontSettingsLabel, exact: true,
  });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function appearanceOptions(dialog: Locator) {
  // Real inline font-family distinguishes options from theme/size controls;
  // accessible roles remain the primary locator, with no invented test IDs.
  const fonts = dialog.getByRole('button').and(dialog.locator('[style*="font-family"]'));
  const sizes = dialog.getByRole('button', { name: /(?:100|108|118)%/ });
  await expect(fonts).toHaveCount(4);
  await expect(sizes).toHaveCount(3);
  return { fonts, sizes };
}

async function assertPersistedAppearance(page: Page) {
  await expect.poll(() => page.evaluate(() => ({
    font: localStorage.getItem('kidhabit_font_family'),
    size: localStorage.getItem('kidhabit_font_size'),
    scale: getComputedStyle(document.documentElement).getPropertyValue('--app-font-scale').trim(),
  }))).toEqual({ font: 'serif', size: 'xlarge', scale: '1.18' });
}

test('A08 font and size UI persist stable IDs and complete VI size labels after reload', async ({ page, baseURL }) => {
  await enterDemo(page, 'vi', baseURL);
  let dialog = await openFontSettings(page, 'vi');
  await appearanceOptions(dialog);
  const serif = dialog.getByRole('button', { name: /Phông Cổ Điển Nhã Nhặn/ });
  const xlarge = dialog.getByRole('button', { name: /118%/ });
  await serif.click();
  await xlarge.click();
  await expect(serif).toHaveAttribute('aria-pressed', 'true');
  await expect(xlarge).toHaveAttribute('aria-pressed', 'true');
  await assertPersistedAppearance(page);
  await dialog.getByRole('button', { name: translations.vi.close, exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Nguyễn Minh An', exact: true })).toBeVisible();
  await assertPersistedAppearance(page);
  dialog = await openFontSettings(page, 'vi');
  await appearanceOptions(dialog);
  await expect(dialog.getByRole('button', { name: /Phông Cổ Điển Nhã Nhặn/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(dialog.getByRole('button', { name: /118%/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(dialog.getByRole('button', { name: /118%/ })).toContainText('Chữ to rõ ràng');
});

for (const locale of locales) {
  test(`A08 ${locale}: complete localized appearance choices reflow at 118%`, async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await enterDemo(page, locale, baseURL);
    const dialog = await openFontSettings(page, locale);
    const { fonts, sizes } = await appearanceOptions(dialog);
    const t = translations[locale];
    await expect(dialog.getByRole('heading', { name: t.fontSettingsTitle, exact: true })).toBeVisible();
    await expect(dialog.getByText(t.fontSizeLabel, { exact: true })).toBeVisible();
    await expect(dialog.getByText(t.fontFamilyLabel, { exact: true })).toBeVisible();
    // Counts above are hard guards. All nine locales still run on expected
    // pre06 copy reds; no empty loop or conditional click can pass silently.
    for (let i = 0; i < 4; i++) {
      const option = fonts.nth(i);
      const text = (await option.innerText()).trim();
      expect.soft(text, `${locale} font ${i}: meaningful name and preview`).toMatch(semantics[locale].fonts[i]);
      expect.soft(text.split('\n').filter(line => line.trim().length >= 2).length, `${locale} font ${i}: full name plus preview`).toBeGreaterThanOrEqual(2);
      if (locale === 'vi') {
        for (const phrase of vietnameseFonts[i]) expect.soft(text).toContain(phrase);
      } else {
        for (const phrases of vietnameseFonts) {
          for (const phrase of phrases) expect.soft(text, `${locale}: untranslated VI font copy`).not.toContain(phrase);
        }
        expect.soft(text, `${locale}: VI descriptive names even without “Phông”`).not.toMatch(/Rõ Ràng Thân Thiện|Tinh Gọn Hiện Đại|Vui Tươi Trẻ Thơ|Cổ Điển Nhã Nhặn/i);
      }
    }
    for (let i = 0; i < 3; i++) {
      const size = sizes.nth(i);
      await expect(size).toContainText(['100%', '108%', '118%'][i]);
      const label = (await size.innerText()).replace(/(?:100|108|118)%/g, '').trim();
      expect.soft(label, `${locale} size ${i}: complete descriptive label`).toMatch(semantics[locale].sizes[i]);
      if (locale === 'vi') expect.soft(label).toContain(vietnameseSizes[i]);
      else expect.soft(label, `${locale}: no truncated VI size copy`).not.toMatch(/^(Vừa|Lớn|Chữ)$|Vừa vặn|Lớn hơn một tí|Chữ to rõ ràng/);
    }
    await sizes.nth(2).click();
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement)
      .getPropertyValue('--app-font-scale').trim())).toBe('1.18');
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      { message: `${locale}: enlarged text settles without horizontal page overflow` }).toBeLessThanOrEqual(0);
    const controls = await dialog.getByRole('button').evaluateAll(buttons => buttons.map(button => {
      const rect = button.getBoundingClientRect();
      return { name: button.textContent, width: rect.width, height: rect.height };
    }));
    for (const control of controls) {
      expect(control.width, `${locale} ${control.name}: width`).toBeGreaterThanOrEqual(44);
      expect(control.height, `${locale} ${control.name}: height`).toBeGreaterThanOrEqual(44);
    }
    for (const font of await fonts.all()) {
      expect(await font.evaluate(button => [...button.querySelectorAll('div')]
        .every(node => node.scrollWidth <= node.clientWidth + 1)), `${locale}: full font names and samples fit`).toBe(true);
    }
    await dialog.getByRole('button', { name: t.close, exact: true }).click();
    await expect(dialog).toHaveCount(0);
  });
}

test('V02 timer auto-end remains visible with reduced motion, announces, focuses and restores its trigger', async ({ page }) => {
  const fixture = await pairedChild(page, { timer: true });
  const trigger = fixture.card.getByRole('button', { name: '1m Bắt đầu', exact: true });
  await expect(trigger).toBeVisible();
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: getSmallModalsCopy('vi').timerLabel, exact: true });
  await expect(dialog).toBeVisible();
  const dialogStart = dialog.getByRole('button', { name: translations.vi.timerStart, exact: true });
  await expect(dialog.getByText('01:00', { exact: true })).toBeVisible();
  await dialogStart.click();
  await expect(dialog.getByRole('button', { name: translations.vi.timerPause, exact: true })).toBeVisible();
  for (let second = 0; second < 60; second++) await page.clock.runFor(1000);
  const completion = dialog.getByText('Hoàn thành thời gian', { exact: true });
  await expect(completion).toBeVisible();
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  const completionCTA = dialog.getByRole('button', { name: `${translations.vi.tickDone} & ${translations.vi.close}`, exact: true });
  await expect(completionCTA).toBeVisible();
  // Body text includes the completion phrase, so identity/containment of the
  // active element must be checked against the actual heading or completion CTA.
  expect.soft(await dialog.evaluate((element) => {
    const active = document.activeElement;
    if (!active || active === document.body || !element.contains(active)) return false;
    const isHeading = active.matches('h1,h2,h3,h4,h5,h6,[role="heading"]')
      && active.textContent?.trim() === 'Hoàn thành thời gian';
    const isCTA = active.matches('button') && active.textContent?.trim() === 'Đã xong & Đóng';
    return Boolean(isHeading || isCTA);
  }), 'auto-end focuses the completion heading or completion CTA').toBe(true);
  await expect.soft(dialog.locator('[role="status"], [aria-live="polite"], [aria-live="assertive"]')
    .filter({ hasText: 'Hoàn thành thời gian' }), 'completion is announced by a live region').toBeVisible();
  await page.clock.runFor(1000);
  await expect(completion).toBeVisible();
  await expect(completionCTA).toBeEnabled();
  expect(fixture.commands, 'auto-end does not save the habit').toHaveLength(0);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(fixture.commands).toHaveLength(0);
});

test("V01 leaderboard empty and sibling table headings follow the section h2", async ({ page }) => {
  await page.route("**/rest/v1/rpc/get_public_leaderboard", route => route.fulfill({ json: [] }));
  await pairedChild(page);
  await page.getByRole("button", { name: new RegExp(`${translations.vi.leaderboard}|${translations.vi.bxhShort}`) }).first().click();
  const empty = page.getByTestId("leaderboard-empty");
  await expect(empty).toBeVisible();
  console.info("empty outline", await page.getByRole("heading").evaluateAll(headings => headings.map(h => ({ tag: h.tagName, text: h.textContent }))));
  await expect.soft(empty.getByRole("heading", { level: 3 })).toHaveText("Chưa có bé nào trên bảng công khai");
  await page.getByRole("button", { name: new RegExp(translations.vi.scopeFamily) }).click();
  await expect(page.getByTestId("leaderboard-row").first()).toBeVisible();
  const title = `${translations.vi.rank} & ${translations.vi.topRankings}`;
  console.info("family outline", await page.getByRole("heading").evaluateAll(headings => headings.map(h => ({ tag: h.tagName, text: h.textContent }))));
  await expect(page.getByRole("heading", { name: title, exact: true, level: 3 })).toBeVisible();
});
