import { buildLegalPages, legalUpdatedLabel } from './legal-content.mjs';
import { buildPortraitGuide, summitId } from './portraits.mjs';
import { sessionHintCookie } from './session-hint.mjs';
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

function icon(name, className = '') {
  return `<svg class="icon ${className}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
}

function appUrl(appOrigin, path) {
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
    description: 'Ứng dụng đồng hành giáo dục con qua thói quen: mỗi việc nhỏ gắn với một trong 16 chân dung trưởng thành.',
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
      <div><h2>Sản phẩm</h2><a href="/framework/">Khung thói quen</a><a href="/roadmaps/">Lộ trình</a><a href="/pricing/">Bảng giá</a></div>
      <div><h2>Hỗ trợ</h2><a href="/docs/">Hướng dẫn</a><a href="/contact/">Liên hệ</a><a href="${appUrl(appOrigin, '/')}">Đăng nhập ứng dụng</a></div>
      <div><h2>Thông tin</h2><a href="/privacy/">Quyền riêng tư</a><a href="/terms/">Điều khoản</a></div>
    </div>
    <div class="shell footer-bottom"><p>© 2026 KidHabit Hero.</p><p>Dành cho ba mẹ và những người lớn đồng hành cùng trẻ.</p></div>
  </footer>`;
}

