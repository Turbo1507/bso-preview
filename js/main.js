/* BLACK SANDS OASIS — базовый интерактив: header, reveal, карусели, табы планировок */

/* ---------- header solid on scroll ---------- */
const header = document.getElementById('header');
function syncHeader() { header.classList.toggle('is-solid', window.scrollY > 40); }
document.addEventListener('scroll', syncHeader, { passive: true });
syncHeader();

/* ---------- burger (мобильное меню — простое раскрытие nav) ---------- */
const burger = document.getElementById('burger');
if (burger) {
  burger.addEventListener('click', () => {
    const nav = document.querySelector('.nav');
    const open = nav.style.display === 'flex';
    nav.style.cssText = open ? '' : 'display:flex; flex-direction:column; position:fixed; top:64px; left:0; right:0; background:rgba(23,24,26,.97); padding:20px 24px; gap:18px;';
  });
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

/* ---------- планировки: верхние табы (правка Босса — раньше были слева) ---------- */
/* ВНИМАНИЕ: в Figma-прототипе реальные цифры (площадь/вместимость) указаны
   только для Studio. Для остальных форматов Босс их пока не давал —
   НЕ придумывать, показывать честное "уточняется" до реальных данных. */
const PLAN_TBD = 'Уточняется';
const PLANS = {
  studio:  { name: 'Studio',   area: '25 м²',  cap: '5 чел.',  who: 'Один, пары' },
  '1bd':   { name: '1BD',      area: PLAN_TBD, cap: PLAN_TBD, who: PLAN_TBD },
  '1bdsky':{ name: '1BD SKY',  area: PLAN_TBD, cap: PLAN_TBD, who: PLAN_TBD },
  '2bd':   { name: '2BD',      area: PLAN_TBD, cap: PLAN_TBD, who: PLAN_TBD },
  '3bd':   { name: '3BD',      area: PLAN_TBD, cap: PLAN_TBD, who: PLAN_TBD },
  '3bdsky':{ name: '3BD SKY',  area: PLAN_TBD, cap: PLAN_TBD, who: PLAN_TBD },
  '4bd':   { name: '4BD',      area: PLAN_TBD, cap: PLAN_TBD, who: PLAN_TBD }
};
const plansTabs = document.getElementById('plansTabs');
if (plansTabs) {
  plansTabs.addEventListener('click', e => {
    const btn = e.target.closest('.plans-tab');
    if (!btn) return;
    plansTabs.querySelectorAll('.plans-tab').forEach(t => t.classList.remove('is-active'));
    btn.classList.add('is-active');
    const p = PLANS[btn.dataset.plan];
    if (!p) return;
    document.getElementById('planName').textContent = p.name;
    document.getElementById('planArea').textContent = p.area;
    document.getElementById('planCap').textContent = p.cap;
    document.getElementById('planWho').textContent = p.who;
  });
}
