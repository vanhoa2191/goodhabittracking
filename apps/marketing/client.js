// A visitor who arrives through a referral link keeps the code for 60 days so the family that signs up
// later can be credited to the parent who shared it. Only a well-formed code is stored.
(() => {
  const code = (new URLSearchParams(window.location.search).get('ref') || '').trim().toUpperCase();
  if (!/^[A-HJ-NP-Z2-9]{8}$/.test(code)) return;
  const parts = [`kidhabit_ref=${code}`, `Max-Age=${60 * 24 * 60 * 60}`, 'Path=/', 'SameSite=Lax'];
  if (window.location.protocol === 'https:') parts.push('Secure');
  if (window.location.hostname === 'kidhabithero.com' || window.location.hostname.endsWith('.kidhabithero.com')) parts.push('Domain=kidhabithero.com');
  document.cookie = parts.join('; ');
})();

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

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
root.dataset.js = '';
if (!reduceMotion) root.dataset.motion = '';

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

// Sections fade in as they scroll into view. Without motion or IntersectionObserver everything shows at once.
(() => {
  const items = $$('.reveal');
  if (!items.length) return;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    for (const item of items) item.classList.add('is-in');
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.15 });
  for (const item of items) observer.observe(item);
})();

// A radiogroup of buttons with a roving tab stop and arrow-key selection. Returns select(button, focus).
function radioGroup(group, onChange) {
  const items = $$('[role="radio"]', group);
  const select = (button, focus) => {
    for (const item of items) {
      const on = item === button;
      item.setAttribute('aria-checked', String(on));
      item.tabIndex = on ? 0 : -1;
    }
    if (focus) button.focus();
    onChange(button);
  };
  items.forEach((button, index) => {
    button.addEventListener('click', () => select(button));
    button.addEventListener('keydown', (event) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      select(items[(index + step + items.length) % items.length], true);
    });
  });
  return select;
}

// Chapters: current chapter in the header, the progress bar, the phone menu, the bottom bar and the morning timeline.
(() => {
  const sections = $$('[data-chapter]');
  if (!sections.length) return;
  const links = $$('[data-chapter-link]');
  const pill = $('[data-chapter-pill]');
  const menu = $('[data-chapter-menu]');
  const pillNum = $('[data-pill-num]');
  const pillName = $('[data-pill-name]');
  const progress = $('[data-progress]');
  const header = $('[data-story-top]');
  const dock = $('[data-dock]');
  const dockTitle = dock && $('[data-dock-title]', dock);
  const dockNote = dock && $('[data-dock-note]', dock);
  const dockCta = dock && $('[data-dock-cta]', dock);
  const plans = $('#gia');
  const bubbles = $$('[data-timeline] li');
  const counter = $('[data-nag-count]');

  const setMenu = (open) => {
    if (!pill || !menu) return;
    menu.hidden = !open;
    pill.setAttribute('aria-expanded', String(open));
  };
  if (pill && menu) {
    pill.addEventListener('click', () => setMenu(menu.hidden));
    menu.addEventListener('click', (event) => {
      if (event.target instanceof Element && event.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !menu.hidden) {
        setMenu(false);
        pill.focus();
      }
    });
    document.addEventListener('click', (event) => {
      if (!menu.hidden && event.target instanceof Node && !menu.contains(event.target) && !pill.contains(event.target)) setMenu(false);
    });
  }

  let current = -1;
  const setChapter = (index) => {
    if (index !== current) {
      current = index;
      const id = sections[index].id;
      for (const link of links) link.setAttribute('aria-current', link.getAttribute('href') === `#${id}` ? 'true' : 'false');
      if (pillNum) pillNum.textContent = index === 0 ? '' : `${index}/${sections.length - 1}`;
      if (pillName) pillName.textContent = sections[index].dataset.chapter ?? '';
    }
    if (!dock) return;
    const section = sections[index];
    const copy = section.dataset.dockTitle ? section.dataset : null;
    const plansBox = plans?.getBoundingClientRect();
    const overPlans = plansBox ? plansBox.top < window.innerHeight && plansBox.bottom > 0 : false;
    dock.hidden = !(copy && window.scrollY > 500 && !overPlans);
    if (!copy) return;
    if (dockTitle) dockTitle.textContent = copy.dockTitle;
    if (dockNote) dockNote.textContent = copy.dockNote ?? '';
    if (dockCta) {
      dockCta.textContent = copy.dockCta ?? '';
      if (copy.dockHref) dockCta.setAttribute('href', copy.dockHref);
    }
  };

  const update = () => {
    const line = window.scrollY + window.innerHeight * 0.35;
    let index = 0;
    sections.forEach((section, i) => {
      if (section.getBoundingClientRect().top + window.scrollY <= line) index = i;
    });
    setChapter(index);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    header?.classList.toggle('scrolled', window.scrollY > 10);
    if (bubbles.length) {
      let lit = 0;
      for (const bubble of bubbles) {
        const on = reduceMotion || bubble.getBoundingClientRect().top < window.innerHeight * 0.62;
        bubble.classList.toggle('on', on);
        if (on) lit += 1;
      }
      if (counter) counter.textContent = String(lit);
    }
  };
  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      update();
    });
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  update();
})();

// Opening question: the answer text and the closing title follow the chosen option.
(() => {
  const quiz = $('[data-quiz]');
  if (!quiz) return;
  const answer = $('[data-quiz-answer]', quiz);
  const finalTitle = $('h2[data-final-title]');
  radioGroup($('[role="radiogroup"]', quiz), (button) => {
    const key = button.dataset.quizOption;
    if (answer) answer.hidden = false;
    for (const text of $$('[data-quiz-text]', quiz)) text.hidden = text.dataset.quizText !== key;
    if (finalTitle && button.dataset.finalTitle) finalTitle.textContent = button.dataset.finalTitle;
  });
})();

