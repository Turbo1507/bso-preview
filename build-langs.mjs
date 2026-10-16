/* Языковые страницы BSO: собирает /<код>/index.html из index.html (EN) и словарей.
   RU лежит в js/i18n.js + js/v2-i18n.js, остальные языки в js/i18n-<код>.js.
   Запускать после ЛЮБОЙ правки index.html или словарей:  node build-langs.mjs
   (можно один язык: node build-langs.mjs fr)
   Что делает на каждой странице:
   - словарь в [data-i18n] (innerHTML), [data-i18n-alt], [data-i18n-aria]
   - <html lang>, canonical на свой адрес, hreflang на все языки
   - title, description, og/twitter остаются английскими (так нужно на всех языках)
   - og:url и og:locale свои, JSON-LD со своим FAQ
   - <base href="/">: страница глубже корня, а JS строит пути к картинкам относительно
   - якоря #секция ведут на свой язык, редирект корня по куки выкидывается */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';

const O = 'https://blacksandsoasis.com';
const ALL = ['en', 'ru', 'id', 'fr', 'es', 'uk', 'it', 'tr', 'nl'];
const LOC = { en: 'en_US', ru: 'ru_RU', id: 'id_ID', fr: 'fr_FR', es: 'es_ES', uk: 'uk_UA', it: 'it_IT', tr: 'tr_TR', nl: 'nl_NL' };
const only = process.argv[2];
const TARGETS = ALL.filter(l => l !== 'en' && (!only || l === only));

global.window = {};
await import('./js/i18n.js');
await import('./js/v2-i18n.js');
const EN = window.I18N.en;
for (const l of TARGETS) if (l !== 'ru') {
  if (!existsSync(`js/i18n-${l}.js`)) { console.error(`нет js/i18n-${l}.js`); process.exit(1); }
  await import(`./js/i18n-${l}.js`);
}

