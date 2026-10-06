import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { selectPublishableTestimonials } from '../../apps/marketing/render-site.mjs';
import { sessionHintCookie } from '../../apps/marketing/session-hint.mjs';
import { faqs, launchOffer, story, storyStages, traitLabels } from '../../apps/marketing/site-content.mjs';
import frameworkData from '../../src/data/habit-framework-v1.vi.json';
import { LAUNCH_OFFER } from '@/lib/billing/plan-catalog';
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

const chapterIds = ['mo-dau', 'buoi-sang', 'da-thu', 'ban-do', 'thu-lam-con', 'la-thu', 'gia', 'hoi-dap'];

/** The opening tag of the element that carries `marker`. */
function openingTag(html: string, marker: string) {
  const at = html.indexOf(marker);
  if (at < 0) return '';
  return html.slice(html.lastIndexOf('<', at), html.indexOf('>', at) + 1);
}

/** One plan card, from its opening tag to the next card or the end of the grid. */
function planCard(html: string, tier: string) {
  const start = html.indexOf(`data-plan="${tier}"`);
  if (start < 0) return '';
  const end = html.indexOf('</article>', start);
  return html.slice(start, end);
}

describe('marketing static artifact', () => {
  it('tells the family story in eight chapters, in order, then closes with the call to action', async () => {
    const { html } = await buildFixture();
    const chapters = [...html.matchAll(/<section[^>]*\bid="([^"]+)"[^>]*\bdata-chapter="([^"]+)"/g)];
    expect(chapters.map((match) => match[1])).toEqual(chapterIds);
    expect(chapters.map((match) => match[2])).toEqual(story.chapters.map((chapter) => chapter.label));
    expect(html.indexOf('class="final"')).toBeGreaterThan(html.indexOf('id="hoi-dap"'));
    for (const number of [1, 2, 3, 4, 5, 6, 7]) expect(html).toContain(`<p class="eyebrow">Chương ${number}</p>`);
    // Each chapter that has a next one links to it.
    for (const chapter of story.chapters.filter((item) => item.next)) {
      const next = chapterIds[chapterIds.indexOf(chapter.id) + 1];
      expect(html).toMatch(new RegExp(`<a href="#${next}"><span>Chương tiếp</span><strong>${chapter.next}</strong>`));
    }
  });

  it('opens with the story headline, the child’s screen in a photo frame and Leo', async () => {
    const { html } = await buildFixture();
    expect(html).toContain('<title>KidHabit Hero | Bớt nhắc, để con tự làm việc nhỏ mỗi ngày</title>');
    expect(html).toMatch(/<h1>Thôi làm chiếc <span class="hl">đồng hồ báo thức<svg[^>]*aria-hidden="true">[\s\S]*?<\/svg><\/span> biết nói của con\.<\/h1>/);
    expect(html).toMatch(/<figure class="photo">[\s\S]*?<img src="\/screens\/kid-home\.webp" alt="[^"]{20,}" width="600" height="1298" fetchpriority="high">[\s\S]*?<figcaption>Màn hình của con<\/figcaption><\/figure>/);
    expect(html).toMatch(/<img class="mascot" src="\/mascots\/leo\.webp" alt="" width="400" height="400"/);
    expect(html).toContain('Con tự đánh dấu xong');
    expect(html).not.toMatch(/\b(số 1|top 1|#1)\b/i);
  });

  it('server-renders every interactive part so the next script only toggles it', async () => {
    const { html } = await buildFixture();
    expect(html).toMatch(/<div class="quiz[^"]*" data-quiz>/);
    expect(html.match(/role="radio" aria-checked="false"[^>]*data-quiz-option="/g)).toHaveLength(3);
    expect(html).toMatch(/<div class="answer" data-quiz-answer hidden/);
    for (const option of story.quiz.options) {
      expect(html).toContain(`data-quiz-text="${option.value}" hidden>${option.answer}</p>`);
      expect(html).toContain(`data-final-title="${option.finalTitle}"`);
    }
    expect(html).toContain('Ba đến năm lần mỗi sáng, nếu sáng nào cũng vậy, là 90 đến 150 lần mỗi tháng.');
    expect(html).toMatch(/<div class="tried-grid[^"]*" data-tried>/);
    expect(html.match(/class="tried" type="button" aria-pressed="false"/g)).toHaveLength(4);
    expect(html).toContain('data-tried-result="count" hidden>');
    expect(html.match(/data-demo-task/g)).toHaveLength(3);
    expect(html).toMatch(/data-demo-stamp hidden/);
    expect(html).toMatch(/data-demo-praise hidden/);
    expect(html).toMatch(/<div class="dock" data-dock data-guest hidden>/);
    expect(openingTag(html, 'data-offer-remaining')).toMatch(/data-offer-remaining[^>]*>$/);
    expect(html).toMatch(/data-offer-remaining[^>]*><\/span>/);
    expect(openingTag(html, 'data-offer-remaining')).toContain('data-app-origin="https://app.example"');
    expect(html).toMatch(/role="radiogroup"[^>]*data-kids>/);
    expect(html).toMatch(/role="radiogroup"[^>]*data-cycle-toggle>/);
    // The chapter menu on phones starts closed; the script opens it.
    expect(html).toMatch(/<button class="chapter-pill" type="button" data-chapter-pill aria-expanded="false" aria-controls="chapter-menu">/);
    expect(html).toMatch(/<ol class="chapter-menu" id="chapter-menu" data-chapter-menu hidden>/);
    expect(html).toContain('data-progress');
  });

  it('renders all five age panels from the framework with only 6–12 open and the child’s words unquoted', async () => {
    const { html } = await buildFixture();
    expect(html).toMatch(/role="tablist"[^>]*data-age-tabs>/);
    const panels = [...html.matchAll(/<div class="stage" role="tabpanel" id="stage-(GD\d)"[^>]*data-age-panel="GD\d"( hidden)?>/g)];
    expect(panels.map((match) => match[1])).toEqual(storyStages.map((stage) => stage.id));
    expect(panels.map((match) => Boolean(match[2]))).toEqual([true, true, false, true, true]);
    expect(html).toMatch(/role="tab" id="age-GD3" aria-controls="stage-GD3" aria-selected="true" tabindex="0"/);
    for (const habit of storyStages.flatMap((stage) => stage.habits)) {
      expect(html).toContain(`<p class="meaning">${habit.childMeaning.replaceAll('"', '&quot;')}</p>`);
      for (const trait of habit.traits) expect(html).toContain(`<span class="trait">${trait.label}</span>`);
    }
    expect(html).not.toContain('<q>');
  });

  it('labels the demo tasks, including the plain “Chăm sóc bản thân” description', async () => {
    const { html } = await buildFixture();
    for (const task of story.demo.tasks) expect(html).toContain(`<b>${task.title}</b><small>${task.label}</small>`);
    expect(html).toContain('<small>Chăm sóc bản thân</small>');
    expect(html).toContain('Dữ liệu mẫu.');
  });

  it('prints the founder’s letter signed by a parent, not as a testimonial', async () => {
    const { html } = await buildFixture();
    expect(html).toContain('<b>Nguyễn Văn Hoà</b>');
    expect(html).toContain('Ba của Sam · Người làm ra KidHabit');
    expect(html).toContain('<mark>dọn giường là cách con giữ lời hứa với chính mình.</mark>');
    expect(html).toContain('Tôi không hứa con bạn sẽ thay đổi sau một tuần.');
    expect(html).not.toContain('class="quote-card"');
    expect(html).not.toMatch(/\d[\d.]*\s*(gia đình|phụ huynh|người dùng) (đã|đang) dùng/i);
  });

  it('shows the yearly prices by default with both cycles in each card and four exact checkout links', async () => {
    for (const route of ['', 'pricing']) {
      const { outputDir } = await buildFixture();
      const html = await readFile(join(outputDir, route, 'index.html'), 'utf8');
      expect(openingTag(html, 'data-pricing-cycle')).toContain('data-pricing-cycle="year"');
      for (const text of ['Tiết kiệm 69.000đ (15%)', 'Tiết kiệm 118.000đ (17%)', '468.000đ', '399.000đ', '590.000đ', '≈ 33.300đ mỗi tháng', '≈ 49.200đ mỗi tháng', 'Chỉ hơn Gói 1 bé 191.000đ mỗi năm', 'Chỉ hơn Gói 1 bé 20.000đ mỗi tháng', '<span class="save">đến -17%</span>']) {
        expect(html).toContain(text);
      }
      const checkout = new Set(html.match(/href="https:\/\/app\.example\/checkout\?plan=[a-z_]+"/g) ?? []);
      expect([...checkout].sort()).toEqual(['monthly', 'solo_monthly', 'solo_yearly', 'yearly'].map((id) => `href="https://app.example/checkout?plan=${id}"`));
      expect(html).not.toContain('family_plus');
      for (const tier of ['solo', 'pro']) {
        const card = planCard(html, tier);
        expect(card.match(/data-cycle="year"/g)?.length).toBeGreaterThanOrEqual(3);
        expect(card.match(/data-cycle="month"/g)?.length).toBeGreaterThanOrEqual(2);
      }
      // Without a script the yearly view is what shows, and it still offers the monthly checkout.
      expect(html).toMatch(/<a class="month-link" data-cycle="year" href="https:\/\/app\.example\/checkout\?plan=solo_monthly">Hoặc trả theo tháng: 39\.000đ<\/a>/);
      expect(html).toMatch(/<a class="month-link" data-cycle="year" href="https:\/\/app\.example\/checkout\?plan=monthly">Hoặc trả theo tháng: 59\.000đ<\/a>/);
      const plus = planCard(html, 'pro_plus');
      expect(plus).toContain('Đang phát triển');
      expect(plus).toContain('<button class="btn btn-soon" type="button" disabled>Sắp ra mắt</button>');
      expect(plus).not.toContain('href=');
      expect(html).toContain('class="plan recommended" data-plan="solo"');
      const css = await readFile(join(process.cwd(), 'apps', 'marketing', 'styles.css'), 'utf8');
      expect(css).toContain('[data-pricing-cycle="year"] [data-cycle="month"]');
      expect(css).toContain('[data-pricing-cycle="month"] [data-cycle="year"]');
    }
  });

  it('states the launch offer without a seat count, which only the live database may supply', async () => {
    const { html } = await buildFixture();
    expect(html).toContain('Ưu đãi ra mắt');
    expect(html).toContain('<b>10 gia đình đầu tiên</b> mua <b>Gói Pro theo năm</b>');
    expect(html).not.toMatch(/\d+\s*\/\s*10/);
    expect(html).not.toContain('suất còn lại');
    expect(html).toContain('Đang phát triển. Mua Gói Pro năm hôm nay để giữ suất nâng cấp miễn phí.');
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
    const { outputDir, html } = await buildFixture();
    const privacy = await readFile(join(outputDir, 'privacy', 'index.html'), 'utf8');
    expect(privacy).toContain('không bao giờ được hiển thị');
    expect(html).toContain('Chia sẻ công khai mặc định tắt');
    expect(html).not.toContain('Bảng xếp hạng mặc định tắt');
  });

  it('reassures parents about their data at the top of the questions chapter, with a link to the privacy policy', async () => {
    const { outputDir, html } = await buildFixture();
    for (const page of [html, await readFile(join(outputDir, 'pricing', 'index.html'), 'utf8')]) {
      const faqChapter = page.slice(page.indexOf('id="hoi-dap"'), page.indexOf('class="faq'));
      expect(faqChapter).toContain('An tâm cho cả nhà');
      expect(faqChapter.match(/<li class="safety-item">/g)).toHaveLength(4);
      for (const title of ['Khu vực phụ huynh có mã PIN', 'Mỗi gia đình một không gian riêng', 'Chia sẻ công khai mặc định tắt', 'Ba mẹ quyết định giữ hay xóa']) expect(faqChapter).toContain(title);
      expect(faqChapter).toContain('href="/privacy/"');
      expect(faqChapter).toContain('không quảng cáo, không bán dữ liệu của bé');
    }
  });

  it('links the map chapter to the science page and its limits', async () => {
    const { html } = await buildFixture();
    const map = html.slice(html.indexOf('id="ban-do"'), html.indexOf('id="thu-lam-con"'));
    expect(map).toMatch(/<a class="story-link" href="\/science\/">Cơ sở khoa học và giới hạn của nó <span aria-hidden="true">→<\/span><\/a>/);
  });

  it('keeps focus visible on the dark sticky bar and hides the unrecommended badge from screen readers', async () => {
    const css = await readFile(join(process.cwd(), 'apps', 'marketing', 'styles.css'), 'utf8');
    expect(css).toContain('.dock :focus-visible { outline-color: var(--sun); }');
    expect(css).toMatch(/\.badge \{[^}]*visibility: hidden;[^}]*transition: opacity \.25s, transform \.25s, visibility \.25s;/);
    expect(css).toMatch(/\.plan\.recommended \.badge, \.plan-soon \.badge \{[^}]*visibility: visible;/);
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

  it('ships security headers that allow only the page\'s own inline script by hash and reads only the app for data', async () => {
    const { outputDir, html } = await buildFixture();
    const headers = await readFile(join(outputDir, '_headers'), 'utf8');
    for (const name of ['Strict-Transport-Security', 'X-Content-Type-Options: nosniff', 'X-Frame-Options: DENY', 'Referrer-Policy', 'Permissions-Policy']) {
      expect(headers).toContain(name);
    }
    expect(headers).toContain("frame-ancestors 'none'");
    expect(headers).not.toMatch(/script-src[^;]*unsafe-inline/);
    expect(headers).toContain("connect-src 'self' https://app.example;");
    expect(headers).toContain("default-src 'self'; ");
    expect(headers).toContain("font-src https://fonts.gstatic.com; img-src 'self' data: https:;");
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

  it('provides semantic landmarks, viewport metadata, the story font and keyboard-focusable calls to action', async () => {
    const { outputDir, html } = await buildFixture();
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">');
    expect(html).toMatch(/<header[ >]/);
    expect(html).toMatch(/<nav[ >]/);
    expect(html).toMatch(/<main[ >]/);
    expect(html).toMatch(/<footer[ >]/);
    expect(html).toContain('class="btn btn-primary');
    expect(html).toContain('href="https://app.example/checkout?plan=monthly"');
    expect(html).toContain('family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;0,800;1,500');
    expect(html).not.toContain('Baloo');
    const pricing = await readFile(join(outputDir, 'pricing', 'index.html'), 'utf8');
    expect(pricing).toContain('href="https://app.example/" class="nav-login"');
    expect(html).not.toContain('https://app.example/login');
    const css = await readFile(join(process.cwd(), 'apps', 'marketing', 'styles.css'), 'utf8');
    expect(css).toContain('"Be Vietnam Pro"');
    expect(css).not.toContain('Baloo');
  });

  it('sends the trial buttons to login-and-activate, and only plan buttons to checkout', async () => {
    const { html } = await buildFixture();
    const hero = html.slice(html.indexOf('class="actions"'), html.indexOf('class="assure"'));
    expect(hero).toMatch(/<a class="btn btn-primary" data-guest href="https:\/\/app\.example\/start">Dùng thử 7 ngày/);
    expect(hero).toContain('href="#thu-lam-con"');
    expect(hero).not.toContain('checkout');
    expect(html).toMatch(/<a class="btn btn-primary top-cta" data-guest href="https:\/\/app\.example\/start">Dùng thử 7 ngày<\/a>/);
    expect(html).toMatch(/<div class="dock" data-dock data-guest hidden>[\s\S]*?data-dock-cta href="https:\/\/app\.example\/start"/);
    const finalCta = html.slice(html.indexOf('class="final"'));
    expect(finalCta).toMatch(/data-guest href="https:\/\/app\.example\/start">Dùng thử 7 ngày, không cần thẻ/);
    expect(finalCta).not.toContain('checkout');
    expect(html).not.toContain('href="#gia">Dùng thử');
    const checkoutLinks = html.match(/href="https:\/\/app\.example\/checkout\?plan=[a-z_]+"/g) ?? [];
    expect(new Set(checkoutLinks).size).toBe(4);
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

  it('describes the age-tuned child screen as a feature with its limits, without promising results', async () => {
    const { html } = await buildFixture();
    expect(html).toContain('Giao diện của bé có đổi theo tuổi không?');
    expect(html).toContain('3–8, 9–12 và từ 13 tuổi');
    expect(html).toContain('Bé dưới 3 tuổi, hoặc chưa có năm sinh, vẫn dùng giao diện mặc định.');
    expect(html).not.toMatch(/tăng động lực|đảm bảo|cam kết hiệu quả/i);
    const ledger = await readFile('docs/claims-ledger.md', 'utf8');
    expect(ledger).toContain('Giao diện của bé tự đổi theo tuổi');
  });

  it('records the story page in the claims ledger', async () => {
    const ledger = await readFile('docs/claims-ledger.md', 'utf8');
    const row = ledger.split('\n').find((line) => line.startsWith('| Trang chủ kể chuyện')) ?? '';
    expect(row).toContain('Nguyễn Văn Hoà · Ba của Sam');
    expect(row).toContain('không phải lời chứng thực');
    expect(row).toContain('không hứa kết quả');
    expect(row).toMatch(/số suất còn lại[^|]*không bao giờ ghi cứng/);
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

  it('gives the home page a chapter navigation and every other page the site navigation', async () => {
    const { outputDir, html } = await buildFixture();
    const chapters = html.match(/<nav class="chapter-nav" aria-label="Các chương">[\s\S]*?<\/nav>/)?.[0] ?? '';
    expect([...chapters.matchAll(/href="#([^"]+)"/g)].map((match) => match[1])).toEqual(chapterIds);
    const menu = html.match(/<ol class="chapter-menu"[\s\S]*?<\/ol>/)?.[0] ?? '';
    expect([...menu.matchAll(/href="#([^"]+)"/g)].map((match) => match[1])).toEqual(chapterIds);
    // The opening is not a numbered chapter; the rest match their "Chương N" eyebrows.
    expect([...menu.matchAll(/<span>(\d+)<\/span>/g)].map((match) => Number(match[1]))).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(menu).toMatch(/<a href="#mo-dau" data-chapter-link>Mở đầu<\/a>/);
    expect(menu).toMatch(/<a href="#buoi-sang" data-chapter-link><span>1<\/span>Buổi sáng<\/a>/);
    // The pill can only open the menu once the page script has run; without it the pill stays hidden.
    const css = await readFile(join(process.cwd(), 'apps', 'marketing', 'styles.css'), 'utf8');
    expect(css).toContain('[data-js] .chapter-pill { display: inline-flex; }');
    expect(html).not.toContain('id="primary-navigation"');
    const nav = (page: string) => page.match(/<nav id="primary-navigation"[\s\S]*?<\/nav>/)?.[0] ?? '';
    const pricing = nav(await readFile(join(outputDir, 'pricing', 'index.html'), 'utf8'));
    expect(pricing).toContain('<a href="/framework/">Khung thói quen</a>');
    expect(pricing).toContain('<a href="/pricing/">Bảng giá</a>');
    for (const href of ['/science/', '/roadmaps/', '/blog/', '/docs/']) expect(pricing).toContain(`<a href="${href}">`);
    expect(pricing).not.toContain('href="#');
  });

  it('recognises a signed-in parent from the identity-free hint cookie and offers the app instead of a trial', async () => {
    const { html } = await buildFixture();
    expect(html).toContain(`document.cookie.split('; ').indexOf('${sessionHintCookie}=1')>-1`);
    expect(html.indexOf(`'${sessionHintCookie}=1'`)).toBeLessThan(html.indexOf('rel="stylesheet" href="/styles.css"'));
    expect(sessionHintCookie).toBe('kh_member');

    const memberLinks = html.match(/<a[^>]*data-member[^>]*>/g) ?? [];
    expect(memberLinks).toHaveLength(3);
    for (const link of memberLinks) expect(link).toContain('href="https://app.example/"');

    const guestLinks = html.match(/<a[^>]*data-guest[^>]*>/g) ?? [];
    expect(guestLinks).toHaveLength(4);
    for (const link of guestLinks.filter((item) => !item.includes('nav-login'))) expect(link).toContain('href="https://app.example/start"');
    // A parent on a new device has no hint cookie yet: the home header still lets a guest sign in.
    const header = html.match(/<header class="story-top"[\s\S]*?<\/header>/)?.[0] ?? '';
    expect(header).toContain('<a class="nav-login" data-guest href="https://app.example/">Đăng nhập</a>');
    expect(html).toContain('class="dock" data-dock data-guest');

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

  it('keeps motion meaningful: nothing decorative loops forever, and content shows without the script', async () => {
    const css = await readFile(join(process.cwd(), 'apps', 'marketing', 'styles.css'), 'utf8');
    expect(css).not.toMatch(/animation[^;{}]*infinite/);
    expect(css).toContain('prefers-reduced-motion');
    // Hidden-until-revealed and dimmed timeline states apply only once the script has marked the page ready.
    expect(css).not.toMatch(/(^|\n)\.story \.reveal \{[^}]*opacity: 0/);
    expect(css).toContain('[data-motion] .story .reveal:not(.is-in)');
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
    expect(data.offers.map((offer: { price: string }) => offer.price)).toEqual(['39000', '399000', '59000', '590000']);
    for (const offer of data.offers) expect(offer.priceCurrency).toBe('VND');
    expect(JSON.stringify(data)).not.toMatch(/aggregateRating|review|family_plus/i);
  });

  it('surfaces the refund guarantee next to the purchase decision', async () => {
    const { html } = await buildFixture();
    const pricingSection = html.slice(html.indexOf('id="gia"'), html.indexOf('id="hoi-dap"'));
    expect(pricingSection).toContain('hoàn tiền nếu chưa hợp');
    expect(pricingSection).toContain('tự động gia hạn');
    const hero = html.slice(html.indexOf('id="mo-dau"'), html.indexOf('data-quiz'));
    expect(hero).toContain('Hoàn tiền 30 ngày');
    expect(hero).toContain('Dùng thử 7 ngày');
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
    for (const price of ['39.000 VNĐ', '399.000 VNĐ', '59.000 VNĐ', '590.000 VNĐ']) expect(terms).toContain(price);
    expect(terms).not.toContain('29.000 VNĐ');
    expect(terms).toContain('tối đa 5 hồ sơ bé');
    expect(terms).toContain('10 gia đình đầu tiên thanh toán Gói Pro theo năm');
    expect(terms).toContain('Pro Plus');
    expect(terms).toContain('chưa mở bán');
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

describe('home page story content', () => {
  const approvedHabits = [
    ['GD1-NT-01', 'GD1-MQH-01', 'GD1-TC-01'],
    ['GD2-NT-02', 'GD2-HT-02', 'GD2-TC-01'],
    ['GD3-NT-01', 'GD3-TC-01', 'GD3-SK-01'],
    ['GD4-NT-02', 'GD4-MQH-02', 'GD4-HT-01'],
    ['GD5-NT-01', 'GD5-NT-03', 'GD5-HT-03'],
  ];
  const habitById = new Map(frameworkData.habits.map((habit) => [habit.id, habit]));

  it('walks the five framework stages with the approved habits, in order', () => {
    expect(storyStages.map((stage) => stage.id)).toEqual(frameworkData.stages.map((stage) => stage.id));
    expect(storyStages.map((stage) => stage.habits.map((habit) => habit.id))).toEqual(approvedHabits);
    for (const stage of storyStages) {
      const source = frameworkData.stages.find((candidate) => candidate.id === stage.id)!;
      expect(stage.age).toBe(source.ageRange.replace('-', '–'));
      expect(stage.adultRole).toBe(source.adultRole);
    }
  });

  it('quotes each habit’s meaning for the child word for word from the framework', () => {
    for (const habit of storyStages.flatMap((stage) => stage.habits)) {
      const source = habitById.get(habit.id)!;
      expect(habit.childMeaning).toBe(source.childMeaning);
      expect(habit.fullName).toBe(source.name);
      expect(habit.name.length).toBeGreaterThan(0);
    }
  });

  it('labels each habit only with qualities tagged on that habit in the framework', () => {
    for (const habit of storyStages.flatMap((stage) => stage.habits)) {
      const tags = habitById.get(habit.id)!.conceptTags;
      expect(habit.traits.length).toBeGreaterThan(0);
      for (const trait of habit.traits) {
        expect(tags).toContain(trait.tag);
        expect(trait.label).toBe(traitLabels[trait.tag]);
      }
    }
    // Every label names a tag the framework really uses.
    const allTags = new Set(frameworkData.habits.flatMap((habit) => habit.conceptTags));
    for (const tag of Object.keys(traitLabels)) expect(allTags.has(tag)).toBe(true);
    // A demo task names a framework quality when it has one; brushing teeth carries a plain description instead.
    for (const task of story.demo.tasks) {
      if (task.trait) expect(task.label).toBe(traitLabels[task.trait]);
      else expect(task.label).toBe('Chăm sóc bản thân');
    }
  });

  it('signs the letter as the founder, a parent, and promises no result', () => {
    expect(story.letter.signature).toEqual({ name: 'Nguyễn Văn Hoà', role: 'Ba của Sam', maker: 'Người làm ra KidHabit' });
    const text = JSON.stringify(story);
    expect(text).toContain('Tôi không hứa con bạn sẽ thay đổi sau một tuần.');
    expect(text).not.toMatch(/đảm bảo|cam kết hiệu quả|tăng động lực|\b(số 1|top 1|#1)\b/i);
    expect(text).not.toMatch(/\d[\d.]*\s*(gia đình|phụ huynh|người dùng) (đã|đang) dùng/i);
  });

  it('states the launch offer from the app’s own numbers, without a remaining count', () => {
    expect(launchOffer.slots).toBe(LAUNCH_OFFER.slots);
    expect(launchOffer.planId).toBe(LAUNCH_OFFER.planId);
    expect(launchOffer.soldOut).toBe('Đã hết suất');
    expect(launchOffer).not.toHaveProperty('remaining');
  });

  it('answers the launch offer, the trial, the refund and the age questions', () => {
    const questions = faqs.map((item) => item.question);
    for (const question of [
      'Ưu đãi nâng cấp lên Pro Plus hoạt động thế nào?',
      'Hết 7 ngày dùng thử thì sao?',
      'Tôi có được hoàn tiền không?',
      'Con bao nhiêu tuổi thì phù hợp?',
      'KidHabit có thay thế việc ba mẹ dạy con không?',
      'Giao diện của bé có đổi theo tuổi không?',
    ]) expect(questions).toContain(question);
    expect(new Set(questions).size).toBe(questions.length);
    expect(JSON.stringify(faqs)).not.toMatch(/đủ điều kiện|đảm bảo/);
  });
});
