import { buildLegalPages, legalUpdatedLabel } from './legal-content.mjs';
import { sessionHintCookie } from './session-hint.mjs';
import scienceData from '../../src/data/science-content.json' with { type: 'json' };
import frameworkData from '../../src/data/habit-framework-v1.vi.json' with { type: 'json' };
import { maxSavingPercent, priceView, pricingTiers, upgradeDifference } from './pricing.mjs';
import { faqGroups, faqs, launchOffer, navigation, publicPages, safety, story, storyStages, testimonials } from './site-content.mjs';

const icons = {
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6 6-2Z"/>',
  'list-checks': '<path d="m3 7 2 2 4-4M3 17l2 2 4-4M13 6h8M13 12h8M13 18h8"/>',
  'trend-up': '<path d="M3 17 9 11l4 4 8-8"/><path d="M15 7h6v6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  smartphone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
  qr: '<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  'eye-off': '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  flask: '<path d="M10 2v7.5L4.5 19a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 9.5V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  lightbulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
  map: '<path d="M14.1 4.6 9 2 3 5v15l6-3 5.1 2.6L21 19V4l-6.9.6z"/><path d="M9 2v15"/><path d="M15 5v15"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
};

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function icon(name, className = '') {
  return `<svg class="icon ${className}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
}

export function appUrl(appOrigin, path) {
  return new URL(path, `${appOrigin}/`).href;
}

function formatVnd(amount) {
  return String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function jsonLd(data) {
  return `<script type="application/ld+json">${JSON.stringify(data).replaceAll('<', '\\u003c')}</script>`;
}

/** WebPage plus breadcrumb (and the visible FAQ when the page shows one) for a public page. */
function renderPageStructuredData({ name, description, path, marketingOrigin, crumbs = [], faqItems = [] }) {
  const url = new URL(path, `${marketingOrigin}/`).href;
  const graph = [
    { '@type': 'WebPage', '@id': `${url}#page`, url, name, description, inLanguage: 'vi', isPartOf: { '@type': 'WebSite', name: 'KidHabit Hero', url: new URL('/', `${marketingOrigin}/`).href } },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [{ name: 'Trang chủ', path: '/' }, ...crumbs, { name, path }].map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: new URL(crumb.path, `${marketingOrigin}/`).href,
      })),
    },
  ];
  if (faqItems.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })),
    });
  }
  return jsonLd({ '@context': 'https://schema.org', '@graph': graph });
}

function renderStructuredData({ marketingOrigin, appOrigin }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'KidHabit Hero',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web',
    inLanguage: 'vi',
    url: new URL('/', `${marketingOrigin}/`).href,
    image: new URL('/og-image.jpg', `${marketingOrigin}/`).href,
    description: 'Ứng dụng đồng hành giáo dục con qua thói quen: ba mẹ chọn việc nhỏ phù hợp độ tuổi, con làm mỗi ngày và cả nhà cùng ghi nhận.',
    // Only the plans on sale; Pro Plus has no plan id and no offer.
    offers: Object.keys(pricingTiers).filter((tier) => pricingTiers[tier].purchasable).flatMap((tier) => ['month', 'year'].map((cycle) => {
      const view = priceView(tier, cycle);
      return {
        '@type': 'Offer',
        name: `${pricingTiers[tier].name} · ${cycle === 'year' ? 'Năm' : 'Tháng'}`,
        price: String(view.price),
        priceCurrency: 'VND',
        url: appUrl(appOrigin, `/checkout?plan=${view.planId}`),
        availability: 'https://schema.org/InStock',
      };
    })),
  };
  return `<script type="application/ld+json">${JSON.stringify(data).replaceAll('<', '\\u003c')}</script>`;
}

// Every page but the home page (which has its own chapter header) uses this navigation.
function renderHeader(appOrigin) {
  return `<header class="site-header">
    <div class="shell nav-shell">
      <a class="brand" href="/" aria-label="KidHabit Hero, trang chủ">
        <img src="/logo.svg" alt="" width="42" height="42">
        <span>KidHabit <strong>Hero</strong></span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-navigation" aria-label="Mở trình đơn">${icon('menu')}</button>
      <nav id="primary-navigation" class="primary-nav" aria-label="Điều hướng chính">
        ${navigation.map((item) => `<a href="${item.href}">${escapeHtml(item.label)}</a>`).join('')}
        <a href="${appUrl(appOrigin, '/')}" class="nav-login" data-guest>Đăng nhập</a>
        <a href="${appUrl(appOrigin, '/start')}" class="button button-small" data-guest>Dùng thử 7 ngày</a><a href="${appUrl(appOrigin, '/')}" class="button button-small" data-member>Vào ứng dụng</a>
      </nav>
    </div>
  </header>`;
}

function renderFooter(appOrigin) {
  return `<footer class="site-footer">
    <div class="shell footer-grid">
      <div class="footer-brand">
        <a class="brand" href="/"><img src="/logo.svg" alt="" width="40" height="40"><span>KidHabit <strong>Hero</strong></span></a>
        <p>Giúp con làm được việc nhỏ hôm nay, để tự tin hơn mỗi ngày.</p>
      </div>
      <div><h2>Sản phẩm</h2><a href="/framework/">Khung thói quen</a><a href="/science/">Cơ sở khoa học</a><a href="/roadmaps/">Lộ trình</a><a href="/pricing/">Bảng giá</a><a href="/blog/">Blog</a></div>
      <div><h2>Hỗ trợ</h2><a href="/docs/">Hướng dẫn</a><a href="/contact/">Liên hệ</a><a href="${appUrl(appOrigin, '/')}">Đăng nhập ứng dụng</a></div>
      <div><h2>Thông tin</h2><a href="/privacy/">Quyền riêng tư</a><a href="/terms/">Điều khoản</a><a href="/gioi-thieu/">Giới thiệu bạn bè</a></div>
    </div>
    <div class="shell footer-bottom"><p>© 2026 KidHabit Hero.</p><p>Dành cho ba mẹ và những người lớn đồng hành cùng trẻ.</p></div>
  </footer>`;
}

