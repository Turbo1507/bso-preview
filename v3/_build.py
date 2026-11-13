# Собирает v3/index.html из ru/index.html: тона секций, стекло, короткие тексты.
# Запуск из site/: python -I v3/_build.py
import re, sys, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
src = (root / 'ru' / 'index.html').read_text(encoding='utf-8')
h = src

SHORT = r'(в|и|с|к|у|о|а|я|до|на|по|от|за|из|не|ни|для|без|при|под|над|про|об)'
def nb(t):
    # висячие предлоги и союзы к следующему слову, число к единице
    t = re.sub(r'(?<![\w<])' + SHORT + r' ', lambda m: m.group(1) + ' ', t, flags=re.I)
    t = re.sub(r'(\d) (м²|мин|минут|метров|год|лет|га|гектаров|м)', lambda m: m.group(1) + ' ' + m.group(2), t)
    return t

def rep(old, new, count=1):
    global h
    pat = re.escape(old).replace('\ ', ' ').replace(' ', '[  ]')
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

# прототип на Pages: свой base, без индексации, без пикселя и SEO-ссылок прода
rep('<base href="/">', '<base href="/bso-preview/">\n<meta name="robots" content="noindex,nofollow">')
rx(r'<link rel="canonical"[^>]*>\n', '')
rx(r'<link rel="alternate" hreflang[^>]*>\n', '')
rx(r'<meta name="google-site-verification"[^>]*>\n', '')
rx(r'<script>\nwindow\.bsoPixel=.*?</script>\n', '<script>window.bsoPixel=function(){}</script>\n')
rx(r'<script type="application/ld\+json">.*?</script>\n', '')
rep('<link rel="stylesheet" href="css/bso3d-embed.css', '<link rel="stylesheet" href="v3/v3.css?v=1">\n<link rel="stylesheet" href="css/bso3d-embed.css')
rep('<html lang="ru">', '<html lang="ru" class="v3">')
# якоря страницы, а не /ru/
h = h.replace('href="/ru/#', 'href="v3/#')
h = h.replace('href="/ru/"', 'href="v3/"')

# тона секций
rep('<section class="section" id="architecture">', '<section class="section t-light" id="architecture">')
rep('<section class="section villas" id="villas">', '<section class="section villas t-light" id="villas">')
rep('<section class="section" id="nuanu">', '<section class="section t-ocean" id="nuanu">')
rep('<section class="section signature">', '<section class="section signature t-ocean">')
rep('<section class="section">\n  <div class="container">\n    <h2 class="reveal" data-i18n="priv.title">', '<section class="section t-light pv3">\n  <div class="container">\n    <h2 class="reveal" data-i18n="priv.title">')
rep('<section class="section section-gray plans-tight-top" style="background:var(--stone)" id="plans">', '<section class="section t-light" id="plans">')
rep('<section class="section section-gray" style="background:var(--stone)" id="interactive-plan">', '<section class="section" id="interactive-plan">')
rep('<section class="section section-gray" style="background:var(--stone)" id="invest">', '<section class="section t-ocean" id="invest">')
rep('<section class="section section-gray" style="background:var(--stone)" id="team">', '<section class="section t-light" id="team">')
rep('<section class="section section-gray" style="background:var(--stone)" id="unit-group">', '<section class="section t-light" id="unit-group">')
rep('<section class="section gallery" id="gallery">', '<section class="section gallery t-light" id="gallery">')
rep('<section class="section faq" id="faq">', '<section class="section faq t-light" id="faq">')

# хиро: три факта на стекле
rep('</a></div>\n  </div>\n  <div class="hero-scroll"',
    '</a></div>\n    <ul class="hero-facts glass">'
    '<li><b>Свой сад и бассейн</b></li>'
    '<li><b>3 минуты до океана</b></li>'
    '<li><b>Потолки 6 метров</b></li></ul>\n  </div>\n  <div class="hero-scroll"')

# виллы: один короткий абзац вместо двух, подписи карточек в одну мысль
rx(r'<div class="villas-intro">.*?</div>',
   '<div class="villas-intro"><p>Камерные виллы в Nuanu: тишина и приватность, а всё нужное в пяти минутах.</p></div>')
rep('<p data-i18n="villas.card2.p">Вентиляция, тени, сценарии освещения и материалы: каждая деталь работает на ваш комфорт</p>', '<p>Тень, вентиляция и материалы</p>')
rep('<p data-i18n="villas.card1.p">Свой сад и бассейн, чтобы уединиться и чувствовать себя дома, в комфорте и безопасности</p>', '<p>Свой сад и бассейн</p>')
rep('<p data-i18n="villas.card4.p">Терракота, камень, терраццо и песочно-карамельная палитра вписывают виллы в ландшафт</p>', '<p>Терракота, камень, терраццо</p>')
rep('<h3 data-i18n="villas.card2.t">Ощущение прохлады в жарком климате</h3>', '<h3>Прохлада в жарком климате</h3>')
rep('<h3 data-i18n="villas.card1.t">Приватность в личном мини-оазисе</h3>', '<h3>Личный мини-оазис</h3>')

