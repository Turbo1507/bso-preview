/* BLACK SANDS OASIS — базовый интерактив: header, reveal, карусели, табы планировок */

/* Пути к фото планировок ниже прописаны как 'assets/...' — относительно страницы.
   v2 лежит на уровень глубже (/v2/), а картинки общие и остаются в /assets/,
   поэтому страница может объявить window.BSO_ASSET_PREFIX ДО подключения этого
   файла. Для v1 переменной нет → префикс пустой, поведение прежнее. */
const ASSET = s => (window.BSO_ASSET_PREFIX || '') + s;

/* ---------- header solid on scroll ---------- */
const header = document.getElementById('header');
function syncHeader() { header.classList.toggle('is-solid', window.scrollY > 40); }
document.addEventListener('scroll', syncHeader, { passive: true });
syncHeader();

/* ---------- burger (полноэкранный оверлей — паттерн с unit-wordpress) ---------- */
/* оверлей визуально прячется через translateY, но без aria-hidden/inert
   его ссылки оставались доступны табом и скринридерам как "невидимый дубль" меню */
const burger = document.getElementById('burger');
const menuOverlay = document.getElementById('menuOverlay');
const menuClose = document.getElementById('menuClose');
function setMenuOpen(open) {
  document.body.classList.toggle('menu-open', open);
  if (burger) burger.setAttribute('aria-expanded', String(open));
  if (menuOverlay) {
    menuOverlay.toggleAttribute('inert', !open);
    menuOverlay.setAttribute('aria-hidden', String(!open));
  }
}
if (burger) {
  burger.setAttribute('aria-expanded', 'false');
  burger.setAttribute('aria-controls', 'menuOverlay');
  burger.addEventListener('click', () => setMenuOpen(!document.body.classList.contains('menu-open')));
}
if (menuOverlay) { menuOverlay.setAttribute('aria-hidden', 'true'); menuOverlay.setAttribute('inert', ''); }
if (menuClose) menuClose.addEventListener('click', () => setMenuOpen(false));
if (menuOverlay) menuOverlay.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenuOpen(false)));

/* ---------- оверлей заявки (тот же паттерн, что на unitdeveloper.com) ----------
   ВАЖНО: у BSO нет своего бэкенда/CRM-эндпоинта для приёма заявок (сайт —
   статика на GitHub Pages). Пока шлём через mailto на hello@unit.now (реальный
   опубликованный адрес UNIT. в футере unitdeveloper.com, не придуман) — это
   ЧЕСТНЫЙ, но временный канал. Настоящую доставку (форма-бэкенд/Telegram-бот/
   Битрикс CRM) нужно обсудить с Боссом отдельно. */
const leadModal = document.getElementById('leadModal');
const leadForm = document.getElementById('leadForm');
if (leadModal && leadForm) {
  const openLead = () => {
    leadModal.classList.add('is-open');
    leadModal.setAttribute('aria-hidden', 'false');
    leadModal.removeAttribute('inert');
    document.body.classList.add('lead-lock');
  };
  const closeLead = () => {
    leadModal.classList.remove('is-open');
    leadModal.setAttribute('aria-hidden', 'true');
    leadModal.setAttribute('inert', '');
    document.body.classList.remove('lead-lock');
  };
  leadModal.setAttribute('aria-hidden', 'true');
  leadModal.setAttribute('inert', '');
  document.querySelectorAll('.js-lead-open').forEach(el => el.addEventListener('click', e => {
    e.preventDefault();
    setMenuOpen(false);
    openLead();
  }));
  leadModal.querySelectorAll('[data-lead-close]').forEach(el => el.addEventListener('click', closeLead));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLead(); });

  /* телефон: код страны + автоформат по региональному шаблону (как на unit-wp) */
  const ccSelect = leadForm.querySelector('#leadCc');
  const phoneLocal = leadForm.querySelector('#leadPhoneLocal');
  function formatPhoneDigits(digits, pattern) {
    const groups = (pattern || '3-3-3').split('-').map(n => parseInt(n, 10));
    const out = []; let i = 0;
    for (const g of groups) { if (i >= digits.length) break; out.push(digits.slice(i, i + g)); i += g; }
    if (i < digits.length) out.push(digits.slice(i));
    return out.filter(Boolean).join(' ');
  }
  if (ccSelect && phoneLocal) {
    const reformat = () => {
      const digits = phoneLocal.value.replace(/\D+/g, '');
      const fmt = ccSelect.selectedOptions[0] && ccSelect.selectedOptions[0].dataset.format;
      phoneLocal.value = formatPhoneDigits(digits, fmt);
    };
    phoneLocal.addEventListener('input', reformat);
    ccSelect.addEventListener('change', reformat);
  }

  /* кнопка отправки неактивна, пока не отмечено согласие на ПД */
  const consentBox = leadForm.querySelector('input[name="consent"]');
  const submitBtn = leadForm.querySelector('button[type="submit"]');
  const syncSubmitState = () => { if (consentBox && submitBtn) submitBtn.disabled = !consentBox.checked; };
  if (consentBox) { consentBox.addEventListener('change', syncSubmitState); syncSubmitState(); }

  leadForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const status = leadForm.querySelector('[data-status]');
    const dict = (window.I18N && window.I18N[window.__bsoLang || 'en']) || {};
    const data = new FormData(leadForm);

    /* Правка Босса 17.08: почта стала обязательной. Форма стоит с novalidate
       (списки и чекбокс нарисованы свои), поэтому required проверяем руками —
       и заодно остальные required-поля: до этого заявка уходила бы и с пустым
       именем. Признак — сам атрибут required в разметке, так что v1, где почта
       осталась необязательной, ведёт себя как раньше. */
    const fail = (el, msg) => {
      if (status) { status.textContent = msg; status.className = 'lead-status is-err'; }
      if (el && el.focus) el.focus();
    };
    const emailEl = leadForm.querySelector('input[name="email"]');
    const missing = Array.from(leadForm.querySelectorAll('[required]'))
      .filter(el => el.type !== 'checkbox' && !el.value.trim());   /* согласие держит кнопку disabled */
    if (missing.length) return fail(missing[0], dict['lead.err_required'] || 'Заполните обязательные поля');
    if (emailEl && emailEl.required && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailEl.value.trim())) {
      return fail(emailEl, dict['lead.err_email'] || 'Укажите корректный email');
    }

    const phone = '+' + (ccSelect ? ccSelect.value : '') + ' ' + (phoneLocal ? phoneLocal.value.trim() : '');
    const purposeLabels = {
      own: dict['lead.purpose_own'], invest: dict['lead.purpose_invest'],
      rent: dict['lead.purpose_rent'], other: dict['lead.purpose_other']
    };
    const lines = [
      'Black Sands Oasis — заявка с сайта',
      'Имя: ' + (data.get('name') || ''),
      'Телефон: ' + phone,
      'Email: ' + (data.get('email') || '—'),
      'Интерес: ' + (purposeLabels[data.get('purpose')] || data.get('purpose') || '—'),
      'Комментарий: ' + (data.get('comment') || '—')
    ];
    const mailto = 'mailto:hello@unit.now?subject=' + encodeURIComponent('BSO: заявка от ' + (data.get('name') || '')) + '&body=' + encodeURIComponent(lines.join('\n'));
    window.location.href = mailto;
    if (status) { status.textContent = dict['lead.success'] || 'Спасибо! Мы скоро свяжемся с вами.'; status.className = 'lead-status is-ok'; }
    leadForm.reset();
    syncSubmitState();
    setTimeout(closeLead, 2200);
  });
}

