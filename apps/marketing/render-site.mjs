import { buildLegalPages, legalUpdatedLabel } from './legal-content.mjs';
import { faqs, habitLoop, mascots, navigation, outcomes, plans, publicPages, trustPoints } from './site-content.mjs';

const icons = {
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6 6-2Z"/>',
  'list-checks': '<path d="m3 7 2 2 4-4M3 17l2 2 4-4M13 6h8M13 12h8M13 18h8"/>',
  'trend-up': '<path d="M3 17 9 11l4 4 8-8"/><path d="M15 7h6v6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
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
    description: 'KidHabit giúp ba mẹ chọn thói quen phù hợp, giao việc rõ ràng và cùng con nhìn thấy tiến bộ mỗi ngày.',
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
        <a href="${appUrl(appOrigin, '/')}" class="nav-login">Đăng nhập</a>
        <a href="${appUrl(appOrigin, '/checkout?plan=monthly')}" class="button button-small">Dùng thử 7 ngày</a>
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
  <meta property="og:image:alt" content="Leo, chú sư tử nhỏ đồng hành cùng bé trong KidHabit Hero">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${shareImage}">
  <meta name="theme-color" content="#4f46e5">
  <link rel="icon" href="/logo.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700&family=Nunito+Sans:opsz,wght@6..12,400;6..12,600;6..12,700;6..12,800&display=swap&subset=vietnamese" rel="stylesheet">
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

function renderOutcomes() {
  return `<section class="section outcomes" aria-labelledby="outcome-title">
    <div class="shell outcomes-grid">
      <div class="outcomes-intro"><p class="eyebrow">Từ nhắc nhở đến tự giác</p><h2 id="outcome-title">Cả nhà cùng thấy điều đang tốt lên</h2><p>KidHabit biến mong muốn chung chung thành những việc con có thể hiểu, làm và tự hào khi hoàn thành.</p></div>
      <div class="outcome-list">${outcomes.map((item, index) => `<article class="outcome-item"><span class="outcome-number">0${index + 1}</span><span class="icon-box">${icon(item.icon)}</span><div><h3>${item.title}</h3><p>${item.description}</p></div></article>`).join('')}</div>
    </div>
  </section>`;
}

function renderLoop() {
  return `<section class="section loop-section" aria-labelledby="loop-title"><div class="shell">
    <div class="section-heading"><h2 id="loop-title">Một vòng lặp đơn giản, đủ để duy trì</h2><p>Ba mẹ dẫn đường. Con thực hành. Cả nhà ghi nhận tiến bộ thay vì chỉ nhắc lỗi.</p></div>
    <ol class="habit-loop">${habitLoop.map((step, index) => `<li><span>${index + 1}</span><div><h3>${step.verb}</h3><p>${step.description}</p></div></li>`).join('')}</ol>
  </div></section>`;
}

function renderPricing(appOrigin, heading = 'Chọn gói phù hợp với gia đình') {
  const saving = yearlySaving();
  return `<section class="section pricing-section" id="bang-gia" aria-labelledby="pricing-title"><div class="shell">
    <div class="pricing-heading"><div><p class="eyebrow">7 ngày trải nghiệm đầy đủ</p><h2 id="pricing-title">${heading}</h2><p>Không cần thẻ tín dụng. Không tự động trừ tiền. Hoàn tiền trong 30 ngày nếu chưa hài lòng.</p></div><a class="text-link" href="/terms/">Xem điều khoản ${icon('arrow')}</a></div>
    <div class="pricing-grid">${plans.map((plan) => `<article class="price-card${plan.featured ? ' price-card-featured' : ''}" data-plan="${plan.id}">
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
    <div class="section-heading"><p class="eyebrow">Người bạn đồng hành</p><h2 id="companions-title">Mỗi bé chọn một người bạn đồng hành</h2><p>Bé chọn nhân vật mình thích để cùng làm nhiệm vụ, nhận lời khen và đổi phần thưởng mà ba mẹ đã thống nhất.</p></div>
    <ul class="companion-grid">${mascots.map((mascot) => `<li class="companion-card"><img class="companion-image" src="/mascots/${mascot.id}.webp" alt="${mascot.name}, chú ${mascot.species} đồng hành cùng bé" width="400" height="400" loading="lazy" decoding="async"><strong>${mascot.name}</strong><span>${mascot.trait}</span></li>`).join('')}</ul>
  </div></section>`;
}

function renderFaq() {
  return `<section class="section faq-section" aria-labelledby="faq-title"><div class="shell faq-layout"><div><h2 id="faq-title">Điều ba mẹ thường hỏi</h2><p>Nếu cần thêm trợ giúp, hãy xem hướng dẫn hoặc liên hệ với KidHabit.</p><a class="text-link" href="/docs/">Xem hướng dẫn ${icon('arrow')}</a></div><div class="faq-list">${faqs.map((item) => `<details><summary>${item.question}</summary><p>${item.answer}</p></details>`).join('')}</div></div></section>`;
}

export function renderHome({ marketingOrigin, appOrigin }) {
  const body = `<main id="noi-dung">
    <section class="hero"><div class="shell hero-grid">
      <div class="hero-copy"><p class="hero-kicker">Thói quen tốt bắt đầu từ việc nhỏ</p><h1>Giúp con tự giác mỗi ngày</h1><p>KidHabit giúp ba mẹ chọn đúng thói quen, giao việc rõ ràng và cùng con nhìn thấy tiến bộ mà không cần nhắc mãi.</p><div class="hero-actions"><a class="button button-primary" href="${appUrl(appOrigin, '/checkout?plan=monthly')}">Dùng thử 7 ngày ${icon('arrow')}</a><a class="button button-quiet" href="#cach-hoat-dong">Xem cách hoạt động</a></div><ul class="trust-points" aria-label="Cam kết khi bắt đầu">${trustPoints.map((point) => `<li>${icon('check')}<span>${point}</span></li>`).join('')}</ul></div>
      <div class="hero-visual"><div class="progress-board" aria-label="Minh họa hành trình thói quen của bé"><div class="board-heading"><span>Tuần này của Minh</span><strong>4 ngày liên tiếp</strong></div><div class="path"><div class="path-line"></div>${['Tự gấp chăn', 'Đọc 10 phút', 'Chuẩn bị cặp'].map((label, index) => `<div class="path-stop"><span>${icon(index === 2 ? 'trend-up' : 'check')}</span><div><strong>${label}</strong><small>${index === 2 ? 'Sẵn sàng cho ngày mai' : 'Đã hoàn thành hôm nay'}</small></div></div>`).join('')}</div><div class="board-celebration"><span>+5</span><p><strong>Con đã tự bắt đầu</strong><br>Ba mẹ ghi nhận đúng điều con làm tốt.</p></div></div><img class="hero-mascot" src="/mascots/leo.webp" alt="Leo, chú sư tử nhỏ vẫy tay chào bé" width="400" height="400" fetchpriority="high"></div>
    </div></section>
    ${renderOutcomes()}
    ${renderCompanions()}
    <div id="cach-hoat-dong">${renderLoop()}</div>
    ${renderPricing(appOrigin)}
    ${renderFaq()}
    <section class="final-cta"><div class="shell final-cta-inner"><div><h2>Bắt đầu với một việc nhỏ hôm nay</h2><p>Thiết lập hồ sơ đầu tiên, chọn thói quen phù hợp và để con tự hoàn thành bước tiếp theo.</p></div><a class="button button-light" href="${appUrl(appOrigin, '/checkout?plan=monthly')}">Bắt đầu cùng con ${icon('arrow')}</a></div></section>
  </main>`;
  return renderDocument({ title: 'KidHabit Hero | Giúp con tự giác mỗi ngày', description: 'KidHabit giúp ba mẹ chọn thói quen phù hợp, giao việc rõ ràng và cùng con nhìn thấy tiến bộ mỗi ngày.', path: '/', marketingOrigin, appOrigin, body, structuredData: renderStructuredData({ marketingOrigin, appOrigin }) });
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
