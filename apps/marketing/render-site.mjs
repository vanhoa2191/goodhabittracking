import { buildLegalPages, legalUpdatedLabel } from './legal-content.mjs';
import { sessionHintCookie } from './session-hint.mjs';
import scienceData from '../../src/data/science-content.json' with { type: 'json' };
import frameworkData from '../../src/data/habit-framework-v1.vi.json' with { type: 'json' };
import { comparison, faqs, features, mascots, navigation, outcomes, plans, publicPages, safetyPoints, steps, testimonials, trustBar, trustPoints } from './site-content.mjs';

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

function planTitle(plan) {
  return plan.period ? `${plan.name} · ${plan.period}` : plan.name;
}

function yearlySaving() {
  const monthly = plans.find((plan) => plan.id === 'monthly');
  const yearly = plans.find((plan) => plan.id === 'yearly');
  if (!monthly || !yearly) return null;
  return { perMonth: Math.round(yearly.amount / 12), saved: monthly.amount * 12 - yearly.amount };
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
    offers: plans.map((plan) => ({
      '@type': 'Offer',
      name: planTitle(plan),
      price: String(plan.amount),
      priceCurrency: 'VND',
      url: appUrl(appOrigin, `/checkout?plan=${plan.id}`),
      availability: 'https://schema.org/InStock',
    })),
  };
  return `<script type="application/ld+json">${JSON.stringify(data).replaceAll('<', '\\u003c')}</script>`;
}

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

