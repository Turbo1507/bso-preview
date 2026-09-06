/* Генератор RU-страницы BSO: собирает ru/index.html из index.html + переводов
   window.I18N.ru (js/i18n.js). Запускать после ЛЮБОЙ правки index.html или
   RU-строк:  node build-ru.mjs
   Что делает:
   - применяет ru-строки к [data-i18n] (innerHTML), [data-i18n-content] (meta),
     [data-i18n-alt] (alt=), [data-i18n-aria] (aria-label=)
   - <html lang="ru">, canonical -> /ru/, og/twitter title+desc+locale -> RU
   - hreflang-трио, ассеты -> абсолютные пути (/css /js /assets), т.к. /ru/ глубже
   - JSON-LD -> RU (описание комплекса + FAQ), inLanguage ru
   - переключатель языка: RU активен, клик EN -> переход на "/"
   Всю разметку/скрипты берём как есть — RU-страница это тот же сайт на другом URL. */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

global.window = {};
await import('./js/i18n.js');
await import('./js/v2-i18n.js');   // мержит строки блока 3 «Виллы» и FAQ в window.I18N
const RU = global.window.I18N.ru;
if (!RU || Object.keys(RU).length < 150) { console.error('I18N.ru не загрузился (нужны i18n.js + v2-i18n.js)'); process.exit(1); }

let html = readFileSync('index.html', 'utf8');
const O = 'https://blacksandsoasis.com';

// ---- 1. data-i18n (innerHTML) ----
html = html.replace(/(<([a-zA-Z0-9]+)\b[^>]*\bdata-i18n="([^"]+)"[^>]*>)([\s\S]*?)(<\/\2>)/g,
  (m, open, tag, key, _inner, close) => (key in RU) ? open + RU[key] + close : m);

