const toggle = document.querySelector('.nav-toggle');
const navigation = document.querySelector('#primary-navigation');

if (toggle && navigation) {
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Đóng trình đơn' : 'Mở trình đơn');
    navigation.classList.toggle('is-open', open);
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));

  navigation.addEventListener('click', (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      setOpen(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
}

const stickyCta = document.querySelector('[data-sticky-cta]');
const heroActions = document.querySelector('.hero-actions');

if (stickyCta && heroActions && 'IntersectionObserver' in window) {
  let heroVisible = true;
  const overlapping = new Set();
  const update = () => {
    stickyCta.hidden = heroVisible || overlapping.size > 0;
  };

  new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting || entry.boundingClientRect.top > 0;
    update();
  }).observe(heroActions);

  const salesObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) overlapping.add(entry.target);
      else overlapping.delete(entry.target);
    }
    update();
  }, { threshold: 0.15 });
  for (const selector of ['#bang-gia', '.final-cta']) {
    const target = document.querySelector(selector);
    if (target) salesObserver.observe(target);
  }
}