/* ---------- мобильный CTA снизу: скрыт пока мы на хиро, появляется после ---------- */
const heroSection = document.querySelector('.hero');
const mobCta = document.querySelector('.mob-cta');
if (heroSection && mobCta) {
  const ctaIO = new IntersectionObserver(entries => {
    entries.forEach(e => mobCta.classList.toggle('show', !e.isIntersecting));
  }, { threshold: 0 });
  ctaIO.observe(heroSection);
}

/* ---------- reveal on scroll ---------- */
const revealItems = document.querySelectorAll('.reveal');
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.14 });
revealItems.forEach(el => io.observe(el));

/* ---------- счётчик-анимация на цифрах (Nuanu/Investment статы, Area/Capacity
   планировок) ---------- */
/* Общий парсер: находит ПЕРВОЕ число в тексте узла (целое или с точкой/запятой),
   анимирует 0→число за duration, сохраняя префикс/суффикс ("Up to 16% annually",
   "31.2 m²", "0 min" и т.д.) и число знаков после запятой у цели. По завершении
   принудительно ставит исходный текст — от rounding-дрейфа requestAnimationFrame. */
function animateNumberIn(el, duration = 900) {
  if (!el || el.dataset.counted === '1') return;
  const original = el.textContent;
  const m = original.match(/\d+(?:[.,]\d+)?/);
  if (!m) return;
  el.dataset.counted = '1';
  const raw = m[0];
  const target = parseFloat(raw.replace(',', '.'));
  const decimals = (raw.split(/[.,]/)[1] || '').length;
  const prefix = original.slice(0, m.index);
  const suffix = original.slice(m.index + raw.length);
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
    if (p < 1) requestAnimationFrame(tick); else el.textContent = original;
  }
  requestAnimationFrame(tick);
}
const statNumIO = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { animateNumberIn(e.target); statNumIO.unobserve(e.target); } });
}, { threshold: 0.5 });
document.querySelectorAll('.stat-card h3').forEach(el => statNumIO.observe(el));

/* ---------- живой футер: время + погода на Бали (WITA, Nuanu/Tabanan) ---------- */
/* Open-Meteo — без API-ключа, CORS открыт, подходит для чисто статического
   сайта. Координаты — примерный район Nuanu (west coast, Tabanan). Если фетч
   не прошёл (сеть/адблок/офлайн) — тихо прячем только часть с температурой,
   часы работают независимо (Intl.DateTimeFormat, без сети). */
const baliTimeEl = document.getElementById('baliTime');
if (baliTimeEl) {
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Makassar', hour: '2-digit', minute: '2-digit' });
  const syncBaliTime = () => { baliTimeEl.textContent = fmt.format(new Date()); };
  syncBaliTime();
  setInterval(syncBaliTime, 30000);
}
const baliTempEl = document.getElementById('baliTemp');
const baliWeatherWrap = document.getElementById('baliWeatherWrap');
if (baliTempEl && baliWeatherWrap) {
  fetch('https://api.open-meteo.com/v1/forecast?latitude=-8.57&longitude=115.08&current=temperature_2m&timezone=Asia%2FMakassar')
    .then(r => { if (!r.ok) throw new Error('weather http ' + r.status); return r.json(); })
    .then(data => {
      const t = data && data.current && data.current.temperature_2m;
      if (typeof t !== 'number') throw new Error('no temperature in response');
      const rounded = Math.round(t);
      baliTempEl.textContent = (rounded >= 0 ? '+' : '') + rounded + '°C';
    })
    .catch(() => { baliWeatherWrap.style.display = 'none'; });
}

/* ---------- горизонтальные карусели (карточки преимуществ, шаги) ---------- */
/* prev/next получают disabled в начале/конце скролла (просто opacity ниже,
   см. .feat-nav button:disabled), точки под каруселью показывают позицию */
function wireCarousel(trackId, prevId, nextId, dotsId, step) {
  const track = document.getElementById(trackId);
  const prev = document.getElementById(prevId);
  const next = document.getElementById(nextId);
  const dotsWrap = document.getElementById(dotsId);
  if (!track) return;
  const dots = dotsWrap ? Array.from(dotsWrap.children) : [];
  const cards = Array.from(track.children);
  const scrollBy = () => track.clientWidth * 0.7 || step;

  function sync() {
    const max = track.scrollWidth - track.clientWidth;
    if (prev) prev.disabled = track.scrollLeft <= 4;
    if (next) next.disabled = track.scrollLeft >= max - 4;
    if (dots.length && cards.length) {
      /* доля прокрутки [0..max] проецируется на индекс точки [0..dots.length-1] —
         не делить scrollWidth на число карточек: maxScroll != scrollWidth,
         т.к. clientWidth (видимая часть) тоже занимает место в scrollWidth */
      const ratio = max > 0 ? track.scrollLeft / max : 0;
      const idx = Math.round(ratio * (dots.length - 1));
      dots.forEach((d, i) => d.classList.toggle('on', i === idx));
    }
  }
  prev && prev.addEventListener('click', () => track.scrollBy({ left: -scrollBy(), behavior: 'smooth' }));
  next && next.addEventListener('click', () => track.scrollBy({ left: scrollBy(), behavior: 'smooth' }));
  track.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync);
  sync();
}
wireCarousel('featTrack', 'featPrev', 'featNext', 'featDots', 400);
wireCarousel('stepsTrack', 'stepsPrev', 'stepsNext', 'stepsDots', 300);