function renderDocument({ title, description, path, marketingOrigin, appOrigin, body, structuredData = '' }) {
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
  <meta property="og:type" content="website">
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

function renderPortraitDetail(portrait, { active = false } = {}) {
  const example = portrait.example;
  const isSummit = portrait.id === summitId;
  return `<article class="portrait-detail" data-portrait-detail="${portrait.id}"${active ? '' : ' hidden'}>
    <p class="portrait-detail-kicker">${isSummit ? 'Đích tổng hợp' : `Chân dung ${portrait.code}`}</p>
    <h3>${escapeHtml(portrait.name)}</h3>
    ${example ? `<p class="portrait-detail-habit"><span>Thói quen tiêu biểu · ${escapeHtml(example.stage)}</span><strong>${escapeHtml(example.name)}</strong></p>
    <blockquote>${escapeHtml(example.meaning)}</blockquote>` : ''}
    <p class="portrait-detail-count">${portrait.habitCount} thói quen trong khung hướng tới chân dung này.</p>
  </article>`;
}

function renderPortraits() {
  const guide = buildPortraitGuide();
  const summit = guide.portraits.find((portrait) => portrait.id === summitId);
  const others = guide.portraits.filter((portrait) => portrait.id !== summitId);
  return `<section class="section portraits" id="chan-dung" aria-labelledby="portraits-title"><div class="shell">
    <div class="section-heading section-heading-center"><p class="eyebrow">Giáo dục con qua thói quen</p><h2 id="portraits-title">Mỗi thói quen là một nét vẽ nên chân dung của con</h2><p>KidHabit không chỉ đếm việc đã làm. ${guide.habitCount} thói quen của khung, chia thành ${guide.stageCount} giai đoạn từ 0 đến 18 tuổi, đều gắn với các chân dung trong bản đồ ${guide.portraits.length} chân dung, để con lớn lên tự tin, tử tế và làm chủ cuộc sống.</p></div>
    <div class="portrait-explorer" data-portrait-explorer>
      <div class="portrait-panel" aria-live="polite" data-portrait-panel>${guide.portraits.map((portrait) => renderPortraitDetail(portrait, { active: portrait.id === summitId })).join('')}</div>
      <div class="portrait-map">
        <button type="button" class="portrait-summit" data-portrait="${summit.id}" data-spotlight aria-pressed="true"><span class="portrait-code">${summit.code}</span><span class="portrait-name">${escapeHtml(summit.name)}</span><small>Đích tổng hợp của cả hành trình</small></button>
        <ul class="portrait-grid">${others.map((portrait) => `<li><button type="button" class="portrait-chip" data-portrait="${portrait.id}" data-spotlight aria-pressed="false"><span class="portrait-code">${portrait.code}</span><span class="portrait-name">${escapeHtml(portrait.name)}</span></button></li>`).join('')}</ul>
      </div>
    </div>
    <p class="portrait-note">Chân dung là hướng trưởng thành, không phải nhãn tính cách hay điểm số cho con. KidHabit là công cụ đồng hành cùng gia đình và không cam kết một kết quả phát triển cụ thể.</p>
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
      <div class="hero-copy"><p class="hero-kicker">Ứng dụng đồng hành giáo dục con qua thói quen</p><h1>Từng thói quen nhỏ vẽ nên chân dung tốt đẹp của con</h1><p class="hero-lead">Mỗi việc nhỏ con làm hôm nay gắn với một chân dung trong bản đồ 16 chân dung, để con trưởng thành tự tin, tử tế và làm chủ cuộc sống. Ba mẹ dẫn đường, con thực hành cùng một người bạn đồng hành.</p><div class="hero-actions"><a class="button button-primary" data-guest data-magnetic href="${appUrl(appOrigin, '/start')}">Dùng thử 7 ngày ${icon('arrow')}</a><a class="button button-quiet" data-guest href="${appUrl(appOrigin, '/?demo=1')}">Xem bản demo</a><a class="button button-primary" data-member data-magnetic href="${appUrl(appOrigin, '/')}">Vào ứng dụng của gia đình ${icon('arrow')}</a></div><ul class="trust-points" aria-label="Cam kết khi bắt đầu">${trustPoints.map((point) => `<li>${icon('check')}<span>${point}</span></li>`).join('')}</ul></div>
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
  return renderDocument({ title: 'KidHabit Hero | Giáo dục con qua thói quen mỗi ngày', description: 'KidHabit là ứng dụng đồng hành giáo dục con qua thói quen: mỗi việc nhỏ gắn với một trong 16 chân dung trưởng thành, để ba mẹ biết nên rèn gì và con tự giác làm mỗi ngày.', path: '/', marketingOrigin, appOrigin, body, structuredData: renderStructuredData({ marketingOrigin, appOrigin }) });
}

export function renderPricingPage({ marketingOrigin, appOrigin }) {
  const body = `<main id="noi-dung"><section class="page-hero"><div class="shell"><p class="eyebrow">Bảng giá rõ ràng</p><h1>Chọn nhịp đồng hành phù hợp</h1><p>Ba gói trả phí, không có phí ẩn và không tự động gia hạn.</p></div></section>${renderPricing(appOrigin, 'Ba lựa chọn, một hành trình rõ ràng')}${renderFaq()}</main>`;
  return renderDocument({ title: 'Bảng giá KidHabit Hero', description: 'So sánh các gói KidHabit cho một bé hoặc cả gia đình.', path: '/pricing/', marketingOrigin, appOrigin, body, structuredData: renderStructuredData({ marketingOrigin, appOrigin }) });
}

function renderContactNote(supportEmail) {
  if (!supportEmail) {
    return '<p class="shell contact-note">Kênh email hỗ trợ chính thức sẽ được hiển thị trong ứng dụng sau khi cấu hình được phê duyệt.</p>';
  }
  const address = escapeHtml(supportEmail);
  return `<p class="shell contact-note">Email hỗ trợ: <a href="mailto:${address}">${address}</a></p>`;
}

const legalSlugs = new Set(['privacy', 'terms']);

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

function renderLegalPage({ slug, marketingOrigin, appOrigin, supportEmail }) {
  const page = buildLegalPages({ supportEmail })[slug];
  const sections = page.sections.map((section) => `<article><h2>${escapeHtml(section.title)}</h2>${renderLegalBlocks(section.blocks, supportEmail)}</article>`).join('');
  const body = `<main id="noi-dung"><section class="page-hero"><div class="shell"><h1>${escapeHtml(page.title)}</h1><p>${escapeHtml(page.description)}</p></div></section><section class="section info-page"><div class="shell"><p class="legal-meta">Cập nhật lần cuối: ${legalUpdatedLabel}</p><div class="legal-doc">${sections}</div></div></section></main>`;
  return renderDocument({ title: `${page.title} | KidHabit Hero`, description: page.description, path: `/${slug}/`, marketingOrigin, appOrigin, body });
}

export function renderInfoPage({ slug, marketingOrigin, appOrigin, supportEmail }) {
  if (legalSlugs.has(slug)) return renderLegalPage({ slug, marketingOrigin, appOrigin, supportEmail });
  const page = publicPages[slug];
  const body = `<main id="noi-dung"><section class="page-hero"><div class="shell"><h1>${page.title}</h1><p>${page.description}</p></div></section><section class="section info-page"><div class="shell info-grid">${page.sections.map(([title, text]) => `<article><h2>${title}</h2><p>${text}</p></article>`).join('')}</div>${slug === 'contact' ? renderContactNote(supportEmail) : ''}</section></main>`;
  return renderDocument({ title: `${page.title} | KidHabit Hero`, description: page.description, path: `/${slug}/`, marketingOrigin, appOrigin, body });
}
