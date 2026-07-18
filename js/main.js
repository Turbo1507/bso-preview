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
function wireCarousel(trackId, prevId, nextId, step) {
  const track = document.getElementById(trackId);
  const prev = document.getElementById(prevId);
  const next = document.getElementById(nextId);
  if (!track) return;
  const scrollBy = () => track.clientWidth * 0.7 || step;
  prev && prev.addEventListener('click', () => track.scrollBy({ left: -scrollBy(), behavior: 'smooth' }));
  next && next.addEventListener('click', () => track.scrollBy({ left: scrollBy(), behavior: 'smooth' }));
}
wireCarousel('featTrack', 'featPrev', 'featNext', 400);
wireCarousel('stepsTrack', 'stepsPrev', 'stepsNext', 300);

/* ---------- фильтр-пилюли карусели преимуществ (визуальный тоггл) ---------- */
document.querySelectorAll('.feat-filters .tag-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.feat-filters .tag-pill').forEach(p => p.classList.remove('is-active'));
    pill.classList.add('is-active');
  });
});

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