/* ---------- галерея фасада (блок 03): нативный scroll-snap (не transform по
   индексу) — один слайд = 100% ширины трека, стрелки листают через scrollBy,
   на мобиле стрелки спрятаны и то же самое доступно свайпом ---------- */
function wireSlider(trackId, prevId, nextId, dotsId, autoplayMs, opts) {
  const track = document.getElementById(trackId);
  const prev = document.getElementById(prevId);
  const next = document.getElementById(nextId);
  const dotsWrap = document.getElementById(dotsId);
  if (!track) return;
  /* loop: с последнего кадра стрелка «вперёд» уводит на первый и наоборот,
     стрелки при этом никогда не гаснут (автолистание крутилось по кругу и
     раньше, а вот руками галерея упиралась в края) */
  const loop = !!(opts && opts.loop);
  let dots = dotsWrap ? Array.from(dotsWrap.children) : [];
  function sync() {
    const max = track.scrollWidth - track.clientWidth;
    if (prev) prev.disabled = loop ? false : track.scrollLeft <= 4;
    if (next) next.disabled = loop ? false : track.scrollLeft >= max - 4;
    if (dots.length) {
      const idx = Math.round(track.scrollLeft / (track.clientWidth || 1));
      dots.forEach((d, i) => d.classList.toggle('on', i === Math.min(idx, dots.length - 1)));
    }
  }
  /* число слайдов у планировок разное по типам (5 у большинства, 6 у 4BD) —
     точки нельзя хардкодить в HTML, пересобираем под фактическое число */
  function setCount(n) {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const span = document.createElement('span');
      if (i === 0) span.classList.add('on');
      dotsWrap.appendChild(span);
    }
    dots = Array.from(dotsWrap.children);
    sync();
  }
  function step(dir) {
    const max = track.scrollWidth - track.clientWidth;
    if (loop && dir > 0 && track.scrollLeft >= max - 4) return track.scrollTo({ left: 0, behavior: 'smooth' });
    if (loop && dir < 0 && track.scrollLeft <= 4) return track.scrollTo({ left: max, behavior: 'smooth' });
    track.scrollBy({ left: dir * track.clientWidth, behavior: 'smooth' });
  }
  prev && prev.addEventListener('click', () => step(-1));
  next && next.addEventListener('click', () => step(1));
  track.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync);
  sync();
  /* автолистание (по просьбе Босса, галерея фасада) — держит слайд заданное
     время, потом едет на следующий, зацикливаясь; останавливается насовсем
     при первом ручном вмешательстве пользователя (свайп/стрелка/точка), не
     мешает дальше листать вручную */
  if (autoplayMs) {
    let timer = setInterval(() => {
      const max = track.scrollWidth - track.clientWidth;
      const atEnd = track.scrollLeft >= max - 4;
      track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + track.clientWidth, behavior: 'smooth' });
    }, autoplayMs);
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    track.addEventListener('pointerdown', stop, { once: true });
    prev && prev.addEventListener('click', stop, { once: true });
    next && next.addEventListener('click', stop, { once: true });
  }
  return { sync, setCount };
}
wireSlider('minGalleryTrack', 'minGalleryPrev', 'minGalleryNext', 'minGalleryDots', 8000, { loop: true });
const plansPhotoSlider = wireSlider('plansPhotoTrack', 'plansPhotoPrev', 'plansPhotoNext', 'plansPhotoDots');

/* ---------- пины инфраструктуры на мастер-плане Nuanu ---------- */
/* координаты (%) сняты через get_nodes_info с Figma-фреймов "nuanu desk rus"
   (168:138) и "nuanu desk eng" (168:301), канал hdgz87wq. dot — позиция
   точки-маркера (Ellipse) на карте; label — позиция текстовой подписи
   (СВОЯ, не совпадает с dot — в Figma подпись отнесена в сторону линией-
   указателем, чтобы соседние подписи не наезжали друг на друга, напр.
   "Музыкальная студия" и "Арт-площадка" стоят рядом на карте, но подписи
   разведены). Линия dot→label рисуется SVG. Один список на оба языка —
   assets/nuanu-masterplan.jpg (1600x800) и Figma-фрейм — один кадр 2:1. */
const NUANU_PINS = [
  { ru: 'Музыкальная студия', en: 'Music Studio', dot: [23.43, 36.05], label: [23.28, 27.36] },
  { ru: 'Ресторан Beer Garden', en: 'Restaurant Beer Garden', dot: [17.30, 58.95], label: [17.20, 49.78] },
  { ru: 'Арт-галерея', en: 'Art Gallery', dot: [36.00, 34.60], label: [36.04, 27.79] },
  { ru: 'Luna пляжный клуб', en: 'Luna Beach Club', dot: [43.91, 53.31], label: [43.94, 43.36] },
  { ru: 'Рестораны', en: 'Restaurants', dot: [58.59, 45.73], label: [58.60, 37.62] },
  { ru: 'Ночной клуб', en: 'Night Club', dot: [73.02, 47.66], label: [73.03, 42.46] },
  { ru: 'Медиа парк Aurora', en: 'Aurora Media Park', dot: [79.72, 34.27], label: [79.72, 26.66] },
  { ru: 'Альпака парк', en: 'Alpaca Park', dot: [67.54, 34.27], label: [67.51, 30.69] },
  { ru: 'Международная школа, детский сад, деревня детского творчества', en: 'International School, Kindergarten, Children’s Creativity Village', dot: [51.98, 27.98], label: [51.96, 21.39] },
  { ru: 'Ретритный центр', en: 'Retreat Center', dot: [67.54, 62.98], label: [67.53, 55.20] },
  { ru: 'Торговый центр', en: 'Shopping Center', dot: [84.03, 47.02], label: [84.08, 38.75] },
  { ru: 'Арт-площадка для мероприятий', en: 'Art Venue for Events', dot: [28.91, 35.56], label: [28.91, 46.02] },
  { ru: 'Венчальный зал', en: 'Wedding Hall', dot: [22.06, 61.53], label: [22.03, 71.55] },
  { ru: 'Бассейн в пещере Utopia', en: 'Pool in the Utopia Cave', dot: [36.99, 68.95], label: [37.13, 61.82] },
  { ru: 'Thk tower', en: 'Thk Tower', dot: [47.78, 68.47], label: [47.99, 77.14] },
];
/* мобильный кроп (assets/nuanu-masterplan-mobile.jpg, 280x289) — ДРУГАЯ
   раскладка, не dot+line как на десктопе, а плоские подписи прямо на фото
   (см. Figma "nuanu mob rus"/"nuanu mob eng", 168:216/168:259, канал
   24124zuq). Координаты — % от 280x289. Все center-анкорные (совпадают у
   ru/en несмотря на разную ширину бокса — Figma авто-resize текста
   расширяется симметрично от центра), кроме "Ресторан Beer Garden"
   (align:'left' в Figma, координата = левый край, стабильна между языками) */
