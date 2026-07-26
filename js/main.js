/* BLACK SANDS OASIS — базовый интерактив: header, reveal, карусели, табы планировок */

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
function wireSlider(trackId, prevId, nextId, dotsId) {
  const track = document.getElementById(trackId);
  const prev = document.getElementById(prevId);
  const next = document.getElementById(nextId);
  const dotsWrap = document.getElementById(dotsId);
  if (!track) return;
  const dots = dotsWrap ? Array.from(dotsWrap.children) : [];
  function sync() {
    const max = track.scrollWidth - track.clientWidth;
    if (prev) prev.disabled = track.scrollLeft <= 4;
    if (next) next.disabled = track.scrollLeft >= max - 4;
    if (dots.length) {
      const idx = Math.round(track.scrollLeft / (track.clientWidth || 1));
      dots.forEach((d, i) => d.classList.toggle('on', i === Math.min(idx, dots.length - 1)));
    }
  }
  prev && prev.addEventListener('click', () => track.scrollBy({ left: -track.clientWidth, behavior: 'smooth' }));
  next && next.addEventListener('click', () => track.scrollBy({ left: track.clientWidth, behavior: 'smooth' }));
  track.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync);
  sync();
  return { sync };
}
wireSlider('minGalleryTrack', 'minGalleryPrev', 'minGalleryNext', 'minGalleryDots');
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
const nuanuPinsWrap = document.getElementById('nuanuPins');
if (nuanuPinsWrap) {
  /* preserveAspectRatio="none" мапит viewBox 100x100 на контейнер 2:1
     (width:height контейнера ≠ viewBox) — X и Y растягиваются РАЗНЫМИ
     коэффициентами, поэтому circle (r одинаковый по X/Y) на выходе сплюснут
     в эллипс по вертикали вдвое; компенсируем через ellipse с ry=2×rx, и
     non-scaling-stroke, чтобы толщина линии не "гуляла" в зависимости от угла */
  const lines = NUANU_PINS.map(p => `<line x1="${p.dot[0]}" y1="${p.dot[1]}" x2="${p.label[0]}" y2="${p.label[1]}" vector-effect="non-scaling-stroke"/><ellipse cx="${p.dot[0]}" cy="${p.dot[1]}" rx=".35" ry=".7"/>`).join('');
  const labels = NUANU_PINS.map(p => `<span class="nuanu-pin-label" style="left:${p.label[0]}%;top:${p.label[1]}%" data-ru="${p.ru}" data-en="${p.en}">${p.ru}</span>`).join('');
  nuanuPinsWrap.innerHTML = `<svg class="nuanu-pins-svg" viewBox="0 0 100 100" preserveAspectRatio="none">${lines}</svg>${labels}`;
}
window.__bsoSyncNuanuPins = function (lang) {
  if (!nuanuPinsWrap) return;
  nuanuPinsWrap.querySelectorAll('.nuanu-pin-label').forEach(el => {
    el.textContent = lang === 'en' ? el.dataset.en : el.dataset.ru;
  });
};

/* ---------- планировки: верхние табы (правка Босса — раньше были слева) ---------- */
/* Площадь — реальные цифры из официальной презентации bso-presentation_eng.pdf
   (unitdeveloper.com/for-partners/black-sands-oasis/), таблица "MASTER PLAN OF
   VILLAS" + отдельные слайды по каждому юниту, с них же взяты img (планировка,
   кроп реального скана, не рисовано самостоятельно). Вместимость/"для кого" в
   презентации не указаны по большинству форматов — НЕ придумывать, оставлять
   честное "уточняется"/"TBD" до реальных данных (кроме Studio, где эти два
   поля были заданы раньше). Двуязычно: PLANS[lang][planId] — синхронизируется
   с setLang() через window.__bsoSyncPlan (см. js/i18n.js). */
/* photo/photoAlt — реальные интерьерные рендеры по типам, вырезаны из
   презентации (bso-presentation_eng.pdf, стр. 31/33/35/37/39/41/43 —
   1:1 соответствие с материалом Figma "МАТЕРИАЛ ДЛЯ ЗАПОЛНЕНИЯ..."), не
   стоковые/придуманные фото */