export function renderDocument({ title, description, path, marketingOrigin, appOrigin, body, structuredData = '', ogType = 'website', extraHead = '', header = renderHeader(appOrigin) }) {
  const canonical = new URL(path, `${marketingOrigin}/`).href;
  const shareImage = new URL('/og-image.jpg', `${marketingOrigin}/`).href;
  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:locale" content="vi_VN">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="KidHabit Hero">
  <meta property="og:image" content="${shareImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Bớt nhắc, để con tự làm việc nhỏ mỗi ngày. KidHabit Hero cho bé 4–12 tuổi, cùng Leo, 7 ngày dùng thử không cần thẻ">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${shareImage}">
  <meta name="theme-color" content="#1f5f47">
  <link rel="icon" href="/logo.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;0,800;1,500&display=swap&subset=vietnamese" rel="stylesheet">
  <script>if(document.cookie.split('; ').indexOf('${sessionHintCookie}=1')>-1)document.documentElement.classList.add('is-member')</script>
  <link rel="stylesheet" href="/styles.css">
  <script src="/client.js" defer></script>
  ${extraHead}
  ${structuredData}
</head>
<body>
  <a class="skip-link" href="#noi-dung">Bỏ qua điều hướng</a>
  ${header}
  ${body}
  ${renderFooter(appOrigin)}
</body>
</html>`;
}

export function selectPublishableTestimonials(list, now = new Date()) {
  return list.filter((item) => item
    && typeof item.quote === 'string' && item.quote.trim()
    && typeof item.name === 'string' && item.name.trim()
    && item.consent === true
    && typeof item.source === 'string' && item.source.trim()
    && item.reviewBy && new Date(item.reviewBy).getTime() > now.getTime());
}

function renderFamilyQuotes({ now }) {
  const proof = selectPublishableTestimonials(testimonials, now);
  if (!proof.length) return '';
  return `<section class="section early" aria-labelledby="early-title"><div class="shell">
    <div class="section-heading section-heading-center"><p class="eyebrow">Gia đình nói gì</p><h2 id="early-title">Những gia đình đang dùng KidHabit</h2></div>
    <ul class="quote-grid">${proof.map((item) => `<li class="quote-card" data-spotlight><blockquote>${escapeHtml(item.quote)}</blockquote><p><strong>${escapeHtml(item.name)}</strong>${item.role ? `<span>${escapeHtml(item.role)}</span>` : ''}</p></li>`).join('')}</ul>
  </div></section>`;
}

// ---- Story-led home page and the plans. Everything the page script toggles is rendered here first, so the page
// reads in full without the script: the yearly prices, the 6–12 age panel and every chapter are visible. ----

const vnd = (amount) => `${formatVnd(amount)}đ`;
const tick = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
const smallTick = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
const arrow = '<span class="arrow" aria-hidden="true">→</span>';

/** Wraps the first occurrence of each phrase in `tag`; the text is escaped first. */
function emphasise(text, phrases, tag = 'b') {
  let html = escapeHtml(text);
  for (const phrase of phrases) {
    const escaped = escapeHtml(phrase);
    html = html.replace(escaped, `<${tag}>${escaped}</${tag}>`);
  }
  return html;
}

function chapter(id) {
  return story.chapters.find((item) => item.id === id);
}

// Where the sticky bar's button leads from each chapter; anything not listed starts the trial.
const dockTargets = { 'buoi-sang': '#thu-lam-con', 'da-thu': '#ban-do', 'la-thu': '#gia' };

/** Opening attributes of a chapter section: its id, its name for the chapter nav and the sticky bar copy. */
function chapterAttributes(id, appOrigin) {
  const dock = story.dock[id];
  const dockData = dock
    ? ` data-dock-title="${escapeHtml(dock[0])}" data-dock-note="${escapeHtml(dock[1])}" data-dock-cta="${escapeHtml(dock[2])}" data-dock-href="${dockTargets[id] ?? appUrl(appOrigin, '/start')}"`
    : '';
  return `id="${id}" data-chapter="${escapeHtml(chapter(id).label)}"${dockData}`;
}

function renderNext(id) {
  const current = chapter(id);
  if (!current?.next) return '';
  const target = story.chapters[story.chapters.indexOf(current) + 1];
  return `<div class="wrap next"><a href="#${target.id}"><span>${escapeHtml(story.nextLabel)}</span><strong>${escapeHtml(current.next)}</strong><span class="chev" aria-hidden="true">↓</span></a></div>`;
}

function renderStoryHeader(appOrigin) {
  // The opening is not numbered; the rest match their "Chương N" eyebrows.
  const links = (numbered) => story.chapters.map((item, index) => `<li><a href="#${item.id}" data-chapter-link>${numbered && index > 0 ? `<span>${index}</span>` : ''}${escapeHtml(item.label)}</a></li>`).join('');
  return `<header class="story-top" data-story-top>
    <div class="wrap top-inner">
      <a class="logo" href="#mo-dau" aria-label="KidHabit Hero, về đầu trang"><img src="/mascots/leo.webp" alt="" width="400" height="400">KidHabit</a>
      <nav class="chapter-nav" aria-label="Các chương"><ol class="chapters">${links(false)}</ol></nav>
      <button class="chapter-pill" type="button" data-chapter-pill aria-expanded="false" aria-controls="chapter-menu"><b data-pill-num></b> <span data-pill-name>${escapeHtml(story.chapters[0].label)}</span> <span aria-hidden="true">▾</span></button>
      <ol class="chapter-menu" id="chapter-menu" data-chapter-menu hidden>${links(true)}</ol>
      <a class="nav-login" data-guest href="${appUrl(appOrigin, '/')}">Đăng nhập</a>
      <a class="btn btn-primary top-cta" data-guest href="${appUrl(appOrigin, '/start')}">Dùng thử 7 ngày</a><a class="btn btn-primary top-cta" data-member href="${appUrl(appOrigin, '/')}">Vào ứng dụng</a>
    </div>
    <div class="progress" data-progress></div>
  </header>`;
}

function renderHowItWorks() {
  const copy = story.howItWorks;
  return `<div class="how-it-works" role="group" aria-labelledby="how-it-works-title">
        <h2 id="how-it-works-title">${escapeHtml(copy.title)}</h2>
        <ol class="how-steps-home">${copy.steps.map((step, index) => `<li><span class="how-number" aria-hidden="true">${index + 1}</span><div><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.text)}</p></div></li>`).join('')}</ol>
        <p class="feature-label" id="home-features-title">${escapeHtml(copy.featuresLabel)}</p>
        <ul class="feature-strip" aria-labelledby="home-features-title">${copy.features.map((feature) => `<li><b>${escapeHtml(feature.title)}</b><span>${escapeHtml(feature.text)}</span></li>`).join('')}</ul>
      </div>`;
}

function renderStoryHero(appOrigin) {
  const { hero, quiz } = story;
  const [before, after] = hero.title.split(hero.highlight);
  return `<section class="hero" ${chapterAttributes('mo-dau', appOrigin)}>
    <div class="wrap">
      <div class="hero-grid">
        <div>
          <p class="eyebrow">${escapeHtml(hero.eyebrow)}</p>
          <h1>${escapeHtml(before)}<span class="hl">${escapeHtml(hero.highlight)}<svg viewBox="0 0 300 16" preserveAspectRatio="none" aria-hidden="true"><path d="M4 11 C 70 3, 150 14, 220 7 S 290 6, 296 9"/></svg></span>${escapeHtml(after)}</h1>
          <p class="lead hero-lead">${escapeHtml(hero.lead)}</p>
          <div class="actions">
            <a class="btn btn-primary" data-guest href="${appUrl(appOrigin, '/start')}">${escapeHtml(hero.primaryCta)} ${arrow}</a><a class="btn btn-primary" data-member href="${appUrl(appOrigin, '/')}">Vào ứng dụng của gia đình ${arrow}</a>
            <a class="btn btn-line" href="#thu-lam-con">${escapeHtml(hero.secondaryCta)}</a>
          </div>
          <ul class="assure">${hero.assurances.map((item) => `<li>${tick}${escapeHtml(item)}</li>`).join('')}</ul>
        </div>
        <div class="photo-wrap">
          <figure class="photo">
            <span class="corner c1"></span><span class="corner c2"></span><span class="corner c3"></span><span class="corner c4"></span>
            <img src="/screens/kid-home.webp" alt="${escapeHtml(hero.imageAlt)}" width="600" height="1298" fetchpriority="high">
            <figcaption>${escapeHtml(hero.caption)}</figcaption></figure>
          <span class="chip chip-a"><i></i>${escapeHtml(hero.chip)}</span>
          <img class="mascot" src="/mascots/leo.webp" alt="" width="400" height="400">
        </div>
      </div>
      ${renderHowItWorks()}
      <div class="quiz reveal" data-quiz>
        <div><p class="eyebrow">${escapeHtml(quiz.eyebrow)}</p><h2 class="quiz-q" id="quiz-q">${escapeHtml(quiz.question)}</h2></div>
        <div class="options" role="radiogroup" aria-labelledby="quiz-q">${quiz.options.map((option, index) => `<button class="opt" type="button" role="radio" aria-checked="false" tabindex="${index === 0 ? 0 : -1}" data-quiz-option="${option.value}" data-final-title="${escapeHtml(option.finalTitle)}">${escapeHtml(option.label)}</button>`).join('')}</div>
        <div class="answer" data-quiz-answer hidden aria-live="polite">
          ${quiz.options.map((option) => `<p data-quiz-text="${option.value}" hidden>${escapeHtml(option.answer)}</p>`).join('')}
          <a class="btn btn-soft" href="#buoi-sang">${escapeHtml(quiz.readMore)} <span class="arrow" aria-hidden="true">↓</span></a>
        </div>
      </div>
    </div>
  </section>`;
}

function renderMorning(appOrigin) {
  const { morning } = story;
  return `<section class="tone-soft" ${chapterAttributes('buoi-sang', appOrigin)}>
    <div class="wrap split">
      <div class="sticky-col reveal">
        <p class="eyebrow">${escapeHtml(morning.eyebrow)}</p>
        <h2>${escapeHtml(morning.title)}</h2>
        <p class="lead">${escapeHtml(morning.lead)}</p>
        <div class="counter"><strong data-nag-count>${morning.timeline.length}</strong><span>${escapeHtml(morning.counterLabel)}</span></div>
      </div>
      <ol class="timeline" data-timeline>${morning.timeline.map((item) => `<li><time>${escapeHtml(item.time)}</time><div><span class="bubble">${escapeHtml(item.text)}</span></div></li>`).join('')}</ol>
    </div>
    ${renderNext('buoi-sang')}
  </section>`;
}

function renderTried(appOrigin) {
  const { tried } = story;
  const [countBefore, countAfter] = tried.resultCount.split('{n}');
  return `<section ${chapterAttributes('da-thu', appOrigin)}>
    <div class="wrap">
      <div class="reveal">
        <p class="eyebrow">${escapeHtml(tried.eyebrow)}</p>
        <h2>${escapeHtml(tried.title)}</h2>
        <p class="lead">${escapeHtml(tried.lead)}</p>
      </div>
      <div class="tried-grid reveal" data-tried>${tried.cards.map((card) => `<button class="tried" type="button" aria-pressed="false"><span class="tick" aria-hidden="true">✓</span><span class="ico" aria-hidden="true">${card.icon}</span><span class="tried-title">${escapeHtml(card.title)}</span><span class="tried-text">${escapeHtml(card.text)}</span><span class="end">${escapeHtml(card.end)}</span></button>`).join('')}</div>
      <div class="tried-result reveal" aria-live="polite">
        <strong data-tried-count>?</strong>
        <p data-tried-result="empty">${escapeHtml(tried.resultEmpty)}</p>
        <p data-tried-result="count" hidden>${escapeHtml(countBefore)}<span data-tried-n>0</span>${escapeHtml(countAfter)}</p>
      </div>
    </div>
    ${renderNext('da-thu')}
  </section>`;
}

function renderMap(appOrigin) {
  const { missing } = story;
  const { explorer } = missing;
  const tabs = storyStages.map((stage) => {
    const selected = stage.id === explorer.defaultStage;
    return `<button class="age" type="button" role="tab" id="age-${stage.id}" aria-controls="stage-${stage.id}" aria-selected="${selected}" tabindex="${selected ? 0 : -1}" data-age-tab="${stage.id}">${escapeHtml(stage.age)}<small>${escapeHtml(explorer.ageUnit)}</small></button>`;
  }).join('');
  const panels = storyStages.map((stage) => `<div class="stage" role="tabpanel" id="stage-${stage.id}" aria-labelledby="age-${stage.id}" tabindex="0" data-age-panel="${stage.id}"${stage.id === explorer.defaultStage ? '' : ' hidden'}>
        <div class="stage-meta"><h3>${escapeHtml(stage.age)} ${escapeHtml(explorer.ageUnit)} · ${escapeHtml(stage.title)}</h3><span>${escapeHtml(explorer.roleLabel)}: <b>${escapeHtml(stage.adultRole)}</b></span></div>
        <div class="habits">${stage.habits.map((habit) => `<article class="habit"><h4>${escapeHtml(habit.name)}</h4><p class="meaning">${escapeHtml(habit.childMeaning)}</p><div class="traits">${habit.traits.map((trait) => `<span class="trait">${escapeHtml(trait.label)}</span>`).join('')}</div></article>`).join('')}</div>
      </div>`).join('');
  return `<section class="tone-soft" ${chapterAttributes('ban-do', appOrigin)}>
    <div class="wrap">
      <div class="reveal narrow">
        <p class="eyebrow">${escapeHtml(missing.eyebrow)}</p>
        <h2>${escapeHtml(missing.title)}</h2>
      </div>
      <div class="three reveal">${missing.items.map((item) => `<div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></div>`).join('')}</div>
      <div class="explorer reveal">
        <div class="explorer-head">
          <h3 class="explorer-q" id="age-q">${escapeHtml(explorer.question)}</h3>
          <p class="muted">${escapeHtml(explorer.hint)}</p>
          <div class="ages" role="tablist" aria-labelledby="age-q" data-age-tabs>${tabs}</div>
        </div>
        ${panels}
        <p class="muted stage-note">${escapeHtml(explorer.note)}</p>
      </div>
      <p class="map-more"><a class="story-link" href="/science/">Cơ sở khoa học và giới hạn của nó <span aria-hidden="true">→</span></a></p>
    </div>
    ${renderNext('ban-do')}
  </section>`;
}

function renderDemo(appOrigin) {
  const { demo } = story;
  return `<section ${chapterAttributes('thu-lam-con', appOrigin)}>
    <div class="wrap demo-grid">
      <div class="phone reveal" data-demo>
        <div class="phone-head"><img src="/mascots/leo.webp" alt="" width="400" height="400" loading="lazy" decoding="async"><div><b>${escapeHtml(demo.child)}</b><small>${escapeHtml(demo.cheer)}</small></div><span class="stars" aria-live="polite"><span aria-hidden="true">★</span> <span data-demo-stars>0</span><span class="sr-only"> sao</span></span></div>
        <div class="bar" aria-hidden="true"><i data-demo-bar></i></div>
        ${demo.tasks.map((task) => `<button class="task" type="button" aria-pressed="false" data-demo-task data-points="${task.points}"><span class="box" aria-hidden="true">✓</span><span><b>${escapeHtml(task.title)}</b><small>${escapeHtml(task.label)}</small></span><span class="pts">+${task.points}</span></button>`).join('')}
        <div class="stamp" data-demo-stamp hidden>${escapeHtml(demo.stamp)}</div>
      </div>
      <div class="reveal">
        <p class="eyebrow">${escapeHtml(demo.eyebrow)}</p>
        <h2>${escapeHtml(demo.title)}</h2>
        <p class="lead">${escapeHtml(demo.lead)}</p>
        <ul class="swap">${demo.swaps.map((swap) => `<li><del>${escapeHtml(swap.before)}</del><span aria-hidden="true">→</span><b>${escapeHtml(swap.after)}</b></li>`).join('')}</ul>
        <div class="praise" data-demo-praise hidden><small>${escapeHtml(demo.praiseLabel)}</small><p>${escapeHtml(demo.praise)}</p></div>
        <p class="muted demo-note">${escapeHtml(demo.sampleNote)}</p>
      </div>
    </div>
    ${renderNext('thu-lam-con')}
  </section>`;
}

function renderLetter(appOrigin) {
  const { letter } = story;
  const paragraph = (text) => `<p>${text.includes(letter.highlight) ? emphasise(text, [letter.highlight], 'mark') : escapeHtml(text)}</p>`;
  return `<section class="tone-soft" ${chapterAttributes('la-thu', appOrigin)}>
    <div class="wrap letter-wrap">
      <aside class="letter-aside reveal">
        <img src="/mascots/turtle.webp" alt="" width="400" height="400" loading="lazy" decoding="async">
        <p class="eyebrow">${escapeHtml(letter.eyebrow)}</p>
        <h2>${escapeHtml(letter.title)}</h2>
      </aside>
      <article class="letter reveal">
        <p class="big">${escapeHtml(letter.opening)}</p>
        ${letter.beforeList.map(paragraph).join('')}
        ${letter.afterList.map(paragraph).join('')}
        <div class="sig"><b>${escapeHtml(letter.signature.name)}</b><span class="muted">${escapeHtml(letter.signature.role)} · ${escapeHtml(letter.signature.maker)}</span></div>
        <p class="ps"><b>${escapeHtml(letter.postscriptLabel)}</b> ${escapeHtml(letter.postscript)}</p>
      </article>
    </div>
    ${renderNext('la-thu')}
  </section>`;
}

/** Both cycles of one card; the section's data-pricing-cycle decides which shows. */
function renderPlanCard(tier, appOrigin, recommended) {
  const plan = pricingTiers[tier];
  const year = priceView(tier, 'year');
  const month = priceView(tier, 'month');
  const copy = story.pricing;
  const features = plan.features.map((feature) => {
    const [lead, rest] = feature.split(/:(.*)/s);
    const text = tier === 'pro_plus' && rest ? `<span><b>${escapeHtml(lead)}</b>:${escapeHtml(rest)}</span>` : escapeHtml(feature);
    return `<li>${smallTick}${text}</li>`;
  }).join('');
  const amounts = `<div class="amount" data-cycle="year">
          <div class="was"><span class="sr-only">Trả theo tháng cả năm: </span><s>${vnd(year.fullYearPrice)}</s></div>
          <div class="now"><strong>${vnd(year.price)}</strong><span>/ năm</span></div>
          <p class="per">≈ ${vnd(year.perMonth)} mỗi tháng · khoảng ${vnd(year.perDay)} mỗi ngày</p>
          <span class="saved">Tiết kiệm ${vnd(year.saving)} (${year.savingPercent}%)</span>
        </div>
        <div class="amount" data-cycle="month">
          <div class="now"><strong>${vnd(month.price)}</strong><span>/ tháng</span></div>
          <p class="per">khoảng ${vnd(month.perDay)} mỗi ngày</p>
          ${plan.purchasable ? `<button class="nudge" type="button" data-cycle-nudge>Trả theo năm tiết kiệm ${vnd(year.saving)} →</button>` : ''}
        </div>`;
  if (!plan.purchasable) {
    return `<article class="plan plan-soon" data-plan="${tier}">
        <span class="badge badge-soon">${escapeHtml(plan.status)}</span>
        <h3>${escapeHtml(plan.name)}</h3>
        <p class="for">${escapeHtml(plan.who)}</p>
        ${amounts}
        <ul>${features}</ul>
        <p class="soon-note">${escapeHtml(launchOffer.upcomingNote)}</p>
        <button class="btn btn-soon" type="button" disabled>${escapeHtml(copy.soonButton)}</button>
      </article>`;
  }
  const upgrade = tier === 'pro'
    ? `<p class="upgrade" data-cycle="year">Chỉ hơn ${escapeHtml(pricingTiers.solo.name)} ${vnd(upgradeDifference('year'))} mỗi năm, dùng cho tối đa 5 bé.</p><p class="upgrade" data-cycle="month">Chỉ hơn ${escapeHtml(pricingTiers.solo.name)} ${vnd(upgradeDifference('month'))} mỗi tháng, dùng cho tối đa 5 bé.</p>`
    : '';
  const buttonClass = recommended ? 'btn btn-primary' : 'btn btn-line';
  const checkout = (cycle) => appUrl(appOrigin, `/checkout?plan=${priceView(tier, cycle).planId}`);
  return `<article class="plan${recommended ? ' recommended' : ''}" data-plan="${tier}">
        <span class="badge">${escapeHtml(copy.recommendedBadge)}</span>
        <h3>${escapeHtml(plan.name)}</h3>
        <p class="for">${escapeHtml(plan.who)}</p>
        ${amounts}
        <ul>${features}</ul>
        ${upgrade}
        <a class="${buttonClass}" data-cycle="year" data-plan-cta href="${checkout('year')}">Chọn ${escapeHtml(plan.name)} · năm</a>
        <a class="${buttonClass}" data-cycle="month" data-plan-cta href="${checkout('month')}">Chọn ${escapeHtml(plan.name)} · tháng</a>
        <a class="month-link" data-cycle="year" href="${checkout('month')}">Hoặc trả theo tháng: ${vnd(month.price)}</a>
      </article>`;
}

/** The plans block, shared by the home page (as chapter 6) and /pricing/. */
function renderPlans(appOrigin, { home = false } = {}) {
  const copy = story.pricing;
  const recommendedTier = copy.kidsOptions[0].tier;
  const radio = (option, checked, attribute) => `<button type="button" role="radio" aria-checked="${checked}" tabindex="${checked ? 0 : -1}" data-value="${option.value}"${attribute}>`;
  const opening = home ? `<section class="pricing" ${chapterAttributes('gia', appOrigin)} aria-labelledby="gia-title" data-pricing-cycle="${copy.defaultCycle}">` : `<section class="pricing" id="gia" aria-labelledby="gia-title" data-pricing-cycle="${copy.defaultCycle}">`;
  return `${opening}
    <div class="wrap">
      <div class="price-head reveal">
        <p class="eyebrow">${home ? escapeHtml(copy.eyebrow) : 'Bảng giá'}</p>
        <h2 id="gia-title">${escapeHtml(copy.title)}</h2>
        <p class="lead">${escapeHtml(copy.lead)}</p>
      </div>
      <div class="controls reveal">
        <div class="control"><span id="kids-l">${escapeHtml(copy.kidsLabel)}</span>
          <div class="seg" role="radiogroup" aria-labelledby="kids-l" data-kids>${copy.kidsOptions.map((option, index) => `${radio(option, index === 0, ` data-tier="${option.tier}"`)}${escapeHtml(option.label)}</button>`).join('')}</div>
        </div>
        <div class="control"><span id="cycle-l">${escapeHtml(copy.cycleLabel)}</span>
          <div class="seg" role="radiogroup" aria-labelledby="cycle-l" data-cycle-toggle>${copy.cycleOptions.map((option) => `${radio(option, option.value === copy.defaultCycle, '')}${escapeHtml(option.label)}${option.value === 'year' ? ` <span class="save">đến -${maxSavingPercent}%</span>` : ''}</button>`).join('')}</div>
        </div>
      </div>
      <div class="offer reveal">
        <span class="offer-tag">${escapeHtml(launchOffer.tag)}</span>
        <p>${emphasise(launchOffer.text, ['10 gia đình đầu tiên', 'Gói Pro theo năm', 'nâng cấp miễn phí lên Pro Plus'])}</p>
        <span class="offer-left" data-offer-remaining data-app-origin="${escapeHtml(appOrigin)}" aria-live="polite"></span>
      </div>
      <div class="plans">
        ${Object.keys(pricingTiers).map((tier) => renderPlanCard(tier, appOrigin, tier === recommendedTier)).join('')}
      </div>
      <ul class="pledge reveal">${copy.pledge.map((item) => `<li><b>${escapeHtml(item.strong)}</b><span>${escapeHtml(item.text)}</span></li>`).join('')}</ul>
    </div>
  </section>`;
}

function renderStoryFaq(appOrigin, { home = false } = {}) {
  const opening = home ? `<section class="tone-soft" ${chapterAttributes('hoi-dap', appOrigin)} aria-labelledby="faq-title">` : '<section class="tone-soft" id="hoi-dap" aria-labelledby="faq-title">';
  return `${opening}
    ${renderSafety()}
    <div class="wrap faq-grid">
      <div class="reveal">
        <p class="eyebrow">${home ? escapeHtml(story.faq.eyebrow) : 'Hỏi đáp'}</p>
        <h2 id="faq-title">${escapeHtml(story.faq.title)}</h2>
      </div>
      <div class="faq reveal">${faqGroups.map((group) => `<div class="faq-group" role="group" aria-labelledby="faq-${group.id}"><h3 id="faq-${group.id}">${escapeHtml(group.title)}</h3>${group.items.map((item) => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join('')}</div>`).join('')}</div>
    </div>
  </section>`;
}

function renderSafety() {
  return `<div class="wrap"><div class="safety reveal" role="group" aria-labelledby="safety-title">
      <div class="safety-head"><h2 id="safety-title">${escapeHtml(safety.title)}</h2><p>${escapeHtml(safety.text)}</p><a class="story-link" href="/privacy/">${escapeHtml(safety.link)} <span aria-hidden="true">→</span></a></div>
      <ul class="safety-grid">${safety.points.map((point) => `<li class="safety-item"><span class="safety-icon">${icon(point.icon)}</span><div><b>${escapeHtml(point.title)}</b><p>${escapeHtml(point.text)}</p></div></li>`).join('')}</ul>
    </div></div>`;
}

function renderFinal(appOrigin) {
  const { final } = story;
  return `<section class="final" aria-labelledby="final-title">
    <div class="wrap reveal">
      <img src="/mascots/leo.webp" alt="" width="400" height="400" loading="lazy" decoding="async">
      <h2 id="final-title" data-final-title>${escapeHtml(final.title)}</h2>
      <p class="lead">${escapeHtml(final.text)}</p>
      <a class="btn btn-primary" data-guest href="${appUrl(appOrigin, '/start')}">${escapeHtml(final.cta)} ${arrow}</a><a class="btn btn-primary" data-member href="${appUrl(appOrigin, '/')}">Vào ứng dụng của gia đình ${arrow}</a>
    </div>
  </section>`;
}

function renderDock(appOrigin) {
  const [title, note, cta] = story.dock['mo-dau'];
  return `<div class="dock" data-dock data-guest hidden><p><span data-dock-title>${escapeHtml(title)}</span><small data-dock-note>${escapeHtml(note)}</small></p><a class="btn" data-dock-cta href="${appUrl(appOrigin, '/start')}">${escapeHtml(cta)}</a></div>`;
}

export function renderHome({ marketingOrigin, appOrigin, now = new Date() }) {
  const body = `<main id="noi-dung" class="story">
    ${renderStoryHero(appOrigin)}
    ${renderMorning(appOrigin)}
    ${renderTried(appOrigin)}
    ${renderMap(appOrigin)}
    ${renderDemo(appOrigin)}
    ${renderLetter(appOrigin)}
    ${renderFamilyQuotes({ now })}
    ${renderPlans(appOrigin, { home: true })}
    ${renderStoryFaq(appOrigin, { home: true })}
    ${renderFinal(appOrigin)}
  </main>
  ${renderDock(appOrigin)}`;
  return renderDocument({ title: 'KidHabit Hero | Bớt nhắc, để con tự làm việc nhỏ mỗi ngày', description: 'KidHabit giúp ba mẹ chọn thói quen hợp độ tuổi, giao việc rõ ràng và cùng con ghi nhận từng bước nhỏ mỗi ngày. Dùng thử 7 ngày, không cần thẻ.', path: '/', marketingOrigin, appOrigin, body, structuredData: renderStructuredData({ marketingOrigin, appOrigin }), header: renderStoryHeader(appOrigin) });
}

export function renderPricingPage({ marketingOrigin, appOrigin }) {
  const body = `<main id="noi-dung">${renderInfoHero({ slug: 'pricing', eyebrow: 'Bảng giá rõ ràng', title: 'Chọn gói hợp với nhà mình', lede: `${pricingTiers.solo.name} cho 1 bé hoặc ${pricingTiers.pro.name} cho tối đa 5 bé, trả theo tháng hay theo năm đều cùng quyền lợi. Không phí ẩn, không tự động gia hạn.`, mascot: 'bee' })}<div class="story">${renderPlans(appOrigin)}${renderStoryFaq(appOrigin)}</div></main>`;
  return renderDocument({ title: 'Bảng giá KidHabit Hero | Dùng thử 7 ngày', description: 'So sánh ba gói KidHabit cho một bé hoặc cả gia đình: giá rõ ràng, không phí ẩn, không tự động gia hạn và có 7 ngày dùng thử trước khi quyết định.', path: '/pricing/', marketingOrigin, appOrigin, body, structuredData: `${renderStructuredData({ marketingOrigin, appOrigin })}${renderPageStructuredData({ name: 'Bảng giá', description: 'So sánh ba gói KidHabit cho một bé hoặc cả gia đình.', path: '/pricing/', marketingOrigin, faqItems: faqs })}` });
}

// Articles end with the purchase call to action; legal pages, pricing and contact do not.
const articleSlugs = new Set(['roadmaps', 'docs']);

function renderContactNote(supportEmail) {
  if (!supportEmail) {
    return `<aside class="callout contact-note"><span class="icon-box">${icon('mail')}</span><p>Kênh email hỗ trợ chính thức sẽ được hiển thị trong ứng dụng sau khi cấu hình được phê duyệt.</p></aside>`;
  }
  const address = escapeHtml(supportEmail);
  return `<aside class="callout contact-note"><span class="icon-box">${icon('mail')}</span><p>Email hỗ trợ: <a href="mailto:${address}">${address}</a></p></aside>`;
}

const legalSlugs = new Set(['privacy', 'terms', 'gioi-thieu']);

function renderInlineText(text, supportEmail) {
  const escaped = escapeHtml(text);
  if (!supportEmail) return escaped;
  const address = escapeHtml(supportEmail);
  return escaped.replaceAll(address, `<a href="mailto:${address}">${address}</a>`);
}

function renderLegalBlocks(blocks, supportEmail) {
  return blocks.map((block) => (Array.isArray(block)
    ? `<ul>${block.map((item) => `<li>${renderInlineText(item, supportEmail)}</li>`).join('')}</ul>`
    : `<p>${renderInlineText(block, supportEmail)}</p>`)).join('');
}

const infoTabsBySlug = {
  framework: [['pricing', 'Bảng giá'], ['framework', 'Khung thói quen'], ['science', 'Cơ sở khoa học'], ['roadmaps', 'Lộ trình'], ['docs', 'Hướng dẫn'], ['blog', 'Blog'], ['contact', 'Liên hệ']],
  legal: [['privacy', 'Quyền riêng tư'], ['terms', 'Điều khoản'], ['gioi-thieu', 'Giới thiệu bạn bè'], ['contact', 'Liên hệ']],
};

function renderInfoTabs(slug) {
  const group = legalSlugs.has(slug) ? infoTabsBySlug.legal : infoTabsBySlug.framework;
  return `<nav class="info-tabs" aria-label="Các trang thông tin">${group.map(([target, label]) => `<a href="/${target}/"${target === slug ? ' aria-current="page"' : ''}>${escapeHtml(label)}</a>`).join('')}</nav>`;
}

export function renderInfoHero({ slug, eyebrow, title, lede, mascot }) {
  return `<section class="info-hero"><div class="shell info-hero-grid"><div class="info-hero-copy"><p class="eyebrow">${escapeHtml(eyebrow)}</p><h1>${escapeHtml(title)}</h1><p class="info-lede">${escapeHtml(lede)}</p>${renderInfoTabs(slug)}</div><div class="info-hero-art" aria-hidden="true"><img src="/mascots/${mascot}.webp" alt="" width="320" height="320" decoding="async"></div></div></section>`;
}

export function slugify(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function renderLegalPage({ slug, marketingOrigin, appOrigin, supportEmail }) {
  const page = buildLegalPages({ supportEmail })[slug];
  const anchors = page.sections.map((section, index) => `muc-${index + 1}-${slugify(section.title)}`);
  const sections = page.sections.map((section, index) => `<article id="${anchors[index]}"><h2>${escapeHtml(section.title)}</h2>${renderLegalBlocks(section.blocks, supportEmail)}</article>`).join('');
  const toc = `<nav class="legal-toc" aria-label="Mục lục"><p class="legal-toc-title">${icon('list-checks')}Trong trang này</p><ul>${page.sections.map((section, index) => `<li><a href="#${anchors[index]}">${escapeHtml(section.title)}</a></li>`).join('')}</ul></nav>`;
  const body = `<main id="noi-dung">${renderInfoHero({ slug, eyebrow: 'Minh bạch với ba mẹ', title: page.title, lede: page.description, mascot: 'leo' })}<section class="section info-body"><div class="shell legal-layout">${toc}<div class="legal-doc"><p class="legal-meta">${icon('clock')}Cập nhật lần cuối: ${legalUpdatedLabel}</p>${sections}</div></div></section></main>`;
  return renderDocument({ title: `${page.title} | KidHabit Hero`, description: page.description, path: `/${slug}/`, marketingOrigin, appOrigin, body, structuredData: renderPageStructuredData({ name: page.title, description: page.description, path: `/${slug}/`, marketingOrigin }) });
}

function shortCitation(source) {
  const year = source.citation.match(/\b(?:19|20)\d{2}\b/)?.[0] ?? '';
  return `${source.citation.split(/[ ,]/)[0]} ${year}`.trim();
}

function renderSciencePage({ marketingOrigin, appOrigin }) {
  const page = publicPages.science;
  const sourceById = new Map(scienceData.sources.map((source) => [source.id, source]));
  const toc = `<nav class="science-toc" aria-label="Các điều nên biết"><ul>${scienceData.principles.map((principle, index) => `<li><a href="#${principle.id}"><span>${String(index + 1).padStart(2, '0')}</span>${escapeHtml(principle.title)}</a></li>`).join('')}</ul></nav>`;
  const cards = scienceData.principles.map((principle, index) => {
    const sources = principle.sourceIds.map((id) => `<a href="#source-${id}">${escapeHtml(shortCitation(sourceById.get(id)))}</a>`).join('');
    return `<article id="${principle.id}" class="science-card">
      <header class="science-card-head"><span class="science-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><h3>${escapeHtml(principle.title)}</h3></header>
      <div class="science-block block-evidence"><h4>${icon('search')}Bằng chứng nói gì</h4><p>${escapeHtml(principle.evidence)}</p></div>
      <div class="science-block block-action"><h4>${icon('lightbulb')}Ba mẹ có thể làm gì</h4><p>${escapeHtml(principle.action)}</p></div>
      <div class="science-block block-limit"><h4>${icon('alert')}Giới hạn</h4><p>${escapeHtml(principle.limit)}</p></div>
      <p class="science-sources">${icon('file')}Nguồn: ${sources}</p>
    </article>`;
  }).join('');
  const unknowns = `<section class="science-unknowns" aria-labelledby="chua-biet"><span class="icon-box">${icon('compass')}</span><div><h2 id="chua-biet">Điều chúng tôi chưa biết</h2><p>Nghiên cứu về hình thành thói quen ở trẻ em còn ít. Đây là những điều chưa có câu trả lời chắc chắn, nên KidHabit coi các ngưỡng của mình là giả thuyết làm việc.</p><ul>${scienceData.unknowns.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div></section>`;
  const sources = `<section class="science-sources-list" aria-labelledby="nguon"><h2 id="nguon">${icon('file')}Nguồn</h2><ol>${scienceData.sources.map((source) => `<li id="source-${source.id}">${escapeHtml(source.citation)}${source.doi ? ` <a href="https://doi.org/${escapeHtml(source.doi)}" rel="noopener noreferrer">doi:${escapeHtml(source.doi)}</a>` : ''}</li>`).join('')}</ol></section>`;
  const body = `<main id="noi-dung">${renderInfoHero({ slug: 'science', eyebrow: page.eyebrow, title: page.title, lede: page.lede, mascot: 'turtle' })}
  <section class="section info-body"><div class="shell">
    <aside class="callout callout-note" role="note"><span class="icon-box">${icon('info')}</span><p>${escapeHtml(page.disclaimer)}</p></aside>
    <h2 class="science-heading">Bảy điều nên biết</h2>
    ${toc}
    <div class="science-grid">${cards}</div>
    ${unknowns}
    ${sources}
    ${renderArticleCta({ appOrigin, mascot: 'turtle' })}
  </div></section></main>`;
  return renderDocument({ title: `${page.title} | KidHabit Hero`, description: page.description, path: '/science/', marketingOrigin, appOrigin, body, structuredData: renderPageStructuredData({ name: page.title, description: page.description, path: '/science/', marketingOrigin }) });
}

// The call to action that closes every article: it leads to the plans so a reader who is convinced can buy,
// with the free trial as the softer second choice.
export function renderArticleCta({ appOrigin, mascot = 'leo', heading = 'Sẵn sàng cùng con bắt đầu?', text = 'Chọn gói phù hợp với gia đình hoặc dùng thử 7 ngày trước. Không cần thẻ, không tự động trừ tiền, hoàn tiền trong 30 ngày nếu chưa hài lòng.' }) {
  return `<aside class="post-cta article-cta" aria-labelledby="article-cta-title"><img src="/mascots/${mascot}.webp" alt="" width="120" height="120" loading="lazy" decoding="async"><div><h2 id="article-cta-title">${escapeHtml(heading)}</h2><p>${escapeHtml(text)}</p><div class="post-cta-actions"><a class="button" href="/pricing/">Chọn gói và mua ${icon('arrow')}</a><a class="text-link" href="${appUrl(appOrigin, '/start')}">Hoặc dùng thử 7 ngày ${icon('arrow')}</a></div></div></aside>`;
}

const frameworkFaqs = [
  {
    question: 'Có phải làm hết tất cả thói quen trong khung không?',
    answer: 'Không. Khung là thư viện để chọn, không phải danh sách bài tập phải hoàn thành. Nên bắt đầu với một đến ba việc cùng lúc, thêm việc mới khi con đã quen.',
  },
  {
    question: 'Con tôi không đúng tuổi của giai đoạn thì sao?',
    answer: 'Các mốc tuổi chỉ là gợi ý. Hãy chọn giai đoạn theo mức sẵn sàng của con: nếu một việc còn quá khó, lùi về giai đoạn trước; nếu con làm quá dễ, thử việc ở giai đoạn sau.',
  },
  {
    question: 'Khung có thay thế tư vấn của bác sĩ hay chuyên gia không?',
    answer: 'Không. KidHabit là công cụ đồng hành cho gia đình, không chẩn đoán và không hứa kết quả cho từng bé. Nếu lo lắng về sự phát triển của con, hãy hỏi bác sĩ, nhà tâm lý hoặc chuyên gia giáo dục.',
  },
  {
    question: 'Tôi có thể tự tạo thói quen ngoài khung không?',
    answer: 'Có. Khung giúp tiết kiệm thời gian, nhưng ba mẹ vẫn chọn, chỉnh sửa hoặc tự tạo nhiệm vụ theo nhu cầu thật của con.',
  },
];

function renderFrameworkPage({ marketingOrigin, appOrigin }) {
  const page = publicPages.framework;
  const habitCount = frameworkData.habits.length;
  const stageCount = frameworkData.stages.length;
  const youngest = frameworkData.stages[0].ageRange.split('-')[0];
  const oldest = frameworkData.stages.at(-1).ageRange.split('-')[1];
  const first = frameworkData.habits[0];
  const principles = [
    ['Không bắt đầu từ một danh sách dài', 'Một danh sách quá dài làm cả nhà nản ngay từ tuần đầu. Khung giúp ba mẹ chọn một đến ba việc vừa sức với tuổi của con, rồi tăng dần khi con đã quen.', 'list-checks'],
    ['Mỗi giai đoạn, vai trò của ba mẹ khác nhau', 'Với trẻ nhỏ, ba mẹ làm mẫu và mô tả. Với tuổi đi học, ba mẹ làm cùng và giám sát. Với thiếu niên, ba mẹ đồng hành và làm cố vấn. Mỗi giai đoạn bên dưới ghi rõ vai trò này.', 'users'],
    ['Việc nhỏ, nói bằng lời của con', `Mỗi thói quen có một câu mà con có thể hiểu, chẳng hạn ${first.childMeaning} Ba mẹ không phải tự nghĩ cách diễn giải từng việc.`, 'book'],
    ['Ba mẹ vẫn là người quyết định', 'Khung gợi ý để tiết kiệm thời gian. Ba mẹ chọn, điều chỉnh hoặc tự tạo nhiệm vụ dựa trên nhu cầu thật của con và nhịp sống của gia đình.', 'check'],
  ];
  const principleCards = principles.map(([title, text, glyph]) => `<li class="info-card"><span class="icon-box">${icon(glyph)}</span><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></div></li>`).join('');
  const stageNav = `<nav class="fw-stage-nav" aria-label="Các giai đoạn"><ul>${frameworkData.stages.map((stage) => `<li><a href="#${stage.id.toLowerCase()}"><strong>${escapeHtml(stage.ageRange)} tuổi</strong><span>${escapeHtml(stage.title)}</span></a></li>`).join('')}</ul></nav>`;
  // Parents get a picture of each stage and three examples, not the whole list: the full framework lives in the app.
  const stageStory = {
    GD1: { text: 'Bé học rằng thế giới an toàn và có người đáp lại mình. Ba mẹ làm mẫu và nói ra từng việc: nếp ngày êm, giấc ngủ, những lượt chơi cùng nhau.', pick: [0, 2, 5] },
    GD2: { text: 'Bé bắt đầu tự làm và tự chọn. Ba mẹ làm cùng và nhắc nhẹ: gọi tên cảm xúc, nói thật, giúp việc nhà, chia tiền thành ba phần.', pick: [0, 1, 8] },
    GD3: { text: 'Bé tập làm đều đặn và tự hào về việc mình hoàn thành. Ba mẹ theo dõi và cùng làm: học cách học, giữ một thói quen nhiều ngày, quản lý tiền nhỏ.', pick: [0, 1, 6] },
    GD4: { text: 'Bé tìm xem mình là ai và học điều hòa cảm xúc. Ba mẹ đồng hành và cùng tuân luật chung: tự đặt luật cho mình, giữ giờ ngủ, nhận trách nhiệm việc học.', pick: [1, 2, 7] },
    GD5: { text: 'Bé chuẩn bị tự lập: đặt hướng đi, chăm thân thể, quản lý tiền của mình và thử nghề. Ba mẹ làm cố vấn và hậu thuẫn.', pick: [1, 5, 9] },
  };
  const shortName = (name) => name.replace(/\s*[(—].*$/, '').trim();
  const stages = frameworkData.stages.map((stage, index) => {
    const habits = frameworkData.habits.filter((habit) => habit.stageId === stage.id);
    const story = stageStory[stage.id];
    const examples = story.pick.map((position) => habits[position]).filter(Boolean);
    const more = habits.length - examples.length;
    const items = examples.map((habit) => `<li class="fw-habit"><h4>${escapeHtml(shortName(habit.name))}</h4><p>${escapeHtml(habit.childMeaning)}</p></li>`).join('');
    return `<section class="fw-stage" id="${stage.id.toLowerCase()}" aria-labelledby="${stage.id.toLowerCase()}-title">
      <header class="fw-stage-head"><span class="fw-stage-age" aria-hidden="true">${escapeHtml(stage.ageRange)}</span><div><p class="eyebrow">Giai đoạn ${index + 1} · ${escapeHtml(stage.ageRange)} tuổi</p><h3 id="${stage.id.toLowerCase()}-title">${escapeHtml(stage.title)}</h3><p class="fw-stage-role"><strong>Vai trò của ba mẹ:</strong> ${escapeHtml(stage.adultRole)}</p></div></header>
      <p class="fw-stage-story">${escapeHtml(story.text)}</p>
      <p class="fw-examples-label">Ví dụ về những việc con sẽ nghe:</p>
      <ul class="fw-habits">${items}</ul>
      ${more > 0 ? `<p class="fw-more">Và ${more} thói quen khác trong giai đoạn này, xem đầy đủ trong ứng dụng.</p>` : ''}
    </section>`;
  }).join('');
  const howSteps = [
    ['Chọn giai đoạn theo mức sẵn sàng', 'Bắt đầu từ giai đoạn gần với tuổi của con. Nếu việc quá khó, lùi một bước; nếu quá dễ, thử việc ở giai đoạn sau.'],
    ['Chọn một thói quen', 'Mở khung trong ứng dụng, chọn một việc có thể hoàn thành trong vài phút và thêm vào gia đình. Tên việc và hướng dẫn hiện theo ngôn ngữ ba mẹ đang đọc.'],
    ['Thống nhất cách ghi nhận với con', 'Cùng con chọn tín hiệu nhắc, cách ghi nhận bằng sao và phần thưởng nhỏ trước khi bắt đầu, để con biết điều gì sẽ xảy ra.'],
    ['Nhìn lại cuối tuần và điều chỉnh', 'Xem con đã làm được gì, khen đúng việc cụ thể, rồi chỉnh độ khó hoặc thêm một việc mới khi con đã vững.'],
  ];
  const howList = `<ol class="info-cards step-list how-steps">${howSteps.map(([title, text], index) => `<li class="info-card"><span class="step-number" aria-hidden="true">${index + 1}</span><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></div></li>`).join('')}</ol>`;
  const faq = `<div class="fw-faq">${frameworkFaqs.map((item) => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join('')}</div>`;
  const body = `<main id="noi-dung">${renderInfoHero({ slug: 'framework', eyebrow: page.eyebrow, title: page.title, lede: `Bộ khung gồm ${habitCount} thói quen cho trẻ từ ${youngest} đến ${oldest} tuổi, chia thành ${stageCount} giai đoạn. Mỗi thói quen là một việc nhỏ, nói bằng lời của con. Ba mẹ không cần làm hết: chọn một việc vừa sức rồi tăng dần.`, mascot: page.mascot })}
  <section class="section info-body"><div class="shell">
    <h2 class="fw-heading">Khung được thiết kế như thế nào</h2>
    <ul class="info-cards">${principleCards}</ul>
    <h2 class="fw-heading">${stageCount} giai đoạn, ${habitCount} thói quen</h2>
    <p class="fw-lede">Chọn giai đoạn gần nhất với con để hình dung việc nhỏ nào hợp với tuổi. Nội dung do KidHabit tổng hợp để gợi ý, không phải chuẩn phát triển chính thức.</p>
    ${stageNav}
    <div class="fw-stages">${stages}</div>
    <h2 class="fw-heading">Cách bắt đầu với khung</h2>
    ${howList}
    <h2 class="fw-heading">Câu hỏi thường gặp</h2>
    ${faq}
    <aside class="callout callout-note" role="note"><span class="icon-box">${icon('info')}</span><p>KidHabit là công cụ đồng hành cho gia đình. Chúng tôi không hứa kết quả cho từng em bé và không thay thế tư vấn của bác sĩ, nhà tâm lý hay chuyên gia giáo dục.</p></aside>
    ${renderArticleCta({ appOrigin, mascot: page.mascot })}
  </div></section></main>`;
  return renderDocument({ title: `${page.title} | KidHabit Hero`, description: page.description, path: '/framework/', marketingOrigin, appOrigin, body, structuredData: renderPageStructuredData({ name: page.title, description: page.description, path: '/framework/', marketingOrigin, faqItems: frameworkFaqs }) });
}

export function renderInfoPage({ slug, marketingOrigin, appOrigin, supportEmail }) {
  if (legalSlugs.has(slug)) return renderLegalPage({ slug, marketingOrigin, appOrigin, supportEmail });
  if (slug === 'science') return renderSciencePage({ marketingOrigin, appOrigin });
  if (slug === 'framework') return renderFrameworkPage({ marketingOrigin, appOrigin });
  const page = publicPages[slug];
  const isSteps = page.layout === 'steps';
  const items = page.sections.map(([title, text], index) => {
    const badge = isSteps ? `<span class="step-number" aria-hidden="true">${index + 1}</span>` : `<span class="icon-box">${icon(page.icons[index] ?? 'check')}</span>`;
    return `<li class="info-card">${badge}<div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(text)}</p></div></li>`;
  }).join('');
  const list = isSteps ? `<ol class="info-cards step-list">${items}</ol>` : `<ul class="info-cards">${items}</ul>`;
  const extra = slug === 'contact' ? renderContactNote(supportEmail) : (articleSlugs.has(slug) ? renderArticleCta({ appOrigin, mascot: page.mascot ?? 'leo' }) : '');
  const body = `<main id="noi-dung">${renderInfoHero({ slug, eyebrow: page.eyebrow, title: page.title, lede: page.description, mascot: page.mascot })}<section class="section info-body"><div class="shell">${list}${extra}</div></section></main>`;
  return renderDocument({ title: `${page.title} | KidHabit Hero`, description: page.description, path: `/${slug}/`, marketingOrigin, appOrigin, body, structuredData: renderPageStructuredData({ name: page.title, description: page.description, path: `/${slug}/`, marketingOrigin }) });
}