const NUANU_PINS_MOBILE = [
  { ru: 'Музыкальная студия', en: 'Music Studio', left: 18.93, top: 34.26 },
  { ru: 'Ресторан Beer Garden', en: 'Restaurant Beer Garden', left: 3.57, top: 46.37, align: 'left' },
  { ru: 'Венчальный зал', en: 'Wedding Hall', left: 14.11, top: 60.90 },
  { ru: 'Бассейн в пещере Utopia', en: 'Pool in the Utopia Cave', left: 33.21, top: 67.82 },
  { ru: 'Арт-площадка для мероприятий', en: 'Art Venue for Events', left: 30.54, top: 44.29 },
  { ru: 'Thk tower', en: 'Thk Tower', left: 47.32, top: 74.39 },
  { ru: 'Арт-галерея', en: 'Art Gallery', left: 39.46, top: 35.64 },
  { ru: 'Международная школа, детский сад, деревня детского творчества', en: 'International School, Kindergarten, Children’s Creativity Village', left: 50.18, top: 28.03 },
  { ru: 'Медиа парк Aurora', en: 'Aurora Media Park', left: 86.61, top: 34.60 },
  { ru: 'Торговый центр', en: 'Shopping Center', left: 88.21, top: 43.60 },
  { ru: 'Рестораны', en: 'Restaurants', left: 61.96, top: 41.52 },
  { ru: 'Альпака парк', en: 'Alpaca Park', left: 67.68, top: 35.64 },
  { ru: 'Ночной клуб', en: 'Night Club', left: 74.11, top: 52.60 },
  { ru: 'Ретритный центр', en: 'Retreat Center', left: 74.46, top: 67.82 },
];
const nuanuPinsWrap = document.getElementById('nuanuPins');
const nuanuMobileMQ = window.matchMedia('(max-width:860px)');
function renderNuanuPins(lang) {
  if (!nuanuPinsWrap) return;
  if (nuanuMobileMQ.matches) {
    const labels = NUANU_PINS_MOBILE.map(p =>
      `<span class="nuanu-pin-label${p.align === 'left' ? ' is-left' : ''}" style="left:${p.left}%;top:${p.top}%">${lang === 'en' ? p.en : p.ru}</span>`
    ).join('');
    /* тот же пин бейджа BSO, что и на десктопе (window.BSO_NUANU_BADGE_PIN_MOBILE,
       задаётся в index.html) — раньше мобильная ветка вообще не рисовала SVG,
       поэтому бейдж оставался без указателя, в отличие от десктопа */
    const badgePinMobile = window.BSO_NUANU_BADGE_PIN_MOBILE;
    const badgeSvgMobile = badgePinMobile
      ? `<svg class="nuanu-pins-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><line class="badge-pin" x1="${badgePinMobile.dot[0]}" y1="${badgePinMobile.dot[1]}" x2="${badgePinMobile.from[0]}" y2="${badgePinMobile.from[1]}" vector-effect="non-scaling-stroke"/><ellipse class="badge-pin" cx="${badgePinMobile.dot[0]}" cy="${badgePinMobile.dot[1]}" rx=".35" ry=".7"/></svg>`
      : '';
    nuanuPinsWrap.innerHTML = badgeSvgMobile + labels;
    return;
  }
  /* preserveAspectRatio="none" мапит viewBox 100x100 на контейнер 2:1
     (width:height контейнера ≠ viewBox) — X и Y растягиваются РАЗНЫМИ
     коэффициентами, поэтому circle (r одинаковый по X/Y) на выходе сплюснут
     в эллипс по вертикали вдвое; компенсируем через ellipse с ry=2×rx, и
     non-scaling-stroke, чтобы толщина линии не "гуляла" в зависимости от угла */
  const lines = NUANU_PINS.map(p => `<line x1="${p.dot[0]}" y1="${p.dot[1]}" x2="${p.label[0]}" y2="${p.label[1]}" vector-effect="non-scaling-stroke"/><ellipse cx="${p.dot[0]}" cy="${p.dot[1]}" rx=".35" ry=".7"/>`).join('');
  /* Бейдж BLACK SANDS OASIS в v1 стоит без указателя, в отличие от остальных
     подписей. Страница может попросить такой же пин, задав
     window.BSO_NUANU_BADGE_PIN = {dot:[x%,y%], from:[x%,y%]} ДО подключения
     файла. Рисуем теми же примитивами, что и прочие пины, чтобы точка и линия
     масштабировались одинаково. Мобильная ветка выше пинов не рисует вообще —
     там бейдж так и остаётся без точки, как и все остальные подписи. */
  const badgePin = window.BSO_NUANU_BADGE_PIN;
  /* класс badge-pin — чтобы страница могла покрасить указатель бейджа отдельно
     от остальных пинов (у BSO он тёмный, у прочих подписей белый) */
  const badgeSvg = badgePin
    ? `<line class="badge-pin" x1="${badgePin.dot[0]}" y1="${badgePin.dot[1]}" x2="${badgePin.from[0]}" y2="${badgePin.from[1]}" vector-effect="non-scaling-stroke"/><ellipse class="badge-pin" cx="${badgePin.dot[0]}" cy="${badgePin.dot[1]}" rx=".35" ry=".7"/>`
    : '';
  const labels = NUANU_PINS.map(p => `<span class="nuanu-pin-label" style="left:${p.label[0]}%;top:${p.label[1]}%">${lang === 'en' ? p.en : p.ru}</span>`).join('');
  nuanuPinsWrap.innerHTML = `<svg class="nuanu-pins-svg" viewBox="0 0 100 100" preserveAspectRatio="none">${lines}${badgeSvg}</svg>${labels}`;
}
renderNuanuPins(window.__bsoLang || 'en');
nuanuMobileMQ.addEventListener('change', () => renderNuanuPins(window.__bsoLang || 'en'));
window.__bsoSyncNuanuPins = function (lang) { renderNuanuPins(lang); };