const SRC = readFileSync('index.html', 'utf8').replace(/\r\n/g, '\n');
const esc = s => s.replace(/"/g, '&quot;');
const SKIP = k => k.startsWith('meta.');   // title и description остаются EN

function build(lang) {
  const D = window.I18N[lang];
  if (!D) throw new Error('нет словаря ' + lang);
  // у RU планировки и пины Nuanu свои в таблицах main.js, словарь им не нужен
  const miss = Object.keys(EN).filter(k => !SKIP(k) && D[k] == null && !(lang === 'ru' && /^(plan|pin)./.test(k)));
  let h = SRC;

  h = h.replace(/(<([a-zA-Z0-9]+)\b[^>]*\bdata-i18n="([^"]+)"[^>]*>)([\s\S]*?)(<\/\2>)/g,
    (m, open, tag, key, _in, close) => (!SKIP(key) && key in D) ? open + D[key] + close : m);
  h = h.replace(/<[^>]*\bdata-i18n-alt="([^"]+)"[^>]*>/g, (m, key) => {
    if (!(key in D)) return m;
    const v = esc(D[key]);
    return /\balt="/.test(m) ? m.replace(/\balt="[^"]*"/, `alt="${v}"`) : m.replace(/<([a-zA-Z0-9]+)\b/, `<$1 alt="${v}"`);
  });
  h = h.replace(/<[^>]*\bdata-i18n-aria="([^"]+)"[^>]*>/g, (m, key) => {
    if (!(key in D)) return m;
    const v = esc(D[key]);
    return /\baria-label="/.test(m) ? m.replace(/\baria-label="[^"]*"/, `aria-label="${v}"`) : m.replace(/<([a-zA-Z0-9]+)\b/, `<$1 aria-label="${v}"`);
  });

  h = h.replace(/<html\b[^>]*>/, `<html lang="${lang}">`);
  h = h.replace(/<script>\/\* язык выбирает человек[^\n]*<\/script>\n/, '');
  if (!/<base\b/.test(h)) h = h.replace(/(<meta charset="[^"]*">)/i, '$1\n<base href="/">');
  h = h.replace(/href="#([a-z0-9-]*)"/gi, `href="/${lang}/#$1"`);

  h = h.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${O}/${lang}/">`);
  h = h
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${O}/${lang}/$2`)
    .replace(/(<meta property="og:locale" content=")[^"]*(")/, `$1${LOC[lang]}$2`)
    .replace(/(<meta property="og:locale:alternate" content="[^"]*">\n)+/,
      ALL.filter(l => l !== lang).map(l => `<meta property="og:locale:alternate" content="${LOC[l]}">\n`).join(''));

  // JSON-LD: тот же граф, адрес страницы и FAQ на языке страницы
  h = h.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/, (m, a, json, c) => {
    const ld = JSON.parse(json);
    for (const n of ld['@graph']) {
      if (n['@type'] === 'WebPage') { n['@id'] = `${O}/${lang}/#webpage`; n.url = `${O}/${lang}/`; n.inLanguage = lang; }
      if (n['@type'] === 'ApartmentComplex') {
        n.url = `${O}/${lang}/`;
        if (lang !== 'ru') {
          n.amenityFeature.forEach((f, i) => { if (D['ld.am' + (i + 1)]) f.name = D['ld.am' + (i + 1)]; });
          if (D['ld.nuanu']) n.containedInPlace.description = D['ld.nuanu'];
        }
      }
      if (n['@type'] === 'FAQPage') {
        n.inLanguage = lang;
        n.mainEntity = n.mainEntity.map((_, i) => ({
          '@type': 'Question', name: strip(D[`faq.q${i + 1}`]),
          acceptedAnswer: { '@type': 'Answer', text: strip(D[`faq.a${i + 1}`]) }
        }));
      }
      if (lang === 'ru') Object.assign(n, RU_LD[n['@type']] || {});
    }
    return a + '\n' + JSON.stringify(ld, null, 2) + '\n' + c;
  });

  if (lang !== 'ru') {
    h = h.replace(/(<script src="js\/v2-i18n\.js[^"]*"><\/script>\n)/, (m) => m + `<script src="js/i18n-${lang}.js?v=1"></script>\n`);
  }

  mkdirSync(lang, { recursive: true });
  writeFileSync(`${lang}/index.html`, h.replace(/\n/g, '\r\n'), 'utf8');

  const checks = {
    [`lang=${lang}`]: h.includes(`<html lang="${lang}">`),
    'canonical': h.includes(`<link rel="canonical" href="${O}/${lang}/">`),
    'hreflang x9 + x-default': ALL.every(l => h.includes(`hreflang="${l}"`)) && h.includes('hreflang="x-default"'),
    'title EN': /<title[^>]*>Black Sands Oasis — UNIT.’s Flagship Project/.test(h),
    'нет редиректа корня': !h.includes('язык выбирает человек'),
    'base href': /<base href="\/">/.test(h),
    'словарь подключён': lang === 'ru' || h.includes(`js/i18n-${lang}.js`),
    'все ключи': miss.length === 0,
  };
  console.log(`${lang}/index.html: ${h.length} байт`);
  for (const [k, v] of Object.entries(checks)) console.log((v ? '  ok  ' : '  !!  ') + k);
  if (miss.length) console.log('  нет ключей:', miss.slice(0, 20).join(', '), miss.length > 20 ? `… всего ${miss.length}` : '');
}
function strip(s) { return String(s || '').replace(/<[^>]+>/g, '').replace(/&nbsp;| /g, ' ').replace(/\s+/g, ' ').trim(); }

/* RU: описания организации и комплекса по-русски (были в прежнем build-ru) */
const RU_LD = {
  Organization: {
    alternateName: ['BSO', 'БСО', 'Блэк Сэндс Оазис'],
    description: 'Девелопер Black Sands Oasis (БСО) — камерных вилл в стиле Desert Modernism в кластере Нуану, Бали. Проект UNIT.',
    areaServed: { '@type': 'Place', name: 'Бали, Индонезия' }
  },
  ApartmentComplex: {
    name: 'Black Sands Oasis (БСО)',
    description: 'Закрытый кластер камерных вилл в стиле Desert Modernism в Нуану на западном побережье Бали: 7 планировок от 31 до 160 м², приватные бассейны и сады, шестиметровые потолки, панорамное остекление и программа управляемой аренды.',
    address: { '@type': 'PostalAddress', addressLocality: 'Нуану', addressRegion: 'Бали', addressCountry: 'ID' },
    amenityFeature: ['Приватный бассейн', 'Приватный сад', 'Шестиметровые потолки', 'Панорамное остекление', 'Программа управляемой аренды']
      .map(name => ({ '@type': 'LocationFeatureSpecification', name, value: true })),
    containedInPlace: { '@type': 'Place', name: 'Нуану', description: 'Прибрежный кластер площадью 45 га с единым мастер-планом на западном побережье Бали' }
  }
};

for (const l of TARGETS) build(l);