// ---- 2. data-i18n-content (meta content=) ----
html = html.replace(/<meta\b[^>]*\bdata-i18n-content="([^"]+)"[^>]*>/g, (m, key) => {
  if (!(key in RU)) return m;
  return m.replace(/\bcontent="[^"]*"/, `content="${RU[key].replace(/"/g,'&quot;')}"`);
});

// ---- 3. data-i18n-alt / data-i18n-aria ----
html = html.replace(/<[^>]*\bdata-i18n-alt="([^"]+)"[^>]*>/g, (m, key) => {
  if (!(key in RU)) return m;
  const v = RU[key].replace(/"/g,'&quot;');
  return /\balt="/.test(m) ? m.replace(/\balt="[^"]*"/, `alt="${v}"`) : m.replace(/<([a-zA-Z0-9]+)\b/, `<$1 alt="${v}"`);
});
html = html.replace(/<[^>]*\bdata-i18n-aria="([^"]+)"[^>]*>/g, (m, key) => {
  if (!(key in RU)) return m;
  const v = RU[key].replace(/"/g,'&quot;');
  return /\baria-label="/.test(m) ? m.replace(/\baria-label="[^"]*"/, `aria-label="${v}"`) : m.replace(/<([a-zA-Z0-9]+)\b/, `<$1 aria-label="${v}"`);
});

// ---- 4. <html lang> ----
html = html.replace(/<html\b[^>]*>/, '<html lang="ru">');

// ---- 4b. <base href="/"> ----
// страница живёт на /ru/, но весь JS (main.js, units-plan.js, iplan-map.js…)
// строит пути к картинкам относительно ("assets/…"). BSO_ASSET_PREFIX покрывает
// лишь ~10 из ~100 таких мест. <base href="/"> заставляет ВСЕ относительные
// URL (в разметке и вставленные из JS) резолвиться от корня сайта.
if (!/<base\b/.test(html)) {
  html = html.replace(/(<meta charset="[^"]*">)/i, '$1\n<base href="/">');
}
// URL = язык: фиксируем bso_lang=ru ДО загрузки main.js, иначе он читает
// localStorage (или дефолт 'en') и перерисовывает страницу обратно в EN.
// В index.html этот скрипт ставит 'en' — здесь просто переопределяем на 'ru'.
if (html.includes("bso_lang','en'")) {
  html = html.replace("bso_lang','en'", "bso_lang','ru'");
} else {
  html = html.replace(/(<base href="\/">)/, "$1\n<script>try{localStorage.setItem('bso_lang','ru')}catch(e){}</script>");
}
// внутристраничные якоря при наличии <base> уводят на "/" (EN-страница) —
// прибиваем их к /ru/, чтобы прокрутка оставалась на русской версии
html = html.replace(/href="#([a-z0-9-]*)"/gi, 'href="/ru/#$1"');

// ---- 5. <title> (data-i18n loop уже подставил meta.title в innerHTML, но
//         на всякий случай гарантируем) ----
html = html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/, `<title>${RU['meta.title']}</title>`);

// ---- 6. canonical + hreflang ----
// сначала выкидываем ВСЕ существующие alternate-hreflang из исходника (EN-страница
// их несёт), потом ставим свои — реципрокные для /ru/
html = html.replace(/[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*">\s*\n?/g, '');
html = html.replace(/<link rel="canonical"[^>]*>/,
  `<link rel="canonical" href="${O}/ru/">\n` +
  `<link rel="alternate" hreflang="ru" href="${O}/ru/">\n` +
  `<link rel="alternate" hreflang="en" href="${O}/">\n` +
  `<link rel="alternate" hreflang="x-default" href="${O}/">`);

// ---- 7. og / twitter ----
const esc = s => s.replace(/"/g,'&quot;');
html = html
  .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(RU['meta.title'])}$2`)
  .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(RU['meta.desc'])}$2`)
  .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(RU['meta.title'])}$2`)
  .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(RU['meta.desc'])}$2`)
  .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${O}/ru/$2`)
  .replace(/(<meta property="og:locale" content=")[^"]*(")/, `$1ru_RU$2`)
  .replace(/(<meta property="og:locale:alternate" content=")[^"]*(")/, `$1en_US$2`);

// ---- 8. ассеты оставляем относительными: <base href="/"> (см. п.4b) уже
//         резолвит css/ js/ assets/ от корня и в разметке, и из JS ----

// ---- 9. JSON-LD -> RU ----
const faqRu = [1,2,3,4,5].map(i => ({
  '@type': 'Question', name: RU[`faq.q${i}`],
  acceptedAnswer: { '@type': 'Answer', text: RU[`faq.a${i}`] }
}));
const graph = [
  { '@type':'Organization','@id':`${O}/#org`, name:'Black Sands Oasis',
    alternateName:['BSO','БСО','Блэк Сэндс Оазис'], url:`${O}/`,
    logo:`${O}/assets/favicon.svg`, image:`${O}/assets/facade-sunset.jpg`,
    description:'Девелопер Black Sands Oasis (БСО) — камерных вилл в стиле Desert Modernism в кластере Нуану, Бали. Проект UNIT.',
    parentOrganization:{ '@type':'Organization', name:'UNIT', url:'https://unitdeveloper.com/' },
    sameAs:['https://unitdeveloper.com/'],
    areaServed:{ '@type':'Place', name:'Бали, Индонезия' } },
  { '@type':'WebSite','@id':`${O}/#website`, url:`${O}/`, name:'Black Sands Oasis',
    inLanguage:['ru','en'], publisher:{ '@id':`${O}/#org` } },
  { '@type':'ApartmentComplex','@id':`${O}/#complex`, name:'Black Sands Oasis (БСО)',
    url:`${O}/ru/`,
    description:'Закрытый кластер камерных вилл в стиле Desert Modernism в Нуану на западном побережье Бали: 7 планировок от 31 до 160 м², приватные бассейны и сады, шестиметровые потолки, панорамное остекление и программа управляемой аренды.',
    numberOfAccommodationUnits:111,
    image:[`${O}/assets/facade-sunset.jpg`,`${O}/assets/villa-exterior-pool1.jpg`,`${O}/assets/villa-private-pool.jpg`],
    address:{ '@type':'PostalAddress', addressLocality:'Нуану', addressRegion:'Бали', addressCountry:'ID' },
    geo:{ '@type':'GeoCoordinates', latitude:-8.57, longitude:115.08 },
    amenityFeature:[
      { '@type':'LocationFeatureSpecification', name:'Приватный бассейн', value:true },
      { '@type':'LocationFeatureSpecification', name:'Приватный сад', value:true },
      { '@type':'LocationFeatureSpecification', name:'Шестиметровые потолки', value:true },
      { '@type':'LocationFeatureSpecification', name:'Панорамное остекление', value:true },
      { '@type':'LocationFeatureSpecification', name:'Программа управляемой аренды', value:true } ],
    containedInPlace:{ '@type':'Place', name:'Нуану', description:'Прибрежный кластер площадью 45 га с единым мастер-планом на западном побережье Бали' } },
  { '@type':'FAQPage','@id':`${O}/#faq`, inLanguage:'ru', mainEntity:faqRu }
];
const ld = '<script type="application/ld+json">\n' + JSON.stringify({ '@context':'https://schema.org', '@graph':graph }, null, 2) + '\n</script>';
html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, ld);

// ---- 10. переключатель языка: RU активен; клик EN -> "/" ----
html = html.replace(/<button data-lang="ru">RU<\/button>/g, '<button data-lang="ru" class="is-active">RU</button>');
html = html.replace(/<button data-lang="en" class="is-active">EN<\/button>/g, '<button data-lang="en">EN</button>');
// маленький скрипт-перехватчик перед </body>
html = html.replace(/<\/body>/, `<script>
/* RU-страница: кнопка EN уводит на английский URL, а не просто переключает
   data-i18n на месте (у /ru/ свой server-rendered контент и canonical). */
document.querySelectorAll('[data-lang="en"]').forEach(function(b){
  b.addEventListener('click', function(e){ e.stopImmediatePropagation(); e.preventDefault(); location.href='/'; }, true);
});
</script>
</body>`);

mkdirSync('ru', { recursive: true });
writeFileSync('ru/index.html', html, 'utf8');
console.log('ru/index.html:', html.length, 'bytes');

// быстрая самопроверка
const checks = {
  'lang=ru': /<html lang="ru">/.test(html),
  'canonical /ru/': html.includes(`<link rel="canonical" href="${O}/ru/">`),
  'hreflang en': html.includes(`hreflang="en" href="${O}/"`),
  'hreflang x-default': html.includes('hreflang="x-default"'),
  'base href="/" present': /<base href="\/">/.test(html),
  'no untranslated data-i18n visible': (html.match(/data-i18n="[^"]+">\s*<\/[a-z]/g)||[]).length === 0,
  'JSON-LD ru faq': html.includes('"inLanguage": "ru"') && html.includes('Нуану'),
  'RU title has БСО+виллы': /<title>[^<]*(БСО)[^<]*<\/title>/.test(html) || RU['meta.title'].includes('БСО'),
  'EN button intercept': html.includes("location.href='/'"),
};
for (const [k,v] of Object.entries(checks)) console.log((v?'  ok  ':'  !!  ')+k);