/* ---------- планировки: верхние табы (правка Босса — раньше были слева) ---------- */
/* Площадь — реальные цифры из официальной презентации bso-presentation_eng.pdf
   (unitdeveloper.com/for-partners/black-sands-oasis/), таблица "MASTER PLAN OF
   VILLAS". Планировки (plan-*.png) и топ-виды в разрезе (villa-*-topview.jpg) —
   из Figma "villas plans" (channel 24124zuq), 1:1 официальные ассеты застройщика.
   Вместимость (cap) — расчётная по правилу Босса (2026-07-26): 1 спальня = 2
   чел., кроме Studio (реальные данные, заданы раньше). "Для кого" (who) — не
   официальные данные, интерпретация по масштабу формата исходя из контекста
   (по прямому указанию Босса). Двуязычно: PLANS[lang][planId] — синхронизируется
   с setLang() через window.__bsoSyncPlan (см. js/i18n.js). */
/* photo/photoAlt — реальные интерьерные рендеры по типам, вырезаны из
   презентации (bso-presentation_eng.pdf, стр. 31/33/35/37/39/41/43 —
   1:1 соответствие с материалом Figma "МАТЕРИАЛ ДЛЯ ЗАПОЛНЕНИЯ..."), не
   стоковые/придуманные фото. Порядок слайдов (правка Босса): сначала
   интерьерные фото виллы, затем план, затем topview (разрез сверху) —
   последним, после плана. */
const PLANS = {
  ru: {
    /* detail1 (кадр с телевизором) — 3-й слайд карусели по правке Босса. Учитываем
       перестановку в renderPlan: photos[0] (план) уезжает предпоследним, поэтому
       в массиве detail1 стоит 4-м, а в самой карусели показывается третьим */
    studio:   { name: 'Studio', area: '31,2 м²', cap: '5 чел.', who: 'Один, пары', photos: ['assets/plan-studio.png','assets/villa-studio-detail2.jpg','assets/villa-studio-detail3.jpg','assets/villa-studio-detail1.jpg','assets/villa-studio-topview.jpg'], photoAlts: ['Планировка Studio','Интерьер виллы Studio','Интерьер виллы Studio','Интерьер виллы Studio','Вилла Studio в разрезе сверху'], positions: ['50% 50%','50% 65%','50% 55%','50% 50%','50% 50%'] },
    '1bd':    { name: '1BD', area: '71,3 м²', cap: '2 чел.', who: 'Пары', photos: ['assets/plan-1bd.png','assets/villa-1bd-detail1.jpg','assets/villa-1bd-detail2.jpg','assets/villa-1bd-detail3.jpg','assets/villa-1bd-topview.jpg'], photoAlts: ['Планировка 1BD','Интерьер виллы 1BD','Интерьер виллы 1BD','Интерьер виллы 1BD','Вилла 1BD в разрезе сверху'], positions: ['50% 50%','50% 60%','50% 75%','50% 55%','50% 50%'] },
    '1bdsky': { name: '1BD SKY', area: '83,3 м²', cap: '2 чел.', who: 'Пары, workation', photos: ['assets/plan-1bdsky.png','assets/villa-1bdsky-detail1.jpg','assets/villa-1bdsky-detail2.jpg','assets/villa-1bdsky-detail3.jpg','assets/villa-1bdsky-topview.jpg'], photoAlts: ['Планировка 1BD SKY','Интерьер виллы 1BD SKY','Интерьер виллы 1BD SKY','Интерьер виллы 1BD SKY','Вилла 1BD SKY в разрезе сверху'], positions: ['50% 50%','50% 65%','50% 70%','50% 75%','50% 50%'] },
    '2bd':    { name: '2BD', area: '104,61 м²', cap: '4 чел.', who: 'Пары с ребёнком, друзья', photos: ['assets/plan-2bd.png','assets/villa-2bd-detail1.jpg','assets/villa-2bd-detail2.jpg','assets/villa-2bd-detail3.jpg','assets/villa-2bd-topview.jpg'], photoAlts: ['Планировка 2BD','Интерьер виллы 2BD','Интерьер виллы 2BD','Интерьер виллы 2BD','Вилла 2BD в разрезе сверху'], positions: ['50% 50%','50% 65%','50% 55%','50% 80%','50% 50%'] },
    '3bd':    { name: '3BD', area: '127,85 м²', cap: '6 чел.', who: 'Семьи с детьми', photos: ['assets/plan-3bd.png','assets/villa-3bd-detail1.jpg','assets/villa-3bd-detail2.jpg','assets/villa-3bd-detail3.jpg','assets/villa-3bd-topview.jpg'], photoAlts: ['Планировка 3BD','Интерьер виллы 3BD','Интерьер виллы 3BD','Интерьер виллы 3BD','Вилла 3BD в разрезе сверху'], positions: ['50% 50%','50% 50%','50% 65%','50% 70%','50% 50%'] },
    '3bdsky': { name: '3BD SKY', area: '136,51 м²', cap: '6 чел.', who: 'Большие семьи', photos: ['assets/plan-3bdsky.png','assets/villa-3bdsky-detail1.jpg','assets/villa-3bdsky-detail2.jpg','assets/villa-3bdsky-detail3.jpg','assets/villa-3bdsky-topview.jpg'], photoAlts: ['Планировка 3BD SKY','Интерьер виллы 3BD SKY','Интерьер виллы 3BD SKY','Интерьер виллы 3BD SKY','Вилла 3BD SKY в разрезе сверху'], positions: ['50% 50%','50% 65%','50% 50%','50% 60%','50% 50%'] },
    '4bd':    { name: '4BD', area: '159,8 м²', cap: '8 чел.', who: 'Большие семьи, несколько поколений', photos: ['assets/plan-4bd.png','assets/villa-4bd-detail1.jpg','assets/villa-4bd-detail2.jpg','assets/villa-4bd-detail3.jpg','assets/villa-4bd-detail4.jpg','assets/villa-4bd-topview.jpg'], photoAlts: ['Планировка 4BD','Интерьер виллы 4BD','Интерьер виллы 4BD','Интерьер виллы 4BD','Интерьер виллы 4BD','Вилла 4BD в разрезе сверху'], positions: ['50% 50%','50% 70%','50% 50%','50% 60%','50% 75%','50% 50%'] },
  },
  en: {
    studio:   { name: 'Studio', area: '31.2 m²', cap: '5 people', who: 'Single, couples', photos: ['assets/plan-studio.png','assets/villa-studio-detail2.jpg','assets/villa-studio-detail3.jpg','assets/villa-studio-detail1.jpg','assets/villa-studio-topview.jpg'], photoAlts: ['Studio floor plan','Studio villa interior','Studio villa interior','Studio villa interior','Studio villa cutaway top view'], positions: ['50% 50%','50% 65%','50% 55%','50% 50%','50% 50%'] },
    '1bd':    { name: '1BD', area: '71.3 m²', cap: '2 people', who: 'Couples', photos: ['assets/plan-1bd.png','assets/villa-1bd-detail1.jpg','assets/villa-1bd-detail2.jpg','assets/villa-1bd-detail3.jpg','assets/villa-1bd-topview.jpg'], photoAlts: ['1BD floor plan','1BD villa interior','1BD villa interior','1BD villa interior','1BD villa cutaway top view'], positions: ['50% 50%','50% 60%','50% 75%','50% 55%','50% 50%'] },
    '1bdsky': { name: '1BD SKY', area: '83.3 m²', cap: '2 people', who: 'Couples, workation', photos: ['assets/plan-1bdsky.png','assets/villa-1bdsky-detail1.jpg','assets/villa-1bdsky-detail2.jpg','assets/villa-1bdsky-detail3.jpg','assets/villa-1bdsky-topview.jpg'], photoAlts: ['1BD SKY floor plan','1BD SKY villa interior','1BD SKY villa interior','1BD SKY villa interior','1BD SKY villa cutaway top view'], positions: ['50% 50%','50% 65%','50% 70%','50% 75%','50% 50%'] },
    '2bd':    { name: '2BD', area: '104.61 m²', cap: '4 people', who: 'Couples with a child, friends', photos: ['assets/plan-2bd.png','assets/villa-2bd-detail1.jpg','assets/villa-2bd-detail2.jpg','assets/villa-2bd-detail3.jpg','assets/villa-2bd-topview.jpg'], photoAlts: ['2BD floor plan','2BD villa interior','2BD villa interior','2BD villa interior','2BD villa cutaway top view'], positions: ['50% 50%','50% 65%','50% 55%','50% 80%','50% 50%'] },
    '3bd':    { name: '3BD', area: '127.85 m²', cap: '6 people', who: 'Families with children', photos: ['assets/plan-3bd.png','assets/villa-3bd-detail1.jpg','assets/villa-3bd-detail2.jpg','assets/villa-3bd-detail3.jpg','assets/villa-3bd-topview.jpg'], photoAlts: ['3BD floor plan','3BD villa interior','3BD villa interior','3BD villa interior','3BD villa cutaway top view'], positions: ['50% 50%','50% 50%','50% 65%','50% 70%','50% 50%'] },
    '3bdsky': { name: '3BD SKY', area: '136.51 m²', cap: '6 people', who: 'Larger families', photos: ['assets/plan-3bdsky.png','assets/villa-3bdsky-detail1.jpg','assets/villa-3bdsky-detail2.jpg','assets/villa-3bdsky-detail3.jpg','assets/villa-3bdsky-topview.jpg'], photoAlts: ['3BD SKY floor plan','3BD SKY villa interior','3BD SKY villa interior','3BD SKY villa interior','3BD SKY villa cutaway top view'], positions: ['50% 50%','50% 65%','50% 50%','50% 60%','50% 50%'] },
    '4bd':    { name: '4BD', area: '159.8 m²', cap: '8 people', who: 'Multi-generational families', photos: ['assets/plan-4bd.png','assets/villa-4bd-detail1.jpg','assets/villa-4bd-detail2.jpg','assets/villa-4bd-detail3.jpg','assets/villa-4bd-detail4.jpg','assets/villa-4bd-topview.jpg'], photoAlts: ['4BD floor plan','4BD villa interior','4BD villa interior','4BD villa interior','4BD villa interior','4BD villa cutaway top view'], positions: ['50% 50%','50% 70%','50% 50%','50% 60%','50% 75%','50% 50%'] },
  }
};
/* ---------- многоэтажные планы/топвиды: слоями, не одним растром ----------
   Картинки этажей (без текста, тесный кроп) + подписи «1-й/2-й этаж» как
   настоящий SVG <text> (не вшито в PNG/JPG — переводимо, редактируемо).
   Координаты x/y/w/h — сырые px 1:1 с Figma-фреймом 1920×1277 (viewBox тех
   же размеров даёт точное совпадение без пересчёта в %), сняты через
   get_nodes_info с "villas plans" (channel 24124zuq). Только для
   двухэтажных форматов; Studio/1BD — один этаж, обычная картинка. */