export function renderDocument({ title, description, path, marketingOrigin, appOrigin, body, structuredData = '', ogType = 'website', extraHead = '' }) {
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
  <meta property="og:image:alt" content="Từng thói quen nhỏ vẽ nên chân dung tốt đẹp của con, cùng Leo và KidHabit Hero">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${shareImage}">
  <meta name="theme-color" content="#4f46e5">
  <link rel="icon" href="/logo.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700&family=Nunito+Sans:opsz,wght@6..12,400;6..12,600;6..12,700;6..12,800&display=swap&subset=vietnamese" rel="stylesheet">
  <script>if(document.cookie.split('; ').indexOf('${sessionHintCookie}=1')>-1)document.documentElement.classList.add('is-member')</script>
  <link rel="stylesheet" href="/styles.css">
  <script src="/client.js" defer></script>
  ${extraHead}
  ${structuredData}
</head>
<body>
  <a class="skip-link" href="#noi-dung">Bỏ qua điều hướng</a>
  ${renderHeader(appOrigin)}
  ${body}
  ${renderFooter(appOrigin)}
</body>
</html>`;
}

function renderPricing(appOrigin, heading = 'Chọn gói phù hợp với gia đình') {
  const saving = yearlySaving();
  return `<section class="section pricing-section" id="bang-gia" aria-labelledby="pricing-title"><div class="shell">
    <div class="pricing-heading"><div><p class="eyebrow">7 ngày trải nghiệm đầy đủ</p><h2 id="pricing-title">${heading}</h2><p>Không cần thẻ tín dụng. Không tự động trừ tiền. Hoàn tiền trong 30 ngày nếu chưa hài lòng.</p></div><a class="text-link" href="/terms/">Xem điều khoản ${icon('arrow')}</a></div>
    <div class="pricing-grid">${plans.map((plan) => `<article class="price-card${plan.featured ? ' price-card-featured' : ''}" data-plan="${plan.id}" data-spotlight>
      <div class="plan-top"><p class="plan-label">${plan.label}</p><h3>${planTitle(plan)}</h3><p>${plan.summary}</p></div>
      <p class="price"><strong>${plan.price}</strong><span>VNĐ ${plan.cadence}</span></p>${plan.id === 'yearly' && saving ? `
      <p class="price-saving">Tương đương ${formatVnd(saving.perMonth)} VNĐ/tháng. Tiết kiệm ${formatVnd(saving.saved)} VNĐ so với trả theo tháng.</p>` : ''}
      <ul>${plan.features.map((feature) => `<li>${icon('check')}<span>${feature}</span></li>`).join('')}</ul>
      <a class="button ${plan.featured ? 'button-primary' : 'button-secondary'}" href="${appUrl(appOrigin, `/checkout?plan=${plan.id}`)}">${plan.cta} ${icon('arrow')}</a>
    </article>`).join('')}</div>
    <p class="pricing-note">Gói đăng ký gắn với gia đình trong tài khoản phụ huynh. Sau khi đăng nhập, bạn có thể tiếp tục thanh toán mà không phải chọn lại gói.</p>
  </div></section>`;
}

function renderCompanions() {
  return `<section class="section companions" aria-labelledby="companions-title"><div class="shell">
    <div class="section-heading section-heading-center"><p class="eyebrow">Người bạn đồng hành</p><h2 id="companions-title">Mỗi bé chọn một người bạn đồng hành</h2><p>Bé chọn nhân vật mình thích để cùng làm nhiệm vụ, nhận lời khen và đổi phần thưởng mà ba mẹ đã thống nhất.</p></div>
    <ul class="companion-grid">${mascots.map((mascot) => `<li class="companion-card" data-spotlight><img class="companion-image" src="/mascots/${mascot.id}.webp" alt="${mascot.name}, chú ${mascot.species} đồng hành cùng bé" width="400" height="400" loading="lazy" decoding="async"><strong>${mascot.name}</strong><span>${mascot.trait}</span></li>`).join('')}</ul>
  </div></section>`;
}

function renderFaq() {
  return `<section class="section faq-section" aria-labelledby="faq-title"><div class="shell faq-layout"><div><h2 id="faq-title">Điều ba mẹ thường hỏi</h2><p>Nếu cần thêm trợ giúp, hãy xem hướng dẫn hoặc liên hệ với KidHabit.</p><a class="text-link" href="/docs/">Xem hướng dẫn ${icon('arrow')}</a></div><div class="faq-list">${faqs.map((item) => `<details><summary>${item.question}</summary><p>${item.answer}</p></details>`).join('')}</div></div></section>`;
}

const growthStages = [
  ['0–3', 'Làm mẫu và đồng hành'],
  ['3–6', 'Làm cùng con'],
  ['6–12', 'Con tự chọn dần'],
  ['12–15', 'Con chủ động hơn'],
  ['15–18', 'Con tự làm chủ'],
];

const growthPoints = [
  ['book', 'Mỗi thói quen có lời giải thích', 'Con hiểu vì sao mình làm việc đó, còn ba mẹ biết cách đồng hành cho đúng lúc.'],
  ['trend-up', 'Việc nhỏ, lặp lại mỗi ngày', 'Những việc vừa sức, làm đều đặn, dần trở thành nếp thay vì một lần cố gắng rồi bỏ.'],
  ['users', 'Ba mẹ luôn là người quyết định', 'Ba mẹ chọn, điều chỉnh hoặc tự tạo thói quen cho phù hợp với con và nhịp sống của gia đình.'],
];

function renderPortraits() {
  return `<section class="section growth" id="chan-dung" aria-labelledby="growth-title"><div class="shell">
    <div class="section-heading section-heading-center"><p class="eyebrow">Giáo dục con qua thói quen</p><h2 id="growth-title">Mỗi thói quen là một nét vẽ nên chân dung của con</h2><p><strong>Chân dung</strong> là hình ảnh con lớn lên: tự tin, tử tế và làm chủ cuộc sống của mình. KidHabit không chỉ đếm việc đã làm, mà giúp ba mẹ chọn những thói quen nhỏ phù hợp với từng độ tuổi để dần vẽ nên hình ảnh ấy.</p></div>
    <ol class="growth-stages" aria-label="Năm giai đoạn từ 0 đến 18 tuổi">${growthStages.map(([age, label]) => `<li><span class="growth-age">${age}<small>tuổi</small></span><span>${label}</span></li>`).join('')}</ol>
    <ul class="growth-points">${growthPoints.map(([name, title, text]) => `<li><span class="icon-box">${icon(name)}</span><div><h3>${title}</h3><p>${text}</p></div></li>`).join('')}</ul>
    <p class="growth-cta"><a class="text-link" href="/framework/">Xem khung thói quen ${icon('arrow')}</a></p>
    <p class="growth-note">Chân dung là hướng trưởng thành, không phải nhãn tính cách hay điểm số cho con. KidHabit là công cụ đồng hành cùng gia đình và không cam kết một kết quả phát triển cụ thể.</p>
  </div></section>`;
}

function renderTrustBar() {
  return `<section class="trust-bar" aria-label="Vì sao ba mẹ yên tâm"><div class="shell"><ul class="trust-bar-list">${trustBar.map((item) => `<li>${icon(item.icon)}<div><strong>${item.title}</strong><span>${item.text}</span></div></li>`).join('')}</ul></div></section>`;
}

function renderComparison() {
  const list = (items, name) => `<ul>${items.map((item) => `<li>${icon(name === 'before' ? 'x' : 'check')}<span>${item}</span></li>`).join('')}</ul>`;
  return `<section class="section shift" aria-labelledby="shift-title"><div class="shell">
    <div class="section-heading section-heading-center"><p class="eyebrow">Từ nhắc nhở đến tự giác</p><h2 id="shift-title">Nhắc mãi không phải cách duy nhất</h2><p>Khi con hiểu việc cần làm và thấy mình tiến bộ, ba mẹ không phải đóng vai người nhắc suốt ngày.</p></div>
    <div class="compare-grid">
      <article class="compare-card compare-before" data-spotlight><h3>${comparison.beforeTitle}</h3>${list(comparison.before, 'before')}</article>
      <article class="compare-card compare-after" data-spotlight><h3>${comparison.afterTitle}</h3>${list(comparison.after, 'after')}</article>
    </div>
  </div></section>`;
}

function renderSteps() {
  return `<section class="section steps" id="cach-hoat-dong" aria-labelledby="steps-title"><div class="shell">
    <div class="section-heading section-heading-center"><p class="eyebrow">Cách KidHabit hoạt động</p><h2 id="steps-title">Từ việc nhỏ đến thói quen, chỉ ba bước</h2><p>Ba mẹ dẫn đường, con thực hành, cả nhà cùng ghi nhận tiến bộ thay vì chỉ nhắc lỗi.</p></div>
    <ol class="step-list">${steps.map((step, index) => `<li class="step">
      <div class="step-copy"><span class="step-number" aria-hidden="true">${index + 1}</span><h3>${outcomes[index].title}</h3><p>${outcomes[index].description}</p><ul>${step.bullets.map((bullet) => `<li>${icon('check')}<span>${bullet}</span></li>`).join('')}</ul></div>
      <figure class="step-figure"><div class="phone" data-tilt><img src="/screens/${step.image}.webp" alt="${step.alt}" width="600" height="1298" loading="lazy" decoding="async"></div><figcaption>${step.caption} <small>Ảnh chụp từ bản demo, dữ liệu mẫu.</small></figcaption></figure>
    </li>`).join('')}</ol>
  </div></section>`;
}

function renderFeatures() {
  return `<section class="section features" aria-labelledby="features-title"><div class="shell">
    <div class="section-heading section-heading-center"><p class="eyebrow">Mọi thứ ba mẹ cần</p><h2 id="features-title">Đủ đơn giản để dùng mỗi ngày</h2></div>
    <ul class="feature-grid">${features.map((feature) => `<li class="feature-card" data-spotlight><span class="icon-box">${icon(feature.icon)}</span><h3>${feature.title}</h3><p>${feature.text}</p></li>`).join('')}</ul>
  </div></section>`;
}

function renderSafety() {
  return `<section class="section safety" aria-labelledby="safety-title"><div class="shell safety-layout">
    <div class="safety-intro"><p class="eyebrow">An tâm cho cả nhà</p><h2 id="safety-title">Ba mẹ nắm quyền, con được bảo vệ</h2><p>KidHabit chỉ lưu những gì cần để vận hành thói quen của gia đình, và luôn để ba mẹ quyết định.</p><a class="text-link" href="/privacy/">Đọc chính sách quyền riêng tư ${icon('arrow')}</a></div>
    <ul class="safety-list">${safetyPoints.map((point) => `<li>${icon(point.icon)}<div><h3>${point.title}</h3><p>${point.text}</p></div></li>`).join('')}</ul>
  </div></section>`;
}

export function selectPublishableTestimonials(list, now = new Date()) {
  return list.filter((item) => item
    && typeof item.quote === 'string' && item.quote.trim()
    && typeof item.name === 'string' && item.name.trim()
    && item.consent === true
    && typeof item.source === 'string' && item.source.trim()
    && item.reviewBy && new Date(item.reviewBy).getTime() > now.getTime());
}

function renderEarlyFamilies({ supportEmail, now }) {
  const proof = selectPublishableTestimonials(testimonials, now);
  if (proof.length) {
    return `<section class="section early" aria-labelledby="early-title"><div class="shell">
      <div class="section-heading section-heading-center"><p class="eyebrow">Gia đình nói gì</p><h2 id="early-title">Những gia đình đang dùng KidHabit</h2></div>
      <ul class="quote-grid">${proof.map((item) => `<li class="quote-card" data-spotlight><blockquote>${escapeHtml(item.quote)}</blockquote><p><strong>${escapeHtml(item.name)}</strong>${item.role ? `<span>${escapeHtml(item.role)}</span>` : ''}</p></li>`).join('')}</ul>
    </div></section>`;
  }
  const subject = encodeURIComponent('[KidHabit] Gia đình dùng thử đầu tiên');
  const href = supportEmail ? `mailto:${escapeHtml(supportEmail)}?subject=${subject}` : '/contact/';
  return `<section class="section early" aria-labelledby="early-title"><div class="shell early-card">
    <div class="early-copy"><p class="eyebrow">Chương trình gia đình đầu tiên</p><h2 id="early-title">Cùng xây KidHabit với những gia đình đầu tiên</h2><p>KidHabit đang được hoàn thiện cùng một nhóm nhỏ gia đình dùng thật. Chúng tôi lắng nghe góp ý thẳng thắn và chỉ đăng lời nhận xét khi gia đình đồng ý.</p><a class="button button-primary" href="${href}">${icon('mail')} Tham gia chương trình</a></div>
    <img class="early-mascot" src="/mascots/bunny.webp" alt="" width="400" height="400" loading="lazy" decoding="async">
  </div></section>`;
}

function renderStickyCta(appOrigin) {
  return `<div class="sticky-cta" data-sticky-cta data-guest hidden><div class="shell sticky-cta-inner"><p><strong>Dùng thử 7 ngày</strong><span>Không cần thẻ. Hoàn tiền 30 ngày.</span></p><a class="button button-primary" href="${appUrl(appOrigin, '/start')}">Bắt đầu ${icon('arrow')}</a></div></div>`;
}

export function renderHome({ marketingOrigin, appOrigin, supportEmail = '', now = new Date() }) {
  const body = `<main id="noi-dung">
    <section class="hero" data-hero><div class="shell hero-grid">
      <div class="hero-copy"><p class="hero-kicker">Ứng dụng đồng hành giáo dục con qua thói quen</p><h1>Từng thói quen nhỏ vẽ nên chân dung tốt đẹp của con</h1><p class="hero-lead">Mỗi việc nhỏ con làm hôm nay góp thêm một nét cho chân dung con muốn trở thành, để con trưởng thành tự tin, tử tế và làm chủ cuộc sống. Ba mẹ dẫn đường, con thực hành cùng một người bạn đồng hành.</p><div class="hero-actions"><a class="button button-primary" data-guest data-magnetic href="${appUrl(appOrigin, '/start')}">Dùng thử 7 ngày ${icon('arrow')}</a><a class="button button-quiet" data-guest href="${appUrl(appOrigin, '/?demo=1')}">Xem bản demo</a><a class="button button-primary" data-member data-magnetic href="${appUrl(appOrigin, '/')}">Vào ứng dụng của gia đình ${icon('arrow')}</a></div><ul class="trust-points" aria-label="Cam kết khi bắt đầu">${trustPoints.map((point) => `<li>${icon('check')}<span>${point}</span></li>`).join('')}</ul></div>
      <div class="hero-visual">
        <div class="phone phone-hero" data-tilt><img class="phone-screen" src="/screens/kid-home.webp" alt="Màn hình của bé trong KidHabit: nhân vật Leo, 120 sao, 3 huy hiệu và tiến độ 3 trên 6 việc hôm nay" width="600" height="1298" fetchpriority="high"></div>
        <img class="hero-mascot" src="/mascots/leo.webp" alt="Leo, chú sư tử nhỏ vẫy tay chào bé" width="400" height="400" fetchpriority="high">
        <span class="float-chip float-chip-stars">${icon('star')} 120 sao</span>
        <span class="float-chip float-chip-review">${icon('shield')} Chờ bố mẹ duyệt</span>
      </div>
    </div></section>
    ${renderTrustBar()}
    ${renderPortraits()}
    ${renderComparison()}
    ${renderSteps()}
    ${renderFeatures()}
    ${renderCompanions()}
    ${renderSafety()}
    ${renderEarlyFamilies({ supportEmail, now })}
    ${renderPricing(appOrigin)}
    ${renderFaq()}
    <section class="final-cta"><div class="shell final-cta-inner"><div><h2>Bắt đầu với một việc nhỏ hôm nay</h2><p>Thiết lập hồ sơ đầu tiên, chọn thói quen phù hợp và để con tự hoàn thành bước tiếp theo.</p><p class="final-cta-note">7 ngày dùng thử, không cần thẻ, hoàn tiền trong 30 ngày.</p></div><div class="final-cta-actions"><a class="button button-light" data-guest data-magnetic href="${appUrl(appOrigin, '/start')}">Bắt đầu cùng con ${icon('arrow')}</a><a class="text-link text-link-light" data-guest href="${appUrl(appOrigin, '/?demo=1')}">Xem bản demo trước</a><a class="button button-light" data-member data-magnetic href="${appUrl(appOrigin, '/')}">Vào ứng dụng của gia đình ${icon('arrow')}</a></div><img class="final-mascot" src="/mascots/leo.webp" alt="" width="400" height="400" loading="lazy" decoding="async"></div></section>
    ${renderStickyCta(appOrigin)}
  </main>`;
  return renderDocument({ title: 'KidHabit Hero | Giáo dục con qua thói quen mỗi ngày', description: 'KidHabit giúp ba mẹ chọn thói quen hợp độ tuổi, giao việc rõ ràng và cùng con ghi nhận từng bước nhỏ mỗi ngày. Dùng thử 7 ngày, không cần thẻ.', path: '/', marketingOrigin, appOrigin, body, structuredData: renderStructuredData({ marketingOrigin, appOrigin }) });
}

export function renderPricingPage({ marketingOrigin, appOrigin }) {
  const body = `<main id="noi-dung">${renderInfoHero({ slug: 'pricing', eyebrow: 'Bảng giá rõ ràng', title: 'Chọn nhịp đồng hành phù hợp', lede: 'Ba gói trả phí, không có phí ẩn và không tự động gia hạn.', mascot: 'bee' })}${renderPricing(appOrigin, 'Ba lựa chọn, một hành trình rõ ràng')}${renderFaq()}</main>`;
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
      <div class="science-block block-action"><h4>${icon('lightbulb')}Bạn có thể làm gì</h4><p>${escapeHtml(principle.action)}</p></div>
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
  const body = `<main id="noi-dung">${renderInfoHero({ slug: 'framework', eyebrow: page.eyebrow, title: page.title, lede: `Bộ khung gồm ${habitCount} thói quen cho trẻ từ ${youngest} đến ${oldest} tuổi, chia thành ${stageCount} giai đoạn. Mỗi thói quen là một việc nhỏ, nói bằng lời của con. Bạn không cần làm hết: chọn một việc vừa sức rồi tăng dần.`, mascot: page.mascot })}
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