const PLANS = {
  ru: {
    studio:   { name: 'Studio', area: '31,2 м²', cap: '5 чел.', who: 'Один, пары', photos: ['assets/plan-studio.png','assets/villa-studio-detail1.jpg','assets/villa-studio-detail2.jpg','assets/villa-studio-detail3.jpg'], photoAlts: ['Планировка Studio','Интерьер виллы Studio','Интерьер виллы Studio','Интерьер виллы Studio'], positions: ['50% 50%','50% 50%','50% 65%','50% 55%'] },
    '1bd':    { name: '1BD', area: '71,3 м²', cap: 'Уточняется', who: 'Уточняется', photos: ['assets/plan-1bd.png','assets/villa-1bd-detail1.jpg','assets/villa-1bd-detail2.jpg','assets/villa-1bd-detail3.jpg'], photoAlts: ['Планировка 1BD','Интерьер виллы 1BD','Интерьер виллы 1BD','Интерьер виллы 1BD'], positions: ['50% 50%','50% 60%','50% 75%','50% 55%'] },
    '1bdsky': { name: '1BD SKY', area: '83,3 м²', cap: 'Уточняется', who: 'Уточняется', photos: ['assets/plan-1bdsky.png','assets/villa-1bdsky-detail1.jpg','assets/villa-1bdsky-detail2.jpg','assets/villa-1bdsky-detail3.jpg'], photoAlts: ['Планировка 1BD SKY','Интерьер виллы 1BD SKY','Интерьер виллы 1BD SKY','Интерьер виллы 1BD SKY'], positions: ['50% 50%','50% 65%','50% 70%','50% 75%'] },
    '2bd':    { name: '2BD', area: '104,61 м²', cap: 'Уточняется', who: 'Уточняется', photos: ['assets/plan-2bd.png','assets/villa-2bd-detail1.jpg','assets/villa-2bd-detail2.jpg','assets/villa-2bd-detail3.jpg'], photoAlts: ['Планировка 2BD','Интерьер виллы 2BD','Интерьер виллы 2BD','Интерьер виллы 2BD'], positions: ['50% 50%','50% 65%','50% 55%','50% 80%'] },
    '3bd':    { name: '3BD', area: '127,85 м²', cap: 'Уточняется', who: 'Уточняется', photos: ['assets/plan-3bd.png','assets/villa-3bd-detail1.jpg','assets/villa-3bd-detail2.jpg','assets/villa-3bd-detail3.jpg'], photoAlts: ['Планировка 3BD','Интерьер виллы 3BD','Интерьер виллы 3BD','Интерьер виллы 3BD'], positions: ['50% 50%','50% 50%','50% 65%','50% 70%'] },
    '3bdsky': { name: '3BD SKY', area: '136,51 м²', cap: 'Уточняется', who: 'Уточняется', photos: ['assets/plan-3bdsky.png','assets/villa-3bdsky-detail1.jpg','assets/villa-3bdsky-detail2.jpg','assets/villa-3bdsky-detail3.jpg'], photoAlts: ['Планировка 3BD SKY','Интерьер виллы 3BD SKY','Интерьер виллы 3BD SKY','Интерьер виллы 3BD SKY'], positions: ['50% 50%','50% 65%','50% 50%','50% 60%'] },
    '4bd':    { name: '4BD', area: '159,8 м²', cap: 'Уточняется', who: 'Уточняется', photos: ['assets/plan-4bd.png','assets/villa-4bd-detail1.jpg','assets/villa-4bd-detail2.jpg','assets/villa-4bd-detail3.jpg','assets/villa-4bd-detail4.jpg'], photoAlts: ['Планировка 4BD','Интерьер виллы 4BD','Интерьер виллы 4BD','Интерьер виллы 4BD','Интерьер виллы 4BD'], positions: ['50% 50%','50% 70%','50% 50%','50% 60%','50% 75%'] },
  },
  en: {
    studio:   { name: 'Studio', area: '31.2 m²', cap: '5 people', who: 'Single, couples', photos: ['assets/plan-studio.png','assets/villa-studio-detail1.jpg','assets/villa-studio-detail2.jpg','assets/villa-studio-detail3.jpg'], photoAlts: ['Studio floor plan','Studio villa interior','Studio villa interior','Studio villa interior'], positions: ['50% 50%','50% 50%','50% 65%','50% 55%'] },
    '1bd':    { name: '1BD', area: '71.3 m²', cap: 'TBD', who: 'TBD', photos: ['assets/plan-1bd.png','assets/villa-1bd-detail1.jpg','assets/villa-1bd-detail2.jpg','assets/villa-1bd-detail3.jpg'], photoAlts: ['1BD floor plan','1BD villa interior','1BD villa interior','1BD villa interior'], positions: ['50% 50%','50% 60%','50% 75%','50% 55%'] },
    '1bdsky': { name: '1BD SKY', area: '83.3 m²', cap: 'TBD', who: 'TBD', photos: ['assets/plan-1bdsky.png','assets/villa-1bdsky-detail1.jpg','assets/villa-1bdsky-detail2.jpg','assets/villa-1bdsky-detail3.jpg'], photoAlts: ['1BD SKY floor plan','1BD SKY villa interior','1BD SKY villa interior','1BD SKY villa interior'], positions: ['50% 50%','50% 65%','50% 70%','50% 75%'] },
    '2bd':    { name: '2BD', area: '104.61 m²', cap: 'TBD', who: 'TBD', photos: ['assets/plan-2bd.png','assets/villa-2bd-detail1.jpg','assets/villa-2bd-detail2.jpg','assets/villa-2bd-detail3.jpg'], photoAlts: ['2BD floor plan','2BD villa interior','2BD villa interior','2BD villa interior'], positions: ['50% 50%','50% 65%','50% 55%','50% 80%'] },
    '3bd':    { name: '3BD', area: '127.85 m²', cap: 'TBD', who: 'TBD', photos: ['assets/plan-3bd.png','assets/villa-3bd-detail1.jpg','assets/villa-3bd-detail2.jpg','assets/villa-3bd-detail3.jpg'], photoAlts: ['3BD floor plan','3BD villa interior','3BD villa interior','3BD villa interior'], positions: ['50% 50%','50% 50%','50% 65%','50% 70%'] },
    '3bdsky': { name: '3BD SKY', area: '136.51 m²', cap: 'TBD', who: 'TBD', photos: ['assets/plan-3bdsky.png','assets/villa-3bdsky-detail1.jpg','assets/villa-3bdsky-detail2.jpg','assets/villa-3bdsky-detail3.jpg'], photoAlts: ['3BD SKY floor plan','3BD SKY villa interior','3BD SKY villa interior','3BD SKY villa interior'], positions: ['50% 50%','50% 65%','50% 50%','50% 60%'] },
    '4bd':    { name: '4BD', area: '159.8 m²', cap: 'TBD', who: 'TBD', photos: ['assets/plan-4bd.png','assets/villa-4bd-detail1.jpg','assets/villa-4bd-detail2.jpg','assets/villa-4bd-detail3.jpg','assets/villa-4bd-detail4.jpg'], photoAlts: ['4BD floor plan','4BD villa interior','4BD villa interior','4BD villa interior','4BD villa interior'], positions: ['50% 50%','50% 70%','50% 50%','50% 60%','50% 75%'] },
  }
};
const plansTabs = document.getElementById('plansTabs');
function renderPlan(planId, lang) {
  const p = (PLANS[lang] || PLANS.ru)[planId];
  if (!p) return;
  document.getElementById('planName').textContent = p.name;
  document.getElementById('planArea').textContent = p.area;
  document.getElementById('planCap').textContent = p.cap;
  document.getElementById('planWho').textContent = p.who;
  /* число фото разное по типам (3 у большинства, 4 у 4BD) — слайды-фото
     пересобираются каждый раз; план — ПОСЛЕДНИЙ слайд (по правке Босса), не
     первый — новые фото-слайды вставляются ПЕРЕД ним, не после */
  const track = document.getElementById('plansPhotoTrack');
  const planSlide = track.querySelector('.plans-viewer-slide--plan');
  const planImg = document.getElementById('planImg');
  if (planImg) { planImg.src = p.photos[0]; planImg.alt = p.photoAlts[0]; }
  track.querySelectorAll('.plans-viewer-slide:not(.plans-viewer-slide--plan)').forEach(el => el.remove());
  for (let i = 1; i < p.photos.length; i++) {
    const slide = document.createElement('div');
    slide.className = 'plans-viewer-slide';
    const img = document.createElement('img');
    img.className = 'plan-photo-img';
    img.loading = 'lazy';
    img.src = p.photos[i];
    img.alt = p.photoAlts[i];
    if (p.positions && p.positions[i]) img.style.objectPosition = p.positions[i];
    slide.appendChild(img);
    track.insertBefore(slide, planSlide);
  }
  track.scrollLeft = 0;
  plansPhotoSlider && plansPhotoSlider.sync();
}
if (plansTabs) {
  plansTabs.addEventListener('click', e => {
    const btn = e.target.closest('.plans-tab');
    if (!btn) return;
    plansTabs.querySelectorAll('.plans-tab').forEach(t => t.classList.remove('is-active'));
    btn.classList.add('is-active');
    renderPlan(btn.dataset.plan, window.__bsoLang || 'ru');
  });
  /* вызывается из setLang() при смене языка — перерисовывает АКТИВНЫЙ таб на новом языке */
  window.__bsoSyncPlan = function (lang) {
    const active = plansTabs.querySelector('.plans-tab.is-active');
    renderPlan(active ? active.dataset.plan : 'studio', lang);
  };
  /* статичная разметка studio в HTML не знает про object-position — рендерим
     сразу при загрузке, чтобы кроп первого таба тоже был по positions, а не
     дефолтным 50/50 */
  renderPlan('studio', window.__bsoLang || 'ru');
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
if (window.setLang) {
  let initialLang = 'ru';
  try { initialLang = localStorage.getItem('bso_lang') || 'ru'; } catch (e) {}
  window.setLang(initialLang);
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