const FLOOR_LAYOUTS = {
  '1bdsky': {
    plan:   { f2:{src:'assets/plan-1bdsky-f2.png', x:365, y:128, w:846.58, h:601.26}, f1:{src:'assets/plan-1bdsky-f1.png', x:710.67, y:316.93, w:844.07, h:832.07}, label2:{x:1292,y:128}, label1:{x:454,y:1115} },
    render: { f2:{src:'assets/villa-1bdsky-topview-f2.png', x:302, y:128, w:1084, h:675}, f1:{src:'assets/villa-1bdsky-topview-f1.jpg', x:774.68, y:353, w:844.18, h:796}, label2:{x:1466,y:128}, label1:{x:518,y:1115} }
  },
  '2bd': {
    plan:   { f2:{src:'assets/plan-2bd-f2.png', x:203, y:128, w:1030, h:747}, f1:{src:'assets/plan-2bd-f1.png', x:619, y:353, w:1099, h:796}, label2:{x:1313,y:128}, label1:{x:363,y:1115} },
    render: { f2:{src:'assets/villa-2bd-topview-f2.png', x:128, y:139, w:1151.33, h:717.05}, f1:{src:'assets/villa-2bd-topview-f1.png', x:629.79, y:377.73, w:1162.21, h:761.11}, label2:{x:1360,y:139}, label1:{x:373,y:1105} }
  },
  '3bd': {
    plan:   { f2:{src:'assets/plan-3bd-f2.png', x:228, y:128, w:846, h:614}, f1:{src:'assets/plan-3bd-f1.png', x:549, y:293, w:1144, h:856}, label2:{x:1154,y:128}, label1:{x:293,y:1115} },
    render: { f2:{src:'assets/villa-3bd-topview-f2.png', x:184, y:128, w:986, h:614}, f1:{src:'assets/villa-3bd-topview-f1.png', x:588, y:306, w:1149, h:843}, label2:{x:1250,y:128}, label1:{x:332,y:1115} }
  },
  '3bdsky': {
    plan:   { f2:{src:'assets/plan-3bdsky-f2.png', x:593, y:128, w:735, h:414}, f1:{src:'assets/plan-3bdsky-f1.png', x:683, y:615, w:555, h:534}, label2:{x:1408,y:128}, label1:{x:427,y:1115} },
    render: { f2:{src:'assets/villa-3bdsky-topview-f2.png', x:613, y:128, w:695, h:345}, f1:{src:'assets/villa-3bdsky-topview-f1.png', x:653, y:547, w:615, h:602} }
  },
  '4bd': {
    plan:   { f2:{src:'assets/plan-4bd-f2.png', x:597, y:128, w:726.94, h:416.46}, f1:{src:'assets/plan-4bd-f1.png', x:597.18, y:569.70, w:726.76, h:579.30}, label2:{x:1404,y:128}, label1:{x:341,y:1115} },
    render: { f2:{src:'assets/villa-4bd-topview-f2.png', x:560, y:128, w:800, h:397}, f1:{src:'assets/villa-4bd-topview-f1.png', x:560, y:561, w:800, h:588}, label2:{x:1440,y:128}, label1:{x:304,y:1115} }
  }
};
const FLOOR_LABEL_TEXT = {
  ru: { f2: '2-й этаж', f1: '1-й этаж' },
  en: { f2: '2nd floor', f1: '1st floor' }
};
function buildFloorsSVG(layout, lang, showLabels) {
  if (showLabels === undefined) showLabels = true;
  const t = FLOOR_LABEL_TEXT[lang] || FLOOR_LABEL_TEXT.ru;
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 1920 1277');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.classList.add('plan-floors-svg');
  [layout.f2, layout.f1].forEach(part => {
    const img = document.createElementNS(svgNS, 'image');
    img.setAttribute('href', ASSET(part.src));
    img.setAttribute('x', part.x); img.setAttribute('y', part.y);
    img.setAttribute('width', part.w); img.setAttribute('height', part.h);
    svg.appendChild(img);
  });
  /* showLabels=false — правка Босса 03.08 (только v2, см. renderPlan):
     подписи "1-й/2-й этаж" на схемах убраны, план сам по себе достаточно
     читаем в раскрывашке. v1 продолжает получать true по умолчанию. */
  if (showLabels) {
    [['label2', layout.label2], ['label1', layout.label1]].forEach(([key, pos]) => {
      if (!pos) return;
      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', pos.x); text.setAttribute('y', pos.y + 34);
      text.setAttribute('font-size', '48'); text.setAttribute('fill', '#3a3a3a');
      text.textContent = t[key.replace('label', 'f')];
      svg.appendChild(text);
    });
  }
  return svg;
}
const plansTabs = document.getElementById('plansTabs');
function renderPlan(planId, lang) {
  const p = (PLANS[lang] || PLANS.en)[planId];
  if (!p) return;
  document.getElementById('planName').textContent = p.name;
  const planAreaEl = document.getElementById('planArea');
  const planCapEl = document.getElementById('planCap');
  planAreaEl.textContent = p.area; planAreaEl.dataset.counted = '';
  planCapEl.textContent = p.cap; planCapEl.dataset.counted = '';
  document.getElementById('planWho').textContent = p.who;
  animateNumberIn(planAreaEl); animateNumberIn(planCapEl);
  /* число фото разное по типам (5 у большинства, 6 у 4BD). Индексы в p.photos:
     [0]=план, [1..length-2]=интерьерные фото виллы, [length-1]=topview.
     Точки индикатора не хардкожены в HTML — пересобираются под фактическое
     число слайдов через plansPhotoSlider.setCount(). */
  const track = document.getElementById('plansPhotoTrack');
  const planImg = document.getElementById('planImg');
  const planToggleImg = document.getElementById('planToggleImg');
  const floors = FLOOR_LAYOUTS[planId];

  if (planToggleImg) {
    /* v2: план вынесен из карусели в раскрывашку «Смотреть планировку» —
       реф Figma «план1»/«план2» (295:331/332, канал 41fc2tir). Карусель ниже
       держит интерьерные фото + topview (как в v1), план — отдельно в панели,
       без подписей этажей (buildFloorsSVG(...,false), см. функцию выше). */
    const planBox = planToggleImg.parentElement;
    const oldPlanSvg = planBox.querySelector('svg.plan-floors-svg');
    if (oldPlanSvg) oldPlanSvg.remove();
    if (floors) {
      planToggleImg.style.display = 'none';
      planBox.appendChild(buildFloorsSVG(floors.plan, lang, false));
    } else {
      planToggleImg.style.display = ''; planToggleImg.src = ASSET(p.photos[0]); planToggleImg.alt = p.photoAlts[0];
    }
    track.querySelectorAll('.plans-viewer-slide').forEach(el => el.remove());
    for (let i = 1; i < p.photos.length; i++) {
      const isTopview = i === p.photos.length - 1;
      const slide = document.createElement('div');
      slide.className = 'plans-viewer-slide' + (isTopview ? ' plans-viewer-slide--topview' : '');
      if (isTopview) {
        /* рендер-слайд (последний в галерее виллы) стоит на размытом фото
           самой виллы, не на белом листе (правка Босса 05.08) — берём
           предпоследний интерьерный кадр того же типа, CSS блюрит его в
           ::before (.plans-viewer-slide--topview, v2.css) */
        slide.style.setProperty('--topview-bg', `url(${ASSET(p.photos[i - 1])})`);
      }
      if (isTopview && floors) {
        slide.appendChild(buildFloorsSVG(floors.render, lang, false));
      } else {
        const img = document.createElement('img');
        img.className = 'plan-photo-img';
        /* НЕ loading="lazy" — тот же баг, что чинили в min-gallery/feat-track
           (коммит ca4a0c2): в горизонтальном scroll-snap треке офскрин-кадры
           не подгружаются браузером вовремя, слайд виснет пустым/долго грузится
           при переключении таба виллы, пока юзер не подождёт или не проскроллит */
        img.src = ASSET(p.photos[i]);
        img.alt = p.photoAlts[i];
        if (p.positions && p.positions[i]) img.style.objectPosition = p.positions[i];
        slide.appendChild(img);
      }
      track.appendChild(slide);
    }
    track.scrollLeft = 0;
    plansPhotoSlider && plansPhotoSlider.setCount(p.photos.length - 1);
    return;
  }

  /* v1: план, фото и topview — одна общая карусель (не трогаем, старое
     поведение). Порядок: интерьерные фото ПЕРЕД планом (фикс. слайд в
     разметке), topview — ПОСЛЕДНИМ слайдом (после плана). */
  const planSlide = track.querySelector('.plans-viewer-slide--plan');
  const oldPlanSvg = planSlide.querySelector('svg.plan-floors-svg');
  if (oldPlanSvg) oldPlanSvg.remove();
  if (floors) {
    if (planImg) planImg.style.display = 'none';
    planSlide.appendChild(buildFloorsSVG(floors.plan, lang));
  } else {
    if (planImg) { planImg.style.display = ''; planImg.src = ASSET(p.photos[0]); planImg.alt = p.photoAlts[0]; }
  }
  track.querySelectorAll('.plans-viewer-slide:not(.plans-viewer-slide--plan)').forEach(el => el.remove());
  for (let i = 1; i < p.photos.length; i++) {
    const isTopview = i === p.photos.length - 1;
    const slide = document.createElement('div');
    slide.className = 'plans-viewer-slide' + (isTopview ? ' plans-viewer-slide--topview' : '');
    if (isTopview && floors) {
      slide.appendChild(buildFloorsSVG(floors.render, lang));
    } else {
      const img = document.createElement('img');
      img.className = 'plan-photo-img';
      img.src = ASSET(p.photos[i]);
      img.alt = p.photoAlts[i];
      if (p.positions && p.positions[i]) img.style.objectPosition = p.positions[i];
      slide.appendChild(img);
    }
    if (isTopview) track.appendChild(slide); else track.insertBefore(slide, planSlide);
  }
  track.scrollLeft = 0;
  plansPhotoSlider && plansPhotoSlider.setCount(p.photos.length);
}
if (plansTabs) {
  plansTabs.addEventListener('click', e => {
    const btn = e.target.closest('.plans-tab');
    if (!btn) return;
    plansTabs.querySelectorAll('.plans-tab').forEach(t => t.classList.remove('is-active'));
    btn.classList.add('is-active');
    renderPlan(btn.dataset.plan, window.__bsoLang || 'en');
  });
  /* вызывается из setLang() при смене языка — перерисовывает АКТИВНЫЙ таб на новом языке */
  window.__bsoSyncPlan = function (lang) {
    const active = plansTabs.querySelector('.plans-tab.is-active');
    renderPlan(active ? active.dataset.plan : 'studio', lang);
  };
  /* статичная разметка studio в HTML не знает про object-position — рендерим
     сразу при загрузке, чтобы кроп первого таба тоже был по positions, а не
     дефолтным 50/50 */
  renderPlan('studio', window.__bsoLang || 'en');

  /* Фоновый прелоад фото ОСТАЛЬНЫХ планировок. Жалоба Босса 20.08: «в разделе
     с планировками фото очень долго грузят» — раньше кадры таба тянулись только
     в момент клика по табу (~2 МБ за раз). Ассеты уже пережаты (−56%), а тут
     после первого экрана, в простое браузера, тихо кэшируем интерьерные фото,
     топ-виды и схемы всех типов по одному — переключение таба становится
     мгновенным, а первый экран не тормозится. */
  (function preloadPlans() {
    var urls = [], data = PLANS.en || {};
    Object.keys(data).forEach(function (k) {
      (data[k].photos || []).forEach(function (s) { urls.push(ASSET(s)); });
    });
    Object.keys(FLOOR_LAYOUTS).forEach(function (k) {
      ['plan', 'render'].forEach(function (which) {
        var L = FLOOR_LAYOUTS[k][which];
        ['f1', 'f2'].forEach(function (f) { if (L && L[f]) urls.push(ASSET(L[f].src)); });
      });
    });
    urls = urls.filter(function (u, i) { return urls.indexOf(u) === i; });
    var i = 0, idle = window.requestIdleCallback || function (cb) { return setTimeout(cb, 200); };
    (function next() {
      if (i >= urls.length) return;
      var img = new Image();
      img.onload = img.onerror = function () { idle(next); };
      img.src = urls[i++];
    })();
  })();
}