// "Tried it" cards.
(() => {
  const group = $('[data-tried]');
  if (!group) return;
  const cards = $$('.tried', group);
  const count = $('[data-tried-count]');
  const number = $('[data-tried-n]');
  const empty = $('[data-tried-result="empty"]');
  const some = $('[data-tried-result="count"]');
  for (const card of cards) {
    card.addEventListener('click', () => {
      card.setAttribute('aria-pressed', String(card.getAttribute('aria-pressed') !== 'true'));
      const n = cards.filter((item) => item.getAttribute('aria-pressed') === 'true').length;
      if (count) count.textContent = n ? String(n) : '?';
      if (number) number.textContent = String(n);
      if (empty) empty.hidden = n > 0;
      if (some) some.hidden = n === 0;
    });
  }
})();

// Age explorer: five panels are in the page; the tabs only choose which one shows.
(() => {
  const list = $('[data-age-tabs]');
  if (!list) return;
  const tabs = $$('[data-age-tab]', list);
  const show = (index, focus) => {
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(tab.getAttribute('aria-controls') ?? '');
      if (panel) panel.hidden = !on;
    });
    if (focus) tabs[index].focus();
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => show(index));
    tab.addEventListener('keydown', (event) => {
      const target = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 }[event.key];
      if (target === undefined) return;
      event.preventDefault();
      show((target + tabs.length) % tabs.length, true);
    });
  });
})();

// "Try being the child" demo: three tasks, stars, a bar, a parent's stamp and a praise line.
(() => {
  const tasks = $$('[data-demo-task]');
  if (!tasks.length) return;
  const stars = $('[data-demo-stars]');
  const starsBox = stars?.closest('.stars');
  const bar = $('[data-demo-bar]');
  const stamp = $('[data-demo-stamp]');
  const praise = $('[data-demo-praise]');
  for (const task of tasks) {
    task.addEventListener('click', () => {
      task.setAttribute('aria-pressed', String(task.getAttribute('aria-pressed') !== 'true'));
      const done = tasks.filter((item) => item.getAttribute('aria-pressed') === 'true');
      if (stars) stars.textContent = String(done.reduce((sum, item) => sum + Number(item.dataset.points || 0), 0));
      if (bar) bar.style.width = `${(done.length / tasks.length) * 100}%`;
      if (starsBox && !reduceMotion) {
        starsBox.classList.remove('pop');
        void starsBox.offsetWidth;
        starsBox.classList.add('pop');
      }
      const all = done.length === tasks.length;
      if (stamp) stamp.hidden = !all;
      if (praise) praise.hidden = !all;
    });
  }
})();

// Plan picker. Both billing cycles are already in the page with their prices; this only chooses what shows.
for (const section of $$('[data-pricing-cycle]')) {
  const cycleGroup = $('[data-cycle-toggle]', section);
  const kidsGroup = $('[data-kids]', section);
  const selectCycle = cycleGroup
    ? radioGroup(cycleGroup, (button) => { section.dataset.pricingCycle = button.dataset.value ?? 'year'; })
    : () => {};
  if (kidsGroup) {
    radioGroup(kidsGroup, (button) => {
      for (const card of $$('[data-plan]', section)) {
        const on = card.dataset.plan === button.dataset.tier;
        if (card.dataset.plan === 'pro_plus') continue;
        card.classList.toggle('recommended', on);
        for (const cta of $$('[data-plan-cta]', card)) {
          cta.classList.toggle('btn-primary', on);
          cta.classList.toggle('btn-line', !on);
        }
      }
    });
  }
  const yearButton = cycleGroup && $('[data-value="year"]', cycleGroup);
  for (const nudge of $$('[data-cycle-nudge]', section)) {
    nudge.addEventListener('click', () => {
      if (yearButton) selectCycle(yearButton, true);
    });
  }
}

// Launch-offer places left: only ever the number the app reports; any failure leaves the line empty.
(() => {
  const target = $('[data-offer-remaining]');
  const origin = target?.dataset.appOrigin;
  if (!target || !origin || !('fetch' in window)) return;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 5000);
  fetch(`${origin}/api/offers/launch`, { credentials: 'omit', signal: controller.signal })
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      const { remaining, slots } = data ?? {};
      if (!Number.isInteger(remaining) || !Number.isInteger(slots) || remaining < 0 || slots <= 0 || remaining > slots) return;
      target.textContent = remaining > 0 ? `Còn ${remaining}/${slots} suất` : 'Đã hết suất ưu đãi';
    })
    .catch(() => {})
    .finally(() => window.clearTimeout(timer));
})();

// Images below the first screen are lazy so the page opens fast. Once the page has loaded and the browser is idle,
// the rest are fetched in the background, so a quick scroll never lands on an empty phone frame or mascot card.
(() => {
  const warm = () => {
    if (navigator.connection && navigator.connection.saveData) return;
    for (const image of document.querySelectorAll('img[loading="lazy"]')) image.loading = 'eager';
  };
  const afterLoad = () => ('requestIdleCallback' in window ? window.requestIdleCallback(warm, { timeout: 4000 }) : window.setTimeout(warm, 2000));
  if (document.readyState === 'complete') afterLoad();
  else window.addEventListener('load', afterLoad, { once: true });
})();
