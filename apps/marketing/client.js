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

const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const motionAllowed = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const portraitExplorer = document.querySelector('[data-portrait-explorer]');
if (portraitExplorer) {
  portraitExplorer.classList.add('is-live');
  const details = [...portraitExplorer.querySelectorAll('[data-portrait-detail]')];
  const triggers = [...portraitExplorer.querySelectorAll('[data-portrait]')];
  const select = (id) => {
    for (const detail of details) detail.hidden = detail.dataset.portraitDetail !== id;
    for (const trigger of triggers) trigger.setAttribute('aria-pressed', String(trigger.dataset.portrait === id));
  };
  for (const trigger of triggers) {
    const choose = () => select(trigger.dataset.portrait);
    trigger.addEventListener('click', choose);
    trigger.addEventListener('focus', choose);
    if (finePointer) trigger.addEventListener('pointerenter', choose);
  }
}

if (finePointer && motionAllowed) {
  const hero = document.querySelector('[data-hero]');
  const visual = document.querySelector('.hero-visual');
  const heroPhone = document.querySelector('.phone-hero');
  const magnets = [...document.querySelectorAll('[data-magnetic]')];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  let lastEvent = null;
  let frame = 0;
  let tiltedPhone = null;

  const resetTilt = (phone) => {
    phone.style.removeProperty('--tilt-x');
    phone.style.removeProperty('--tilt-y');
    phone.classList.remove('is-tilting');
  };

  const resetHero = () => {
    hero?.classList.remove('is-pointer-active');
    visual?.style.removeProperty('--px');
    visual?.style.removeProperty('--py');
    if (heroPhone && tiltedPhone !== heroPhone) resetTilt(heroPhone);
  };

  const apply = () => {
    frame = 0;
    const event = lastEvent;
    if (!event) return;
    const target = event.target instanceof Element ? event.target : null;

    if (hero && visual) {
      const heroBox = hero.getBoundingClientRect();
      const inside = event.clientX >= heroBox.left && event.clientX <= heroBox.right
        && event.clientY >= heroBox.top && event.clientY <= heroBox.bottom;
      if (inside) {
        const box = visual.getBoundingClientRect();
        const px = clamp((event.clientX - (box.left + box.width / 2)) / (box.width / 2), -1, 1);
        const py = clamp((event.clientY - (box.top + box.height / 2)) / (box.height / 2), -1, 1);
        hero.style.setProperty('--hx', `${event.clientX - heroBox.left}px`);
        hero.style.setProperty('--hy', `${event.clientY - heroBox.top}px`);
        hero.classList.add('is-pointer-active');
        visual.style.setProperty('--px', px.toFixed(3));
        visual.style.setProperty('--py', py.toFixed(3));
        if (heroPhone && !heroPhone.contains(target)) {
          heroPhone.style.setProperty('--tilt-y', `${(px * 6).toFixed(2)}deg`);
          heroPhone.style.setProperty('--tilt-x', `${(py * -4).toFixed(2)}deg`);
        }
      } else {
        resetHero();
      }
    }

    const card = target?.closest('[data-spotlight]');
    if (card) {
      const box = card.getBoundingClientRect();
      card.style.setProperty('--sx', `${event.clientX - box.left}px`);
      card.style.setProperty('--sy', `${event.clientY - box.top}px`);
    }

    const phone = target?.closest('[data-tilt]');
    if (tiltedPhone && tiltedPhone !== phone) resetTilt(tiltedPhone);
    tiltedPhone = phone ?? null;
    if (phone) {
      const box = phone.getBoundingClientRect();
      const nx = clamp((event.clientX - box.left) / box.width, 0, 1);
      const ny = clamp((event.clientY - box.top) / box.height, 0, 1);
      phone.style.setProperty('--tilt-y', `${((nx - 0.5) * 16).toFixed(2)}deg`);
      phone.style.setProperty('--tilt-x', `${((0.5 - ny) * 12).toFixed(2)}deg`);
      phone.style.setProperty('--glare-x', `${(nx * 100).toFixed(1)}%`);
      phone.style.setProperty('--glare-y', `${(ny * 100).toFixed(1)}%`);
      phone.classList.add('is-tilting');
    }

    for (const magnet of magnets) {
      const box = magnet.getBoundingClientRect();
      const dx = event.clientX - (box.left + box.width / 2);
      const dy = event.clientY - (box.top + box.height / 2);
      const nearestX = clamp(event.clientX, box.left, box.right);
      const nearestY = clamp(event.clientY, box.top, box.bottom);
      if (Math.hypot(event.clientX - nearestX, event.clientY - nearestY) < 72) {
        magnet.style.setProperty('--mx', `${clamp(dx * 0.2, -8, 8).toFixed(1)}px`);
        magnet.style.setProperty('--my', `${clamp(dy * 0.3, -6, 6).toFixed(1)}px`);
      } else {
        magnet.style.removeProperty('--mx');
        magnet.style.removeProperty('--my');
      }
    }
  };

  document.addEventListener('pointermove', (event) => {
    lastEvent = event;
    if (!frame) frame = window.requestAnimationFrame(apply);
  }, { passive: true });

  document.documentElement.addEventListener('pointerleave', () => {
    resetHero();
    if (tiltedPhone) resetTilt(tiltedPhone);
    tiltedPhone = null;
    for (const magnet of magnets) {
      magnet.style.removeProperty('--mx');
      magnet.style.removeProperty('--my');
    }
  });
}