/* ---------- заглушки (сертификаты/юр.страницы/соцсети) — реальных страниц ещё нет ---------- */
/* href="#" вместо javascript:void(0) — крауler-friendly (см. SEO-аудит Lighthouse),
   preventDefault не даёт странице прыгать вверх/скроллить */
document.querySelectorAll('.placeholder-link').forEach(a => {
  a.addEventListener('click', e => e.preventDefault());
});

/* ---------- переключатель языка ---------- */
document.querySelectorAll('[data-lang]').forEach(btn => {
  btn.addEventListener('click', () => window.setLang && window.setLang(btn.dataset.lang));
});
/* английская версия — основная (правка Босса): статическая разметка index.html
   тоже на EN, поэтому первый кадр не мигает переводом. RU остаётся по кнопке и
   запоминается в localStorage */
if (window.setLang) {
  let initialLang = 'en';
  try { initialLang = localStorage.getItem('bso_lang') || 'en'; } catch (e) {}
  window.setLang(initialLang);
}

/* ---------- уведомление про куки/локальное хранилище ----------
   Сайт — статика без бэкенда: сейчас в браузере хранятся только язык (bso_lang),
   тема (bsoTheme) и сам факт согласия. Баннер показывается один раз, ждёт пару
   секунд, чтобы не перебивать первый экран, и уступает модалке заявки. */
