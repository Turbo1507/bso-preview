# Собирает v3/index.html из ru/index.html.
# Идея v3: один день у океана. Песок (вилла) -> океан (место) -> графит (покупка) -> песок (люди).
# Фото без рамок и плашек, текст лежит в дымке на кадре, золото только в цифрах и кнопках.
# Запуск из site/: python -I v3/_build.py
import re, sys, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
src = (root / 'ru' / 'index.html').read_text(encoding='utf-8')
h = src
NBSP = chr(160)

SHORT = r'(в|и|с|к|у|о|а|я|до|на|по|от|за|из|не|ни|для|без|при|под|над|про|об)'
def nb(t):
    # висячие предлоги и союзы к следующему слову, число к единице; внутри тегов не трогаем
    t = re.sub(r'(?<![\w<="/-])' + SHORT + r' (?![^<>]*>)', lambda m: m.group(1) + NBSP, t, flags=re.I)
    t = re.sub(r'(\d) (м²|мин|минут|метров|года|год|лет|га|гектаров|ч|м)(?![\w])', lambda m: m.group(1) + NBSP + m.group(2), t)
    return t

def rep(old, new, count=1):
    global h
    pat = re.escape(old).replace('\\ ', ' ').replace(' ', '[ ' + NBSP + ']')
    h2, n = re.subn(pat, lambda m: nb(new), h, count=count)
    if n < 1:
        sys.exit('не найдено: ' + old[:90])
    h = h2

def rx(pattern, new, flags=re.S):
    global h
    h2, n = re.subn(pattern, lambda m: nb(new), h, flags=flags)
    if not n:
        sys.exit('regex не сработал: ' + pattern[:90])
    h = h2

def take(open_tag):
    # вырезает секцию целиком (секции не вложены) и возвращает её
    global h
    a = h.find(open_tag)
    if a < 0:
        sys.exit('секция не найдена: ' + open_tag[:80])
    b = h.find('</section>', a) + len('</section>')
    s = h[a:b]
    h = h[:a] + h[b:]
    return s

def img(name, alt, cls=''):
    c = f' class="{cls}"' if cls else ''
    return f'<img{c} src="assets/{name}" alt="{alt}" loading="lazy" decoding="async">'

U = '<b class="u5">UNIT.</b>'

# ---------- прототип на Pages: свой base, без индексации, без пикселя и SEO-ссылок прода
rep('<base href="/">', '<base href="/bso-preview/">\n<meta name="robots" content="noindex,nofollow">')
rx(r'<link rel="canonical"[^>]*>\n', '')
rx(r'<link rel="alternate" hreflang[^>]*>\n', '')
rx(r'<meta name="google-site-verification"[^>]*>\n', '')
rx(r'<script>\nwindow\.bsoPixel=.*?</script>\n', '<script>window.bsoPixel=function(){}</script>\n')
rx(r'<script type="application/ld\+json">.*?</script>\n', '')
rep('<link rel="stylesheet" href="css/bso3d-embed.css', '<link rel="stylesheet" href="v3/v3.css?v=1">\n<link rel="stylesheet" href="css/bso3d-embed.css')
rep('<html lang="ru">', '<html lang="ru" class="v3">')
h = h.replace('href="/ru/#', 'href="v3/#')
h = h.replace('href="/ru/"', 'href="v3/"')

# ---------- хиро: название в одну строку внизу кадра, три факта строкой
rx(r'<h1 class="hero-h1">.*?</h1>',
   '<p class="hero-eyebrow">' + U + ' Флагманский проект</p>'
   '<h1 class="hero-h1"><span class="hero-title">Black Sands Oasis</span> '
   '<span class="hero-sub">Тихая роскошь камерных вилл в Nuanu, Бали</span></h1>')
rx(r'\s*<div class="hero-scroll".*?</div>', '')
rep('</a></div>\n  </div>\n</section>',
    '</a></div>\n    <ul class="hero-facts">'
    '<li>Свой сад и бассейн</li><li>3 минуты до океана</li><li>Потолки 6 метров</li></ul>\n  </div>\n</section>')