# nuanu: короткий лид, без подписи на фото и линии, расстояния стеклом на кадре
rep('<p class="lead lead-wide reveal" data-i18n="nuanu.lead">Комплекс расположен в культурном кластере Nuanu площадью 45 гектаров на берегу океана с единым мастер-планом и городской инфраструктурой нового поколения</p>',
    '<p class="lead reveal">45 гектаров у океана с единым мастер-планом</p>')
rx(r'\s*<p class="nuanu-caption"[^>]*>.*?</p>', '')
rx(r'\s*<!-- линия-разделитель[^>]*-->\s*<div class="nuanu-divider.*?</div>', '')
rep('<div class="stat-grid stat-grid-4 reveal">', '<div class="stat-grid stat-grid-4 nuanu-glass glass reveal">')
rep('<p data-i18n="nuanu.stat4.p">до Аэропорта (Ngurah Rai)</p>', '<p>до аэропорта</p>')
rep('<p data-i18n="nuanu.stat2.p">до Океана</p>', '<p>до океана</p>')

# stella solaris: подпись короче
rep('<p data-i18n="sig.p1">15-метровый арт-объект от известного архитектурного бюро, визуальная доминанта проекта</p>', '<p>15-метровый арт-объект у входа в комплекс</p>')

# частная территория: кадр во всю ширину, три пункта стеклом поверх
rx(r'<div class="pv-card">\s*<h3 data-i18n="priv.card1.title">.*?</div>\s*<div class="pv-card">.*?</div>\s*<div class="pv-card">.*?</div>',
   '<ul class="pv-glass glass">'
   '<li>Единая архитектура комплекса</li>'
   '<li>Комфорт продуман заранее</li>'
   '<li>Форматы от студии до резиденции</li></ul>')

# планировки
rep('<p class="lead lead-wide reveal" data-i18n="plans.lead">В каждом формате ДНК проекта: архитектура, воздух, приватность. Для жизни, отдыха, workation и инвестиций</p>',
    '<p class="lead reveal">Семь форматов от студии 31 м² до виллы 160 м²</p>')

# как купить
rep('<li data-i18n="stepsSticky.fact1">Возврат всех платежей, если лицензия PBG не получена</li>', '<li>Возврат платежей, если нет лицензии PBG</li>')
rep('<li data-i18n="stepsSticky.fact2">Гарантия 25 лет на конструктив, 5 лет на инженерные сети, 1 год на отделку</li>', '<li>Гарантии 25, 5 и 1 год</li>')
rep('<li data-i18n="stepsSticky.fact3">Стройка стартует в феврале 2026 и длится 24 месяца по договору</li>', '<li>Старт в феврале 2026, срок 24 месяца</li>')

# почему бали
rep('<p class="lead lead-wide reveal" data-i18n="invest.lead">Бали входит в число сильных туристических направлений мира, а Nuanu усиливает рост за счёт ограниченного предложения</p>',
    '<p class="lead reveal">Сильный туристический рынок и ограниченное предложение внутри Nuanu</p>')
rep('<p data-i18n="invest.stat1.p">Ориентир роста стоимости недвижимости в топовых районах Бали</p>', '<p>Рост цен в топовых районах Бали</p>')
rep('<p data-i18n="invest.stat2.p">От краткосрочной аренды вилл на развитых курортах Бали</p>', '<p>Аренда вилл на курортах Бали</p>')
rep('<p data-i18n="invest.stat3.p">Современный город у океана с инфраструктурой для семьи, работы и творчества</p>', '<p>Город у океана для жизни и работы</p>')

# финмодель
rep('<p data-i18n="fin.p">Цена входа, график платежей, прогноз доходности и сроки окупаемости: полную модель покажем на личной консультации</p>',
    '<p>Цену входа и график платежей под ваш юнит покажем на консультации</p>')

# группа
rep('<p class="lead reveal" data-i18n="unitgrp.lead">Стройку, производство, мебель и управление Black Sands Oasis ведёт вся группа <b class="u5">UNIT.</b> под одной крышей</p>',
    '<p class="lead reveal">Стройка, производство, мебель и управление в одной группе</p>')
rep('<p data-i18n="unitgrp.build">Строительная компания с лицензией на строительство и получение соответствующей документации (PBG/SLF)</p>', '<p>Стройка и разрешения PBG/SLF</p>')
rep('<p data-i18n="unitgrp.frames">Высокотехнологичное автоматизированное производство домовых конструкций</p>', '<p>Своё производство конструкций</p>')
rep('<p data-i18n="unitgrp.furniture">Производство корпусной и мягкой мебели, прочных дверей и панорамных окон для домов <b class="u5">UNIT.</b></p>', '<p>Мебель, двери и окна</p>')
rep('<p data-i18n="unitgrp.space">Все вопросы по сдаче в аренду и управлению недвижимостью закрываются под ключ, без участия инвестора</p>', '<p>Аренда и управление под ключ</p>')

# финал
rep('<div class="final-stats">', '<div class="final-stats glass">')


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