const cookieNote = document.getElementById('cookieNote');
if (cookieNote) {
  let accepted = false;
  try { accepted = localStorage.getItem('bso_cookie_ok') === '1'; } catch (e) {}
  if (!accepted) {
    setTimeout(() => cookieNote.classList.add('is-open'), 1800);
    const okBtn = document.getElementById('cookieOk');
    if (okBtn) okBtn.addEventListener('click', () => {
      cookieNote.classList.remove('is-open');
      try { localStorage.setItem('bso_cookie_ok', '1'); } catch (e) {}
    });
  }
}

/* ---------- переключатель темы (служебный, не для клиентов) ---------- */
const themeSwitch = document.getElementById('themeSwitch');
if (themeSwitch) {
  const buttons = themeSwitch.querySelectorAll('[data-theme-btn]');
  const applyTheme = (theme) => {
    if (theme === 'mono') document.documentElement.setAttribute('data-theme', 'mono');
    else document.documentElement.removeAttribute('data-theme');
    buttons.forEach(b => b.classList.toggle('is-active', b.dataset.themeBtn === theme));
  };
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.themeBtn;
      try { localStorage.setItem('bsoTheme', theme); } catch (e) {}
      applyTheme(theme);
    });
  });
  let savedTheme = 'default';
  try { savedTheme = localStorage.getItem('bsoTheme') || 'default'; } catch (e) {}
  applyTheme(savedTheme);
}