# ---------- секции: вырезаем все и собираем в новом порядке
arch   = take('<section class="section" id="architecture">')
take('<section class="section villas" id="villas">')
take('<section class="section" id="nuanu">')
take('<section class="section signature">')
take('<section class="section">\n  <div class="container">\n    <h2 class="reveal" data-i18n="priv.title">')
iplan  = take('<section class="section section-gray" style="background:var(--stone)" id="interactive-plan">')
plans  = take('<section class="section section-gray plans-tight-top" style="background:var(--stone)" id="plans">')
take('<section class="section steps-sticky" id="steps-sticky">')
take('<section class="section section-gray" style="background:var(--stone)" id="invest">')
take('<section class="section fin-section">')
take('<section class="section section-gray" style="background:var(--stone)" id="team">')
take('<section class="section section-gray" style="background:var(--stone)" id="unit-group">')
gallery = take('<section class="section gallery" id="gallery">')
faq    = take('<section class="section faq" id="faq">')
take('<section class="final" id="contacts">')

arch = arch.replace('<section class="section" id="architecture">', '<section class="section t-sand" id="architecture">')

villas = nb('''<section class="x-villa t-sand" id="villas">
  <div class="container x-villa-head">
    <h2 class="reveal">Вилла в комплексе будущего</h2>
    <p class="x-lead reveal">Камерные виллы в Nuanu: тишина и приватность, а всё нужное рядом</p>
  </div>
  <div class="strips reveal">
    <article class="strip haze">''' + img('villas-ceilings.jpg', 'Гостиная с потолком шесть метров') + '''
      <div class="strip-t"><h3>Потолки 6 метров</h3><p>Много света и воздуха</p></div></article>
    <article class="strip haze">''' + img('bso-pool-7.jpg', 'Спальня в тени перфорированных панелей') + '''
      <div class="strip-t"><h3>Прохлада в жарком климате</h3><p>Тень, вентиляция и материалы</p></div></article>
    <article class="strip haze">''' + img('feat-oasis-plaza.jpg', 'Закрытый двор с бассейном') + '''
      <div class="strip-t"><h3>Личный мини‑оазис</h3><p>Свой сад и бассейн</p></div></article>
    <article class="strip haze">''' + img('villa-exterior-pool2.jpg', 'Фасад виллы из терракоты') + '''
      <div class="strip-t"><h3>Desert Modernism</h3><p>Терракота, камень, терраццо</p></div></article>
  </div>
</section>''')

priv = nb('''<section class="x-split x-split--right t-sand">
  <div class="x-split-copy">
    <h2 class="reveal">Частная территория нового уровня</h2>
    <ul class="x-points reveal">
      <li>Свой забор, сад и бассейн у каждой виллы</li>
      <li>Единая архитектура всего комплекса</li>
      <li>Форматы от студии до семейной резиденции</li>
    </ul>
  </div>
  <figure class="x-split-photo reveal">''' + img('villa-private-pool.jpg', 'Вилла с собственным бассейном и садом') + '''</figure>
</section>''')

plans = plans.replace('<section class="section section-gray plans-tight-top" style="background:var(--stone)" id="plans">', '<section class="section t-sand" id="plans">')
plans = re.sub(r'<p class="lead lead-wide reveal" data-i18n="plans.lead">.*?</p>',
               lambda m: nb('<p class="lead reveal">Семь форматов от студии 31 м² до виллы 160 м²</p>'), plans, flags=re.S)

place = nb('''<section class="x-place" id="nuanu">
  <div class="x-place-photo">
    <picture>
      <source media="(max-width:860px)" srcset="assets/nuanu-masterplan-mobile.jpg">
      ''' + img('nuanu-masterplan.jpg', 'Кластер Nuanu на берегу океана') + '''
    </picture>
  </div>
  <div class="container x-place-in">
    <p class="x-eyebrow reveal">Nuanu, 45 гектаров у океана</p>
    <h2 class="reveal">Строим в лучшей локации на Бали</h2>
    <dl class="x-dist reveal">
      <div><dt>0 мин</dt><dd>до Nuanu</dd></div>
      <div><dt>3 мин</dt><dd>до океана</dd></div>
      <div><dt>20 мин</dt><dd>до Чангу</dd></div>
      <div><dt>1 ч</dt><dd>до аэропорта</dd></div>
    </dl>
  </div>
</section>''')

