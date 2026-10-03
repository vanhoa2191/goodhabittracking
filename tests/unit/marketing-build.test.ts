import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { selectPublishableTestimonials } from '../../apps/marketing/render-site.mjs';
import { sessionHintCookie } from '../../apps/marketing/session-hint.mjs';
import { buildMarketingSite } from '../../scripts/build-marketing.mjs';

const outputs: string[] = [];

afterEach(async () => {
  await Promise.all(outputs.splice(0).map((output) => rm(output, { recursive: true, force: true })));
});

async function buildFixture() {
  const outputDir = await makeOutput('kidhabit-marketing-');
  await buildMarketingSite({
    appOrigin: 'https://app.example',
    marketingOrigin: 'https://www.example',
    outputDir,
  });
  return {
    outputDir,
    html: await readFile(join(outputDir, 'index.html'), 'utf8'),
  };
}

async function makeOutput(prefix: string) {
  const outputDir = await mkdtemp(join(tmpdir(), prefix));
  outputs.push(outputDir);
  return outputDir;
}

describe('marketing static artifact', () => {
  it('renders descriptive selling points without outcome promises or the removed internal-navigation phrase', async () => {
    const { html } = await buildFixture();
    expect(html).toContain('Biết nên rèn gì cho con');
    expect(html).toContain('Giao việc rõ, con dễ làm');
    expect(html).toContain('Xem lại những việc con đã làm');
    expect(html).not.toContain('Thấy tiến bộ mỗi ngày');
    expect(html).not.toContain('bớt cần ba mẹ nhắc');
    expect(html).not.toContain('Xem đúng phần bạn cần, không phải đọc một trang thật dài');
  });

  it('renders the three paid plans with exact checkout links and no removed sales card', async () => {
    const { html } = await buildFixture();
    expect(html).toContain('29.000');
    expect(html).toContain('49.000');
    expect(html).toContain('399.000');
    for (const plan of ['solo_monthly', 'monthly', 'yearly']) {
      expect(html).toContain(`https://app.example/checkout?plan=${plan}`);
    }
    expect(html).not.toMatch(/data-plan=["']trial["']/);
    expect(html).not.toMatch(/data-plan=["']lifetime["']/);
  });

  it('owns public discovery metadata and excludes app-only capabilities', async () => {
    const { outputDir, html } = await buildFixture();
    expect(html).toContain('<link rel="canonical" href="https://www.example/">');
    expect(html).toContain('<meta property="og:url" content="https://www.example/">');
    expect(await readFile(join(outputDir, 'robots.txt'), 'utf8')).toContain('Sitemap: https://www.example/sitemap.xml');
    expect(await readFile(join(outputDir, 'sitemap.xml'), 'utf8')).toContain('<loc>https://www.example/pricing/</loc>');
    expect(html).not.toContain('/api/');
    expect(html).not.toMatch(/supabase/i);
    expect(html).not.toContain('serviceWorker');
    expect(html).not.toContain('manifest.webmanifest');
  });

  it.each(['framework', 'science', 'roadmaps', 'docs'])('ends /%s with a call to action that leads to the plans and the trial', async (route) => {
    const { outputDir } = await buildFixture();
    const html = await readFile(join(outputDir, route, 'index.html'), 'utf8');
    const cta = html.match(/<aside class="post-cta article-cta"[\s\S]*?<\/aside>/)?.[0] ?? '';
    expect(cta).toContain('<a class="button" href="/pricing/">Chọn gói và mua');
    expect(cta).toMatch(/href="https:\/\/app\.example\/start">Hoặc dùng thử 7 ngày/);
    // It closes the article: nothing but the footer follows it.
    expect(html.slice(html.indexOf(cta) + cta.length)).not.toContain('<article');
  });

  it.each(['privacy', 'terms', 'gioi-thieu', 'contact', 'pricing'])('does not put the buying call to action on /%s', async (route) => {
    const { outputDir } = await buildFixture();
    const html = await readFile(join(outputDir, route, 'index.html'), 'utf8');
    expect(html).not.toContain('article-cta');
  });

  it('ends every blog post with the same call to action', async () => {
    const { outputDir } = await buildFixture();
    const html = await readFile(join(outputDir, 'blog', 'bat-dau-voi-it-thoi-quen', 'index.html'), 'utf8');
    expect(html).toContain('article-cta');
    expect(html).toContain('<a class="button" href="/pricing/">Chọn gói và mua');
  });

  it('describes the framework by stage with a few examples, using the real counts', async () => {
    const { outputDir } = await buildFixture();
    const html = await readFile(join(outputDir, 'framework', 'index.html'), 'utf8');
    expect(html).toContain('47 thói quen');
    expect(html).toContain('5 giai đoạn');
    for (const age of ['0-3', '3-6', '6-12', '12-15', '15-18']) expect(html).toContain(`${age} tuổi`);
    expect(html).toContain('Vai trò của ba mẹ');
    expect(html).toContain('Khi con gọi, có người trả lời.');
    expect(html.match(/class="fw-habit"/g)?.length).toBe(15);
    // The measurable thresholds of the framework are not published as claims.
    expect(html).not.toMatch(/≥\s*\d+\s*%/);
    expect(html).toContain('không phải chuẩn phát triển');
    const questions = [...html.matchAll(/<summary>/g)].length;
    expect(questions).toBe(4);
    expect(html).toContain('"@type":"FAQPage"');
  });

  it.each(['', 'pricing', 'framework', 'science', 'roadmaps', 'docs', 'privacy', 'terms', 'gioi-thieu', 'contact'])(
    'gives /%s a descriptive snippet, a breadcrumb trail and no numeric portrait claim',
    async (route) => {
      const { outputDir } = await buildFixture();
      const html = await readFile(join(outputDir, route, 'index.html'), 'utf8');
      const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
      expect(description.length).toBeGreaterThanOrEqual(110);
      expect(description.length).toBeLessThanOrEqual(175);
      expect(html).not.toContain('16 chân dung');
      const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]!));
      const types = blocks.flatMap((block) => (block['@graph'] ?? [block]).map((node: { '@type': string }) => node['@type']));
      if (route === '') expect(types).toContain('SoftwareApplication');
      else expect(types).toEqual(expect.arrayContaining(['WebPage', 'BreadcrumbList']));
      if (route === 'pricing') expect(types).toContain('FAQPage');
    },
  );

  it('describes the public board as opt-in with nicknames only', async () => {
    const { outputDir } = await buildFixture();
    const privacy = await readFile(join(outputDir, 'privacy', 'index.html'), 'utf8');
    const home = await readFile(join(outputDir, 'index.html'), 'utf8');
    expect(privacy).toContain('không bao giờ được hiển thị');
    expect(home).toContain('Chia sẻ công khai mặc định tắt');
    expect(home).not.toContain('Bảng xếp hạng mặc định tắt');
  });

  it('publishes the referral programme with its real numbers and rules', async () => {
    const { outputDir } = await buildFixture();
    const page = await readFile(join(outputDir, 'gioi-thieu', 'index.html'), 'utf8');
    const text = page.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    for (const fact of ['30%', '12 tháng đầu', '35 ngày', '200.000 đồng', 'kidhabit_ref', '60 ngày', 'thuế thu nhập cá nhân']) {
      expect(text).toContain(fact);
    }
    expect(text).toContain('không cam kết mức thu nhập nào');
    expect(page).toContain('href="/gioi-thieu/"');
    expect(await readFile(join(outputDir, 'sitemap.xml'), 'utf8')).toContain('/gioi-thieu/');
  });

  it('links the programme from the footer of every page and mentions its cookie in the privacy policy', async () => {
    const { outputDir, html } = await buildFixture();
    expect(html).toContain('<a href="/gioi-thieu/">Giới thiệu bạn bè</a>');
    const privacy = await readFile(join(outputDir, 'privacy', 'index.html'), 'utf8');
    expect(privacy).toContain('kidhabit_ref');
  });

  it('keeps a well-formed referral code in a cookie for 60 days and ignores anything else', async () => {
    const { outputDir } = await buildFixture();
    const script = await readFile(join(outputDir, 'client.js'), 'utf8');
    expect(script).toContain('[A-HJ-NP-Z2-9]{8}');
    expect(script).toContain('kidhabit_ref=');
    expect(script).toContain('60 * 24 * 60 * 60');
    expect(script).toContain("Domain=kidhabithero.com");
  });

  it('ships security headers that allow only the page\'s own inline script by hash', async () => {
    const { outputDir, html } = await buildFixture();
    const headers = await readFile(join(outputDir, '_headers'), 'utf8');
    for (const name of ['Strict-Transport-Security', 'X-Content-Type-Options: nosniff', 'X-Frame-Options: DENY', 'Referrer-Policy', 'Permissions-Policy']) {
      expect(headers).toContain(name);
    }
    expect(headers).toContain("frame-ancestors 'none'");
    expect(headers).not.toMatch(/script-src[^;]*unsafe-inline/);
    const inline = html.match(/<script>([\s\S]*?)<\/script>/);
    expect(inline).not.toBeNull();
    const hash = createHash('sha256').update(inline![1]).digest('base64');
    expect(headers).toContain(`'sha256-${hash}'`);
  });

  it('builds every public information route as a self-contained static page', async () => {
    const { outputDir } = await buildFixture();
    for (const route of ['pricing', 'framework', 'science', 'roadmaps', 'docs', 'privacy', 'terms', 'gioi-thieu', 'contact']) {
      const html = await readFile(join(outputDir, route, 'index.html'), 'utf8');
      expect(html).toContain(`<link rel="canonical" href="https://www.example/${route}/">`);
      expect(html).toContain('<main');
      expect(html).not.toContain('/api/');
      expect(html).not.toMatch(/supabase/i);
    }
  });

  it('provides semantic landmarks, viewport metadata and keyboard-focusable calls to action', async () => {
    const { html } = await buildFixture();
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">');
    expect(html).toMatch(/<header[ >]/);
    expect(html).toMatch(/<nav[ >]/);
    expect(html).toMatch(/<main[ >]/);
    expect(html).toMatch(/<footer[ >]/);
    expect(html).toContain('class="button');
    expect(html).toContain('href="https://app.example/checkout?plan=monthly"');
    expect(html).toContain('href="https://app.example/" class="nav-login"');
    expect(html).not.toContain('https://app.example/login');
  });

  it('orders the sales story from promise to proof to price to action', async () => {
    const { html } = await buildFixture();
    const order = ['class="hero"', 'class="section shift"', 'id="cach-hoat-dong"', 'id="chan-dung"', 'class="section companions"', 'class="section safety"', 'id="bang-gia"', 'class="section faq-section"', 'class="final-cta"'];
    const positions = order.map((marker) => html.indexOf(marker));
    expect(positions.every((position) => position > -1)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('shows real product screens with sample-data disclosure, sized and lazily loaded below the fold', async () => {
    const { outputDir, html } = await buildFixture();
    expect(html).toMatch(/<img class="phone-screen" src="\/screens\/kid-home\.webp"[^>]*width="600" height="1298"[^>]*fetchpriority="high"/);
    for (const screen of ['kid-tasks', 'kid-home', 'parent-approvals', 'parent-roadmap']) {
      expect((await stat(join(outputDir, 'screens', `${screen}.webp`))).size).toBeGreaterThan(5000);
      expect(html).toContain(`src="/screens/${screen}.webp"`);
    }
    const stepImages = html.match(/<img src="\/screens\/[^"]+"[^>]*>/g) ?? [];
    expect(stepImages).toHaveLength(3);
    // Every screen is used once: the hero's child screen is not repeated in the steps.
    expect(html.match(/src="\/screens\/kid-home\.webp"/g)).toHaveLength(1);
    for (const image of stepImages) {
      expect(image).toMatch(/alt="[^"]{20,}"/);
      expect(image).toContain('loading="lazy"');
    }
    expect(html.match(/Ảnh chụp từ bản demo, dữ liệu mẫu\./g)).toHaveLength(3);
  });

  it('sends the trial button to login-and-activate, and only plan buttons to checkout', async () => {
    const { html } = await buildFixture();
    const hero = html.slice(html.indexOf('class="hero-actions"'), html.indexOf('class="trust-points"'));
    expect(hero).toContain('href="https://app.example/start"');
    expect(hero).toContain('href="https://app.example/?demo=1"');
    expect(hero).not.toContain('checkout');
    expect(html).toMatch(/<a href="https:\/\/app\.example\/start" class="button button-small" data-guest>Dùng thử 7 ngày<\/a>/);
    expect(html).toMatch(/<div class="sticky-cta" data-sticky-cta data-guest hidden>[\s\S]*href="https:\/\/app\.example\/start"/);
    const finalCta = html.slice(html.indexOf('class="final-cta"'));
    expect(finalCta).toContain('https://app.example/start');
    expect(finalCta).toContain('https://app.example/?demo=1');
    const trialLinks = html.match(/href="https:\/\/app\.example\/checkout\?plan=[a-z_]+"/g) ?? [];
    expect(new Set(trialLinks).size).toBe(3);
  });

  it('shows no early-families invitation and no mailto link on the home page, and publishes only consented quotes', async () => {
    const outputDir = await makeOutput('kidhabit-marketing-early-');
    await buildMarketingSite({ appOrigin: 'https://app.example', marketingOrigin: 'https://www.example', outputDir, supportEmail: 'support@example.com' });
    const html = await readFile(join(outputDir, 'index.html'), 'utf8');
    expect(html).not.toContain('Cùng xây KidHabit với những gia đình đầu tiên');
    expect(html).not.toContain('Chương trình gia đình đầu tiên');
    expect(html).not.toContain('mailto:');
    expect(html).not.toContain('class="quote-card"');
    expect(html).not.toContain('Gia đình nói gì');

    const now = new Date('2026-10-01T00:00:00Z');
    const complete = { quote: 'Con tự dọn cặp mỗi tối.', name: 'Chị Lan', role: 'Mẹ của bé 7 tuổi', consent: true, source: 'Phỏng vấn 2026-09-30', reviewBy: '2027-01-01' };
    expect(selectPublishableTestimonials([complete], now)).toHaveLength(1);
    for (const broken of [
      { ...complete, consent: false },
      { ...complete, source: '' },
      { ...complete, reviewBy: '2026-09-01' },
      { ...complete, name: ' ' },
      { ...complete, quote: '' },
    ]) {
      expect(selectPublishableTestimonials([broken], now)).toHaveLength(0);
    }
  });

  it('leads with the parents’ tiredness and names the audience, keeping the portrait idea as depth lower down', async () => {
    const { html } = await buildFixture();
    expect(html).toContain('<title>KidHabit Hero | Bớt nhắc, để con tự làm việc nhỏ mỗi ngày</title>');
    expect(html).toMatch(/<h1>Bớt nhắc, để con tự làm việc nhỏ mỗi ngày<\/h1>/);
    expect(html).toContain('Ứng dụng thói quen cho bé 4–12 tuổi');
    expect(html).not.toContain('Từng thói quen nhỏ vẽ nên chân dung tốt đẹp của con</h1>');
    expect(html).toContain('property="og:image:alt" content="Bớt nhắc, để con tự làm việc nhỏ mỗi ngày');
    expect(html.indexOf('Mỗi thói quen là một nét vẽ nên chân dung của con')).toBeGreaterThan(html.indexOf('id="cach-hoat-dong"'));
    expect(html).not.toMatch(/\b(số 1|top 1|#1)\b/i);
  });

  it('highlights the yearly plan, says what follows the trial and keeps the plan features current', async () => {
    const { html } = await buildFixture();
    expect(html).toMatch(/price-card price-card-featured" data-plan="yearly"/);
    expect(html).not.toMatch(/price-card price-card-featured" data-plan="monthly"/);
    expect(html).toContain('Hết 7 ngày dùng thử, ba mẹ chọn một gói để tiếp tục ghi nhận việc của con.');
    expect(html).toContain('Lộ trình theo độ tuổi');
    expect(html).not.toContain('Lộ trình tuần và tháng');
  });

  it('describes the age-tuned child screen as a feature with its limits, without promising results', async () => {
    const { html } = await buildFixture();
    expect(html).toContain('Giao diện của bé có đổi theo tuổi không?');
    expect(html).toContain('3–8, 9–12 và từ 13 tuổi');
    expect(html).toContain('Bé dưới 3 tuổi, hoặc chưa có năm sinh, vẫn dùng giao diện mặc định.');
    expect(html).not.toMatch(/tăng động lực|đảm bảo|cam kết hiệu quả/i);
    const ledger = await readFile('docs/claims-ledger.md', 'utf8');
    expect(ledger).toContain('Giao diện của bé tự đổi theo tuổi');
  });

  it('answers the age, the trial and the replace-the-parent questions and does not say "đủ điều kiện"', async () => {
    const { html } = await buildFixture();
    for (const question of ['Con bao nhiêu tuổi thì phù hợp?', 'Hết 7 ngày dùng thử thì sao?', 'KidHabit có thay thế việc ba mẹ dạy con không?']) expect(html).toContain(question);
    expect(html).not.toContain('đủ điều kiện');
  });

  it('says the trial promise a few times, not on every screen', async () => {
    const { html } = await buildFixture();
    const text = html.slice(html.indexOf('<body')).replace(/<[^>]+>/g, ' ');
    expect((text.match(/không cần thẻ/gi) ?? []).length).toBeLessThanOrEqual(6);
    expect((text.match(/hoàn tiền/gi) ?? []).length).toBeLessThanOrEqual(6);
  });

  it('scrolls to a section from the top navigation when the home page has it, and links to the page otherwise', async () => {
    const { outputDir, html } = await buildFixture();
    const nav = (page: string) => page.match(/<nav id="primary-navigation"[\s\S]*?<\/nav>/)?.[0] ?? '';
    const home = nav(html);
    expect(home).toContain('<a href="#chan-dung">Khung thói quen</a>');
    expect(home).toContain('<a href="#bang-gia">Bảng giá</a>');
    // No section for these on the home page: they open their own pages.
    for (const href of ['/science/', '/roadmaps/', '/blog/', '/docs/']) expect(home).toContain(`<a href="${href}">`);
    for (const id of ['chan-dung', 'bang-gia']) expect(html).toContain(`id="${id}"`);
    // Elsewhere the same items go to their pages.
    const pricing = nav(await readFile(join(outputDir, 'pricing', 'index.html'), 'utf8'));
    expect(pricing).toContain('<a href="/framework/">Khung thói quen</a>');
    expect(pricing).toContain('<a href="/pricing/">Bảng giá</a>');
    expect(pricing).not.toContain('href="#');
  });

  it('explains what the portraits section means without listing the sixteen portraits', async () => {
    const { html } = await buildFixture();
    const section = html.slice(html.indexOf('id="chan-dung"'), html.indexOf('class="section companions"'));
    expect(section).toContain('Mỗi thói quen là một nét vẽ nên chân dung của con');
    expect(section).toContain('Chân dung</strong> là hình ảnh con lớn lên');
    expect(section).not.toMatch(/16 chân dung|mười sáu|data-portrait|portrait-chip/);
    for (const age of ['0–3', '3–6', '6–12', '12–15', '15–18']) expect(section).toContain(age);
    expect(section.match(/<li><span class="growth-age">/g)).toHaveLength(5);
    expect(section).toContain('href="/framework/"');
    expect(section).toContain('không phải nhãn tính cách hay điểm số');
    expect(section).toContain('không cam kết một kết quả phát triển cụ thể');
  });

  it('wires the pointer effects to elements and only runs them for fine pointers with motion allowed', async () => {
    const { html } = await buildFixture();
    expect(html).toContain('<section class="hero" data-hero>');
    expect(html.match(/class="phone[^"]*" data-tilt/g)?.length).toBeGreaterThanOrEqual(4);
    expect(html.match(/data-spotlight/g)?.length).toBeGreaterThan(8);
    expect(html.match(/data-magnetic/g)).toHaveLength(4);
    const script = await readFile(join(process.cwd(), 'apps', 'marketing', 'client.js'), 'utf8');
    expect(script).toContain("(hover: hover) and (pointer: fine)");
    expect(script).toContain('prefers-reduced-motion: reduce');
    expect(script).toMatch(/if \(finePointer && motionAllowed\)/);
    expect(script).toContain("addEventListener('pointermove'");
    expect(script).toContain('requestAnimationFrame');
  });

  it('recognises a signed-in parent from the identity-free hint cookie and offers the app instead of a trial', async () => {
    const { html } = await buildFixture();
    expect(html).toContain(`document.cookie.split('; ').indexOf('${sessionHintCookie}=1')>-1`);
    expect(html.indexOf(`'${sessionHintCookie}=1'`)).toBeLessThan(html.indexOf('rel="stylesheet" href="/styles.css"'));
    expect(sessionHintCookie).toBe('kh_member');

    const memberLinks = html.match(/<a[^>]*data-member[^>]*>/g) ?? [];
    expect(memberLinks).toHaveLength(3);
    for (const link of memberLinks) expect(link).toContain('href="https://app.example/"');

    const guestBlocks = ['Dùng thử 7 ngày', 'Xem bản demo', 'class="sticky-cta" data-sticky-cta data-guest', 'nav-login" data-guest'];
    for (const marker of guestBlocks) expect(html).toContain(marker);
    expect(html.match(/data-guest/g)?.length).toBeGreaterThanOrEqual(7);

    const css = await readFile(join(process.cwd(), 'apps', 'marketing', 'styles.css'), 'utf8');
    expect(css).toContain('.is-member [data-guest] { display: none !important; }');
    expect(css).toContain('html:not(.is-member) [data-member] { display: none !important; }');
  });

  it('never puts identity in the hint: the site only reads a fixed flag value', async () => {
    const { html } = await buildFixture();
    const script = html.match(/<script>if\(document\.cookie[^<]*<\/script>/)?.[0] ?? '';
    expect(script).not.toMatch(/localStorage|sessionStorage|fetch|XMLHttpRequest|token/i);
    expect(script).toContain("classList.add('is-member')");
  });

  it('keeps motion meaningful: nothing decorative loops forever', async () => {
    const css = await readFile(join(process.cwd(), 'apps', 'marketing', 'styles.css'), 'utf8');
    expect(css).not.toMatch(/animation[^;{}]*infinite/);
    expect(css).toContain('prefers-reduced-motion');
  });

  it('explains the shift from reminders to self-direction and the safeguards for parents', async () => {
    const { html } = await buildFixture();
    expect(html).toContain('Nhắc mãi không phải cách duy nhất');
    expect(html).toContain('Ba mẹ nắm quyền, con được bảo vệ');
    const safety = html.match(/<ul class="safety-list">[\s\S]*?<\/ul>/)?.[0] ?? '';
    expect(safety.match(/<li>/g)).toHaveLength(4);
    expect(html).toContain('không quảng cáo, không bán dữ liệu của bé');
    expect(html).not.toMatch(/\b(số 1|top 1|#1)\b/i);
  });

  it('puts the brand mascots in the hero and a companions section with sized, described images', async () => {
    const { outputDir, html } = await buildFixture();
    expect(html).toMatch(/<img class="hero-mascot" src="\/mascots\/leo\.webp"[^>]*width="400" height="400"[^>]*fetchpriority="high"/);
    expect(html).toContain('Mỗi bé chọn một người bạn đồng hành');
    for (const mascot of ['leo', 'bunny', 'panda', 'fox', 'turtle', 'bee']) {
      expect(html).toContain(`src="/mascots/${mascot}.webp"`);
      expect((await stat(join(outputDir, 'mascots', `${mascot}.webp`))).size).toBeGreaterThan(1000);
    }
    const companionImages = html.match(/<img class="companion-image"[^>]*>/g) ?? [];
    expect(companionImages).toHaveLength(6);
    for (const image of companionImages) {
      expect(image).toMatch(/alt="[^"]{3,}"/);
      expect(image).toContain('loading="lazy"');
      expect(image).toMatch(/width="\d+" height="\d+"/);
    }
  });

  it('publishes share metadata with an absolute image, a twitter card and honest structured data', async () => {
    const { outputDir, html } = await buildFixture();
    expect(html).toContain('<meta property="og:image" content="https://www.example/og-image.jpg">');
    expect(html).toContain('<meta property="og:image:width" content="1200">');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(html).toContain('<meta property="og:site_name" content="KidHabit Hero">');
    expect((await stat(join(outputDir, 'og-image.jpg'))).size).toBeGreaterThan(5000);

    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(match).not.toBeNull();
    const data = JSON.parse(match![1]);
    expect(data['@type']).toBe('SoftwareApplication');
    expect(data.offers.map((offer: { price: string }) => offer.price)).toEqual(['29000', '49000', '399000']);
    for (const offer of data.offers) expect(offer.priceCurrency).toBe('VND');
    expect(JSON.stringify(data)).not.toMatch(/aggregateRating|review/i);
  });

  it('makes the two premium cards distinguishable and shows what the yearly plan saves', async () => {
    const { outputDir } = await buildFixture();
    const pricing = await readFile(join(outputDir, 'pricing', 'index.html'), 'utf8');
    expect(pricing).toContain('Gói Cao cấp · Tháng');
    expect(pricing).toContain('Gói Cao cấp · Năm');
    expect(pricing).not.toMatch(/<h3>Gói Cao cấp<\/h3>/);
    expect(pricing).toContain('33.250 VNĐ/tháng');
    expect(pricing).toContain('Tiết kiệm 189.000 VNĐ so với trả theo tháng');
  });

  it('surfaces the refund guarantee next to the purchase decision', async () => {
    const { html } = await buildFixture();
    const pricingSection = html.slice(html.indexOf('id="bang-gia"'), html.indexOf('faq-section'));
    expect(pricingSection).toContain('Hoàn tiền trong 30 ngày nếu chưa hài lòng');
    const hero = html.slice(html.indexOf('class="hero"'), html.indexOf('class="trust-bar"'));
    expect(hero).toContain('Hoàn tiền 30 ngày');
    expect(hero).toContain('7 ngày dùng thử');
  });

  it('states the 30-day refund policy in the terms and the pricing FAQ', async () => {
    const { outputDir } = await buildFixture();
    const terms = await readFile(join(outputDir, 'terms', 'index.html'), 'utf8');
    expect(terms).toContain('Hoàn tiền trong 30 ngày');
    expect(terms).toContain('30 ngày kể từ ngày thanh toán');
    const pricing = await readFile(join(outputDir, 'pricing', 'index.html'), 'utf8');
    expect(pricing).toContain('Tôi có được hoàn tiền không?');
    expect(pricing).toContain('30 ngày');
  });

  it('renders the shared privacy and terms documents as readable pages with a table of contents', async () => {
    const outputDir = await makeOutput('kidhabit-marketing-legal-');
    await buildMarketingSite({
      appOrigin: 'https://app.example',
      marketingOrigin: 'https://www.example',
      outputDir,
      supportEmail: 'support@example.com',
    });
    const privacy = await readFile(join(outputDir, 'privacy', 'index.html'), 'utf8');
    expect(privacy).toContain('class="legal-doc"');
    expect(privacy).toContain('<h1>Chính sách quyền riêng tư</h1>');
    expect(privacy).toContain('Cập nhật lần cuối: 29/09/2026');
    expect(privacy).toContain('<h2>5. Nơi lưu trữ dữ liệu</h2>');
    expect(privacy).toMatch(/<ul>\s*<li>Tài khoản phụ huynh:/);
    expect(privacy).toContain('<a href="mailto:support@example.com">support@example.com</a>');
    const terms = await readFile(join(outputDir, 'terms', 'index.html'), 'utf8');
    expect(terms).toContain('<h1>Điều khoản sử dụng</h1>');
    expect(terms).toContain('29.000 VNĐ');
    expect(terms).toContain('399.000 VNĐ');
  });

  it('shows the configured support mailbox on the contact page and keeps the notice without one', async () => {
    const withMailbox = await makeOutput('kidhabit-marketing-support-');
    await buildMarketingSite({
      appOrigin: 'https://app.example',
      marketingOrigin: 'https://www.example',
      outputDir: withMailbox,
      supportEmail: 'support@example.com',
    });
    const contact = await readFile(join(withMailbox, 'contact', 'index.html'), 'utf8');
    expect(contact).toContain('href="mailto:support@example.com"');
    expect(contact).not.toContain('sẽ được hiển thị trong ứng dụng');

    const { outputDir } = await buildFixture();
    const withoutMailbox = await readFile(join(outputDir, 'contact', 'index.html'), 'utf8');
    expect(withoutMailbox).not.toContain('mailto:');
    expect(withoutMailbox).toContain('Kênh email hỗ trợ chính thức');
  });

  it('rejects a malformed support mailbox instead of rendering it', async () => {
    await expect(buildMarketingSite({
      appOrigin: 'https://app.example',
      marketingOrigin: 'https://www.example',
      outputDir: await makeOutput('kidhabit-marketing-invalid-'),
      supportEmail: 'not-an-email"><script>',
    })).rejects.toThrow('supportEmail');
  });

  it('rejects non-HTTPS or non-origin deployment inputs', async () => {
    await expect(buildMarketingSite({
      appOrigin: 'http://app.example',
      marketingOrigin: 'https://www.example',
      outputDir: await makeOutput('kidhabit-marketing-invalid-'),
    })).rejects.toThrow('appOrigin');
    await expect(buildMarketingSite({
      appOrigin: 'https://app.example/path',
      marketingOrigin: 'https://www.example',
      outputDir: await makeOutput('kidhabit-marketing-invalid-'),
    })).rejects.toThrow('appOrigin');
  });
});