stella = nb('''<section class="x-split x-split--left t-ocean">
  <figure class="x-split-photo reveal">''' + img('stella-solaris.jpg', 'Stella Solaris на закате') + '''</figure>
  <div class="x-split-copy">
    <p class="x-eyebrow reveal">Знаковый объект комплекса</p>
    <h2 class="reveal">Stella Solaris</h2>
    <p class="x-lead reveal">15-метровый арт-объект у входа в комплекс</p>
  </div>
</section>''')

why = nb('''<section class="x-why haze" id="invest">
  ''' + img('why-bali-tanahlot.jpg', 'Храм Танах Лот на закате', 'x-why-bg') + '''
  <div class="container x-why-in">
    <h2 class="reveal">Почему Бали и Nuanu</h2>
    <dl class="x-figs reveal">
      <div><dt>+20% в год</dt><dd>Рост цен в топовых районах Бали</dd></div>
      <div><dt>До 16% годовых</dt><dd>Аренда вилл на курортах Бали</dd></div>
      <div><dt>Город Nuanu</dt><dd>Город у океана для жизни и работы</dd></div>
    </dl>
  </div>
</section>''')

iplan = iplan.replace('<section class="section section-gray" style="background:var(--stone)" id="interactive-plan">', '<section class="section t-ink" id="interactive-plan">')

steps = nb('''<section class="section t-ink x-steps" id="steps-sticky">
  <div class="container">
    <div class="x-steps-head">
      <h2 class="reveal">Как купить виллу</h2>
      <p class="x-lead reveal">Пять шагов до ключей, каждый закреплён договором</p>
    </div>
    <ol class="x-steps-list reveal">
      <li><span class="num">01</span><div><h3>Выбор юнита</h3><p>Подбор формата под ваш сценарий</p></div></li>
      <li><span class="num">02</span><div><h3>Депозит</h3><p>Возвратный, $1,500</p></div></li>
      <li><span class="num">03</span><div><h3>Первый взнос</h3><p>30% после фиксации условий</p></div></li>
      <li><span class="num">04</span><div><h3>Платежи по этапам</h3><p>Раз в квартал, по ходу стройки</p></div></li>
      <li><span class="num">05</span><div><h3>Готовый актив</h3><p>Срок проекта 2 года</p></div></li>
    </ol>
    <div class="x-steps-foot reveal">
      <ul class="x-facts">
        <li>Возврат платежей, если нет лицензии PBG</li>
        <li>Гарантии 25, 5 и 1 год</li>
        <li>Старт в феврале 2026, срок 24 месяца</li>
      </ul>
      <a class="btn btn-clay js-lead-open" href="v3/#contacts" data-lead-intent="presentation">Получить презентацию</a>
    </div>
  </div>
</section>''')

fin = nb('''<section class="x-fin">
  <div class="container x-fin-in">
    <h2 class="reveal">Расчёт доходности под ваш юнит</h2>
    <div class="x-fin-side reveal">
      <p>Цену входа и график платежей покажем на консультации</p>
      <a class="btn x-btn-ink js-lead-open" href="v3/#contacts" data-lead-intent="fin">Получить финансовую модель</a>
    </div>
  </div>
</section>''')

team = nb('''<section class="section t-sand x-people" id="team">
  <div class="container x-people-in">
    <div class="x-people-copy">
      <h2 class="reveal">Кто делает Black Sands Oasis</h2>
      <div class="x-group reveal" id="unit-group">
        <p class="x-eyebrow">Группа работает как единая система</p>
        <dl>
          <div><dt><b class="ul">''' + U + '''BUILD</b></dt><dd>Стройка и разрешения PBG/SLF</dd></div>
          <div><dt><b class="ul">''' + U + '''FRAMES</b></dt><dd>Своё производство конструкций</dd></div>
          <div><dt><b class="ul">''' + U + '''FURNITURE</b></dt><dd>Мебель, двери и окна</dd></div>
          <div><dt><b class="ul">''' + U + '''SPACE MANAGEMENT</b></dt><dd>Аренда и управление под ключ</dd></div>
        </dl>
      </div>
    </div>
    <div class="x-faces reveal">
      <figure>''' + img('team-stepan-4.jpg', 'Степан Федосеев') + '''
        <figcaption><span>Основатель</span><h3>Степан Федосеев</h3><p>Системное управление и технологии в строительстве</p></figcaption></figure>
      <figure>''' + img('team-anna.jpg', 'Анна Орлова') + '''
        <figcaption><span>Совладелец</span><h3>Анна Орлова</h3><p>Архитектор и дизайнер, 10 лет проектов в Индонезии и Европе</p></figcaption></figure>
    </div>
  </div>
</section>''')

gallery = gallery.replace('<section class="section gallery" id="gallery">', '<section class="section gallery t-sand" id="gallery">')
faq = faq.replace('<section class="section faq" id="faq">', '<section class="section faq t-sand" id="faq">')

final = nb('''<section class="x-final haze" id="contacts">
  ''' + img('cta-villas-overview.jpg', 'Black Sands Oasis с высоты', 'x-final-bg') + '''
  <div class="container x-final-in">
    <div class="x-final-top">
      <h2 class="reveal">Сильная локация и продуманный девелопмент</h2>
      <p class="x-lead reveal">Планировки, цены и свободные лоты покажем на личной консультации</p>
      <a class="btn btn-white reveal js-lead-open" href="v3/#contacts" data-lead-intent="selection"><span>Получить подборку вилл</span></a>
    </div>
    <dl class="x-figs reveal">
      <div><dt>111 юнитов</dt><dd>83 виллы, 20 студий и 8 пентхаусов к 2028 г.</dd></div>
      <div><dt>35+ объектов</dt><dd>инфраструктуры Nuanu уже доступны</dd></div>
      <div><dt>108 юнитов</dt><dd>уже построено и сдано</dd></div>
    </dl>
  </div>
</section>''')

order = [arch, villas, priv, plans, place, stella, why, iplan, steps, fin, team, gallery, faq, final]
if h.count('<!-- footer -->') != 1:
    sys.exit('маркер футера не найден')
h = h.replace('<!-- footer -->', '\n\n'.join(order) + '\n\n<!-- footer -->')

# меню в порядке страницы
NAV = [('architecture', 'Архитектура', ''), ('plans', 'Планировки', ''), ('nuanu', 'Локация', ''),
       ('interactive-plan', '3D-карта', ' class="js-map-open"'), ('steps-sticky', 'Как купить', ''),
       ('team', 'Команда', ''), ('gallery', 'Галерея', ''), ('faq', 'Вопросы', '')]
navhtml = '\n'.join(f'      <a{c} href="v3/#{i}">{t}</a>' for i, t, c in NAV)
block = r'(?:\s*<a(?: class="js-map-open")? href="v3/#[a-z-]+"[^>]*>[^<]*</a>){8}'
h, n = re.subn(block, lambda m: '\n' + navhtml, h)
if n != 3:
    sys.exit('меню: ожидал 3 блока, нашёл %d' % n)

# фавиконки от base, не от корня домена
h = h.replace('href="/assets/', 'href="assets/')
# карта: на Pages её нет, прод не даёт встраивать чужим сайтам -> своя копия встройки
# с адресами прода, клик открывает карту прода в новой вкладке
emb = (root / 'js' / 'bso3d-embed.js').read_text(encoding='utf-8').replace("'/3d/", "'https://blacksandsoasis.com/3d/").replace("return fetch(u, { priority: 'low', credentials: 'same-origin' }).catch(function () {});", "return Promise.resolve();")
(root / 'v3' / 'bso3d-embed.js').write_text(emb, encoding='utf-8')
rx(r'<script src="js/bso3d-embed\.js[^"]*"></script>',
   '<script>document.addEventListener("click",function(e){var a=e.target.closest(".js-map-open,#bso3d");'
   'if(!a)return;e.preventDefault();e.stopImmediatePropagation();'
   'window.open("https://blacksandsoasis.com/3d/index.html?lang=ru","_blank","noopener")},true)</script>\n'
   '<script src="v3/bso3d-embed.js?v=1"></script>')

(root / 'v3' / 'index.html').write_text(h, encoding='utf-8')
print('v3/index.html', len(h))
