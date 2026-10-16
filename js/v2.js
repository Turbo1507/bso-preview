/* Лайтбокс — клик по фото в галерее проекта или в слайдере типов вилл
   открывает полноэкранный оверлей (стрелки листают, крестик/Esc/клик по фону
   закрывают). Кадры собираются из <img> контейнера в момент клика: слайдер
   типов перестраивается при смене таба и языка. */
(function () {
  var lb = document.getElementById('lightbox');
  if (!lb) return;
  var img = document.getElementById('lightboxImg');
  var closeBtn = document.getElementById('lightboxClose');
  var prevBtn = document.getElementById('lightboxPrev');
  var nextBtn = document.getElementById('lightboxNext');
  var curEl = document.getElementById('lightboxCountCur');
  var totalEl = document.getElementById('lightboxCountTotal');
  var stage = lb.querySelector('.lightbox-stage');

  var frames = [];
  var idx = 0;

  function show(i) {
    if (!frames.length) return;
    idx = (i + frames.length) % frames.length;
    var f = frames[idx];
    img.src = f.src;
    img.alt = f.alt || '';
    curEl.textContent = idx + 1;
    totalEl.textContent = frames.length;
  }

  function open(container, startImg) {
    var imgs = Array.prototype.slice.call(container.querySelectorAll('img'));
    if (!imgs.length) return;
    frames = imgs.map(function (im) { return { src: im.currentSrc || im.src, alt: im.alt }; });
    var startIdx = imgs.indexOf(startImg);
    show(startIdx < 0 ? 0 : startIdx);
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lb-lock');
  }
  function close() {
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lb-lock');
  }

  ['galTrack', 'plansPhotoTrack'].forEach(function (id) {
    var container = document.getElementById(id);
    if (!container) return;
    // на мобиле увеличение по тапу только мешает, лайтбокс только на десктопе
    var mobileMQ = window.matchMedia('(max-width: 860px)');
    if (!mobileMQ.matches) container.style.cursor = 'zoom-in';
    container.addEventListener('click', function (e) {
      if (mobileMQ.matches) return;
      var im = e.target.closest('img');
      if (!im) return;
      open(container, im);
    });
  });

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', function () { show(idx - 1); });
  nextBtn.addEventListener('click', function () { show(idx + 1); });
  lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target === stage) close();
  });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
})();

/* Видео-хиро — на мобиле не грузим/не проигрываем тяжёлый mp4 (экономия
   трафика), остаётся статичный poster-кадр. preload="none" в разметке —
   догружаем только когда реально решили играть. */
(function () {
  var v = document.getElementById('heroVideo');
  if (!v) return;
  /* видео играет и на мобиле: там свой лёгкий ролик hero-tour-mobile.mp4
     (3.7 МБ против 13.5), центральный кроп 3:4 под вертикальный хиро, без звука, faststart. */
  if (window.matchMedia('(max-width: 820px)').matches) {
    var s = v.querySelector('source');
    if (s) s.src = 'assets/hero-tour-mobile.mp4';
    v.load();
  }
  v.preload = 'auto';
  v.play().catch(function () {});
})();

/* Аккордеон FAQ: открыт ровно один пункт, клик по открытому его закрывает.
   Высота анимируется через grid-template-rows 0fr→1fr (см. css/v2.css),
   поэтому ответы разной длины не дёргаются. Скрипт грузится после main.js
   и ничего из него не переопределяет. */
/* Галерея проекта — та же карусель, что у шагов покупки. wireCarousel
   объявлена в main.js на верхнем уровне, значит доступна как window.wireCarousel. */
(function () {
  if (document.getElementById('galTrack') && typeof window.wireCarousel === 'function') {
    window.wireCarousel('galTrack', 'galPrev', 'galNext', 'galDots', 400);
  }
})();

/* Свои выпадающие списки в форме заявки: нативный попап рисует ОС, его не
   покрасить и стрелку не видно. Сам <select> остаётся в DOM и источником правды:
   его читают FormData и автоформат телефона в main.js. Мы только строим поверх
   кнопку со списком и синхронизируем значение и событие change. */
(function () {
  var selects = document.querySelectorAll('.lead-field select');
  if (!selects.length) return;
  var CHEV = '<svg class="csel-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
             'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
  var widgets = [];

  /* ---- полный справочник телефонных кодов стран: [iso2, ru, en, dial,
     маска локального номера или '' = свободный ввод, см. formatPhoneDigits] ---- */
  var COUNTRY_CODES = [
    ['AU','Австралия','Australia','61','3-3-3'],['AT','Австрия','Austria','43',''],
    ['AZ','Азербайджан','Azerbaijan','994','2-3-2-2'],['AL','Албания','Albania','355',''],
    ['DZ','Алжир','Algeria','213',''],['AO','Ангола','Angola','244',''],
    ['AD','Андорра','Andorra','376',''],['AG','Антигуа и Барбуда','Antigua & Barbuda','1',''],
    ['AR','Аргентина','Argentina','54',''],['AM','Армения','Armenia','374','2-2-2-2'],
    ['AF','Афганистан','Afghanistan','93',''],['BS','Багамы','Bahamas','1',''],
    ['BD','Бангладеш','Bangladesh','880',''],['BB','Барбадос','Barbados','1',''],
    ['BH','Бахрейн','Bahrain','973',''],['BY','Беларусь','Belarus','375','2-3-2-2'],
    ['BZ','Белиз','Belize','501',''],['BE','Бельгия','Belgium','32',''],
    ['BJ','Бенин','Benin','229',''],['BG','Болгария','Bulgaria','359',''],
    ['BO','Боливия','Bolivia','591',''],['BA','Босния и Герцеговина','Bosnia & Herzegovina','387',''],
    ['BW','Ботсвана','Botswana','267',''],['BR','Бразилия','Brazil','55','2-5-4'],
    ['BN','Бруней','Brunei','673',''],['BF','Буркина-Фасо','Burkina Faso','226',''],
    ['BI','Бурунди','Burundi','257',''],['BT','Бутан','Bhutan','975',''],
    ['VU','Вануату','Vanuatu','678',''],['GB','Великобритания','United Kingdom','44','4-3-3'],
    ['HU','Венгрия','Hungary','36',''],['VE','Венесуэла','Venezuela','58',''],
    ['TL','Восточный Тимор','Timor-Leste','670',''],['VN','Вьетнам','Vietnam','84',''],
    ['GA','Габон','Gabon','241',''],['HT','Гаити','Haiti','509',''],
    ['GY','Гайана','Guyana','592',''],['GM','Гамбия','Gambia','220',''],
    ['GH','Гана','Ghana','233',''],['GP','Гваделупа','Guadeloupe','590',''],
    ['GT','Гватемала','Guatemala','502',''],['GN','Гвинея','Guinea','224',''],
    ['GW','Гвинея-Бисау','Guinea-Bissau','245',''],['DE','Германия','Germany','49','3-4-4'],
    ['HN','Гондурас','Honduras','504',''],['HK','Гонконг','Hong Kong','852','4-4'],
    ['GD','Гренада','Grenada','1',''],['GR','Греция','Greece','30',''],
    ['GE','Грузия','Georgia','995','3-2-2-2'],['DK','Дания','Denmark','45','2-2-2-2'],
    ['DJ','Джибути','Djibouti','253',''],['DM','Доминика','Dominica','1',''],
    ['DO','Доминиканская Республика','Dominican Republic','1',''],['EG','Египет','Egypt','20',''],
    ['ZM','Замбия','Zambia','260',''],['ZW','Зимбабве','Zimbabwe','263',''],
    ['IL','Израиль','Israel','972','2-3-4'],['IN','Индия','India','91','5-5'],
    ['ID','Индонезия','Indonesia','62','3-4-4'],['JO','Иордания','Jordan','962',''],
    ['IQ','Ирак','Iraq','964',''],['IR','Иран','Iran','98',''],
    ['IE','Ирландия','Ireland','353',''],['IS','Исландия','Iceland','354',''],
    ['ES','Испания','Spain','34','3-3-3'],['IT','Италия','Italy','39','3-4-4'],
    ['YE','Йемен','Yemen','967',''],['CV','Кабо-Верде','Cape Verde','238',''],
    ['KZ','Казахстан','Kazakhstan','7','3-3-2-2'],['KH','Камбоджа','Cambodia','855',''],
    ['CM','Камерун','Cameroon','237',''],['CA','Канада','Canada','1','3-3-4'],
    ['QA','Катар','Qatar','974',''],['KE','Кения','Kenya','254',''],
    ['CY','Кипр','Cyprus','357',''],['KG','Киргизия','Kyrgyzstan','996',''],
    ['CN','Китай','China','86','3-4-4'],['CO','Колумбия','Colombia','57',''],
    ['KM','Коморы','Comoros','269',''],['CG','Конго','Congo','242',''],
    ['CD','Конго (ДРК)','Congo (DRC)','243',''],['CR','Коста-Рика','Costa Rica','506',''],
    ['CI','Кот-д’Ивуар','Côte d’Ivoire','225',''],['CU','Куба','Cuba','53',''],
    ['KW','Кувейт','Kuwait','965',''],['LA','Лаос','Laos','856',''],
    ['LV','Латвия','Latvia','371',''],['LS','Лесото','Lesotho','266',''],
    ['LR','Либерия','Liberia','231',''],['LB','Ливан','Lebanon','961',''],
    ['LY','Ливия','Libya','218',''],['LT','Литва','Lithuania','370',''],
    ['LI','Лихтенштейн','Liechtenstein','423',''],['LU','Люксембург','Luxembourg','352',''],
    ['MU','Маврикий','Mauritius','230',''],['MR','Мавритания','Mauritania','222',''],
    ['MG','Мадагаскар','Madagascar','261',''],['MO','Макао','Macau','853',''],
    ['MK','Северная Македония','North Macedonia','389',''],['MW','Малави','Malawi','265',''],
    ['MY','Малайзия','Malaysia','60','2-3-4'],['ML','Мали','Mali','223',''],
    ['MV','Мальдивы','Maldives','960',''],['MT','Мальта','Malta','356',''],
    ['MA','Марокко','Morocco','212',''],['MX','Мексика','Mexico','52','2-4-4'],
    ['MZ','Мозамбик','Mozambique','258',''],['MD','Молдова','Moldova','373',''],
    ['MC','Монако','Monaco','377',''],['MN','Монголия','Mongolia','976',''],
    ['MM','Мьянма','Myanmar','95',''],['NA','Намибия','Namibia','264',''],
    ['NP','Непал','Nepal','977',''],['NE','Нигер','Niger','227',''],
    ['NG','Нигерия','Nigeria','234',''],['NL','Нидерланды','Netherlands','31',''],
    ['NI','Никарагуа','Nicaragua','505',''],['NZ','Новая Зеландия','New Zealand','64',''],
    ['NO','Норвегия','Norway','47','3-2-3'],['AE','ОАЭ','United Arab Emirates','971','2-3-4'],
    ['OM','Оман','Oman','968',''],['PK','Пакистан','Pakistan','92',''],
    ['PA','Панама','Panama','507',''],['PG','Папуа — Новая Гвинея','Papua New Guinea','675',''],
    ['PY','Парагвай','Paraguay','595',''],['PE','Перу','Peru','51',''],
    ['PL','Польша','Poland','48','3-3-3'],['PT','Португалия','Portugal','351','3-3-3'],
    ['PR','Пуэрто-Рико','Puerto Rico','1',''],['RU','Россия','Russia','7','3-3-2-2'],
    ['RW','Руанда','Rwanda','250',''],['RO','Румыния','Romania','40','3-3-3'],
    ['SV','Сальвадор','El Salvador','503',''],['WS','Самоа','Samoa','685',''],
    ['SM','Сан-Марино','San Marino','378',''],['ST','Сан-Томе и Принсипи','São Tomé & Príncipe','239',''],
    ['SA','Саудовская Аравия','Saudi Arabia','966',''],['SZ','Эсватини','Eswatini','268',''],
    ['SC','Сейшелы','Seychelles','248',''],['SN','Сенегал','Senegal','221',''],
    ['RS','Сербия','Serbia','381',''],['SG','Сингапур','Singapore','65','4-4'],
    ['SY','Сирия','Syria','963',''],['SK','Словакия','Slovakia','421',''],
    ['SI','Словения','Slovenia','386',''],['SB','Соломоновы Острова','Solomon Islands','677',''],
    ['SO','Сомали','Somalia','252',''],['SD','Судан','Sudan','249',''],
    ['SR','Суринам','Suriname','597',''],['US','США','United States','1','3-3-4'],
    ['SL','Сьерра-Леоне','Sierra Leone','232',''],['TJ','Таджикистан','Tajikistan','992',''],
    ['TH','Таиланд','Thailand','66',''],['TZ','Танзания','Tanzania','255',''],
    ['TG','Того','Togo','228',''],['TO','Тонга','Tonga','676',''],
    ['TT','Тринидад и Тобаго','Trinidad & Tobago','1',''],['TN','Тунис','Tunisia','216',''],
    ['TM','Туркмения','Turkmenistan','993',''],['TR','Турция','Türkiye','90','3-3-2-2'],
    ['UG','Уганда','Uganda','256',''],['UZ','Узбекистан','Uzbekistan','998','2-3-2-2'],
    ['UA','Украина','Ukraine','380','2-3-2-2'],['UY','Уругвай','Uruguay','598',''],
    ['PH','Филиппины','Philippines','63',''],['FI','Финляндия','Finland','358',''],
    ['FR','Франция','France','33','1-2-2-2-2'],['HR','Хорватия','Croatia','385',''],
    ['CF','ЦАР','Central African Republic','236',''],['TD','Чад','Chad','235',''],
    ['ME','Черногория','Montenegro','382',''],['CZ','Чехия','Czechia','420','3-3-3'],
    ['CL','Чили','Chile','56',''],['CH','Швейцария','Switzerland','41','2-3-2-2'],
    ['SE','Швеция','Sweden','46','2-3-2-2'],['LK','Шри-Ланка','Sri Lanka','94',''],
    ['EC','Эквадор','Ecuador','593',''],['GQ','Экваториальная Гвинея','Equatorial Guinea','240',''],
    ['ER','Эритрея','Eritrea','291',''],['EE','Эстония','Estonia','372',''],
    ['ET','Эфиопия','Ethiopia','251',''],['ZA','ЮАР','South Africa','27',''],
    ['KR','Южная Корея','South Korea','82','2-4-4'],['SS','Южный Судан','South Sudan','211',''],
    ['JM','Ямайка','Jamaica','1',''],['JP','Япония','Japan','81','2-4-4']
  ];

  function ccLang() {
    return (window.__bsoLang || document.documentElement.lang || 'en').toLowerCase().slice(0, 2);
  }
  /* RU и EN названия стран из таблицы, остальные языки берём у браузера */
  var dnCache = {};
  function ccName(r, lg) {
    if (lg === 'ru') return r[1];
    if (lg === 'en') return r[2];
    try {
      if (!dnCache[lg]) dnCache[lg] = new Intl.DisplayNames([lg], { type: 'region' });
      return dnCache[lg].of(r[0]) || r[2];
    } catch (e) { return r[2]; }
  }

  /* Дозаполняет <select id="leadCc"> полным списком стран. Сохраняет текущий
     выбор (по data-iso, иначе по коду). Список сортируется по названию на
     текущем языке. На каждом option: data-format (маска), data-iso,
     data-label (полное «Страна +код» для строки списка); сам textContent —
     короткий «RU +7» для узкой кнопки. */
  function fillCountrySelect(select) {
    if (!select) return;
    var lg = ccLang();
    var prevIso = select.selectedOptions[0] && select.selectedOptions[0].getAttribute('data-iso');
    var prevVal = select.value;
    var rows = COUNTRY_CODES.slice().sort(function (a, b) {
      return ccName(a, lg).localeCompare(ccName(b, lg), lg);
    });
    select.innerHTML = '';
    rows.forEach(function (r) {
      var o = document.createElement('option');
      o.value = r[3];
      o.textContent = r[0] + ' +' + r[3];
      o.setAttribute('data-iso', r[0]);
      o.setAttribute('data-format', r[4] || '');
      o.setAttribute('data-label', ccName(r, lg) + '  +' + r[3]);
      o.setAttribute('data-search', (r[1] + ' ' + r[2] + ' ' + ccName(r, lg) + ' ' + r[0] + ' ' + r[3]).toLowerCase());
      select.appendChild(o);
    });
    var pick = null;
    if (prevIso) pick = select.querySelector('option[data-iso="' + prevIso + '"]');
    if (!pick && prevVal) pick = Array.prototype.find.call(select.options, function (o) { return o.value === prevVal; });
    if (!pick) pick = select.querySelector('option[data-iso="ID"]');
    if (pick) pick.selected = true;
  }

  fillCountrySelect(document.getElementById('leadCc'));

  function build(select) {
    var wrap = document.createElement('div');
    wrap.className = 'csel';
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    select.classList.add('csel-native');
    select.setAttribute('tabindex', '-1');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'csel-btn';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    if (select.getAttribute('aria-label')) btn.setAttribute('aria-label', select.getAttribute('aria-label'));
    btn.innerHTML = '<span class="csel-val"></span>' + CHEV;

    /* #leadCc после fillCountrySelect содержит ~190 стран — добавляем поиск */
    var searchable = select.id === 'leadCc';

    var pop = document.createElement('div');
    pop.className = 'csel-pop';
    pop.hidden = true;

    var search = null;
    if (searchable) {
      search = document.createElement('input');
      search.type = 'text';
      search.className = 'csel-search';
      search.autocomplete = 'off';
      search.spellcheck = false;
      search.placeholder = window.bsoT('cc.search');
      search.setAttribute('aria-label', search.placeholder);
      pop.appendChild(search);
    }

    var list = document.createElement('ul');
    list.className = 'csel-list';
    list.setAttribute('role', 'listbox');
    pop.appendChild(list);

    wrap.appendChild(btn);
    wrap.appendChild(pop);

    var w = { select: select, wrap: wrap, btn: btn, list: list, pop: pop, active: -1 };

    function visibleItems() {
      return Array.prototype.filter.call(list.children, function (li) { return !li.hidden; });
    }

    function render() {
      var opts = Array.prototype.filter.call(select.options, function (o) { return !o.disabled; });
      list.innerHTML = '';
      opts.forEach(function (o) {
        var li = document.createElement('li');
        var isSel = o.getAttribute('data-iso')
          ? o.getAttribute('data-iso') === (select.selectedOptions[0] && select.selectedOptions[0].getAttribute('data-iso'))
          : o.value === select.value;
        li.className = 'csel-opt' + (isSel ? ' is-sel' : '');
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', isSel ? 'true' : 'false');
        li.dataset.value = o.value;
        if (o.getAttribute('data-iso')) li.dataset.iso = o.getAttribute('data-iso');
        if (o.getAttribute('data-search')) li.dataset.search = o.getAttribute('data-search');
        li.textContent = o.getAttribute('data-label') || o.textContent;
        list.appendChild(li);
      });
      var cur = select.selectedOptions[0];
      var isPlaceholder = !cur || cur.disabled;
      btn.querySelector('.csel-val').textContent = cur ? cur.textContent : '';
      btn.dataset.placeholder = isPlaceholder ? 'true' : 'false';
      syncScrollbar();
    }
    w.render = render;

    /* кастомный индикатор прокрутки — тот же паттерн, что для попапа юнитов
       на карте (iplan-map.js mountPopupScrollbar): тонкий трек + ползунок
       справа, виден всё время, пока список не влезает. */
    var sbBar = document.createElement('div');
    sbBar.className = 'csel-sb';
    sbBar.innerHTML = '<div class="csel-sb-thumb"></div>';
    pop.appendChild(sbBar);
    var sbThumb = sbBar.firstChild;
    function syncScrollbar() {
      requestAnimationFrame(function () {
        var over = list.scrollHeight - list.clientHeight;
        if (over <= 2) { sbBar.classList.remove('on'); return; }
        sbBar.classList.add('on');
        var trackH = sbBar.clientHeight;
        var th = Math.max(24, trackH * (list.clientHeight / list.scrollHeight));
        var ty = (trackH - th) * (list.scrollTop / over);
        sbThumb.style.height = th + 'px';
        sbThumb.style.transform = 'translateY(' + ty + 'px)';
      });
    }
    list.addEventListener('scroll', syncScrollbar, { passive: true });

    function applyFilter() {
      var q = (search ? search.value : '').trim().toLowerCase().replace(/^\+/, '');
      Array.prototype.forEach.call(list.children, function (li) {
        li.hidden = q ? (li.dataset.search || li.textContent.toLowerCase()).indexOf(q) === -1 : false;
      });
      var vis = visibleItems();
      w.active = vis.length ? 0 : -1;
      list.scrollTop = 0;
      highlight();
      syncScrollbar();
    }

    function open() {
      close(true);                      // одновременно открыт только один
      pop.hidden = false;
      wrap.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      if (search) { search.value = ''; applyFilter(); }
      var sel = list.querySelector('.is-sel');
      /* с поиском список всегда открывается сверху, без подскролла к выбранному,
         иначе кажется, что попап открылся где-то в середине */
      if (search) { list.scrollTop = 0; w.active = 0; }
      else {
        w.active = sel ? Array.prototype.indexOf.call(visibleItems(), sel) : 0;
        if (sel) sel.scrollIntoView({ block: 'nearest' });
      }
      highlight();
      if (search) setTimeout(function () { search.focus(); }, 0);
      syncScrollbar();
    }
    function close(silent) {
      widgets.forEach(function (other) {
        if (silent && other === w) return;
        other.pop.hidden = true;
        other.wrap.classList.remove('is-open');
        other.btn.setAttribute('aria-expanded', 'false');
      });
    }
    w.close = function () { close(false); };

    function highlight() {
      var vis = visibleItems();
      Array.prototype.forEach.call(list.children, function (li) { li.classList.remove('is-active'); });
      if (w.active >= 0 && vis[w.active]) {
        vis[w.active].classList.add('is-active');
        vis[w.active].scrollIntoView({ block: 'nearest' });
      }
    }
    function pick(li) {
      if (!li) return;
      /* коды не уникальны (напр. +1 у США/Канады) — выбираем по iso, если есть */
      if (li.dataset.iso) {
        var byIso = select.querySelector('option[data-iso="' + li.dataset.iso + '"]');
        if (byIso) byIso.selected = true;
      } else {
        select.value = li.dataset.value;
      }
      /* change нужен именно на нативном элементе — на него подписан
         автоформат телефона в main.js */
      select.dispatchEvent(new Event('change', { bubbles: true }));
      render();
      close(false);
      btn.focus();
    }

    btn.addEventListener('click', function () {
      if (pop.hidden) open(); else close(false);
    });
    list.addEventListener('click', function (e) {
      var li = e.target.closest('.csel-opt');
      if (li) pick(li);
    });
    if (search) {
      search.addEventListener('input', applyFilter);
      search.addEventListener('keydown', function (e) {
        var vis = visibleItems();
        if (e.key === 'ArrowDown') { e.preventDefault(); w.active = Math.min(w.active + 1, vis.length - 1); highlight(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); w.active = Math.max(w.active - 1, 0); highlight(); }
        else if (e.key === 'Enter') { e.preventDefault(); pick(vis[w.active]); }
        // без stopPropagation Esc всплывал до document и закрывал всю модалку заявки
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(false); btn.focus(); }
      });
    }
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (pop.hidden) open(); else pick(visibleItems()[w.active]);
      } else if (e.key === 'Escape') {
        close(false);
      }
    });
    wrap.addEventListener('keydown', function (e) {
      if (pop.hidden || search) return;   // при поиске стрелки слушает сам input
      var vis = visibleItems();
      if (e.key === 'ArrowDown') { e.preventDefault(); w.active = Math.min(w.active + 1, vis.length - 1); highlight(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); w.active = Math.max(w.active - 1, 0); highlight(); }
      if (e.key === 'Escape') { e.preventDefault(); close(false); btn.focus(); }
    });

    // openLeadForUnit() в main.js ставит select.value напрямую, без кастомного
    // списка, и кнопка оставалась со старой подписью. Держим её в синхроне с любым
    // изменением select.
    select.addEventListener('change', function () { render(); });

    render();
    widgets.push(w);
  }

  Array.prototype.forEach.call(selects, build);

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.csel')) widgets.forEach(function (w) { w.close(); });
  });

  /* после отправки main.js зовёт leadForm.reset(). У #leadCc он возвращает первый
     вариант в текущем порядке DOM, а не +62: fillCountrySelect() ставит .selected,
     а сброс формы смотрит только на атрибут. Кнопка .csel-btn при этом не
     перерисовывается. Ждём тик после reset (событие идёт до сброса полей),
     возвращаем leadCc на ID и перерисовываем все csel. */
  var leadFormEl = document.getElementById('leadForm');
  if (leadFormEl) {
    leadFormEl.addEventListener('reset', function () {
      setTimeout(function () {
        var cc = document.getElementById('leadCc');
        if (cc) {
          var idOpt = cc.querySelector('option[data-iso="ID"]');
          if (idOpt) idOpt.selected = true;
        }
        widgets.forEach(function (w) { w.render(); });
      }, 0);
    });
  }

  /* смена языка переписывает текст <option> через data-i18n — списки надо
     перерисовать, иначе останутся подписи на прежнем языке */
  var origSetLang = window.setLang;
  if (typeof origSetLang === 'function') {
    window.setLang = function () {
      var r = origSetLang.apply(this, arguments);
      fillCountrySelect(document.getElementById('leadCc'));
      widgets.forEach(function (w) {
        if (w.select.id === 'leadCc') {
          var ph = window.bsoT('cc.search');
          var s = w.pop.querySelector('.csel-search');
          if (s) { s.placeholder = ph; s.setAttribute('aria-label', ph); }
        }
        w.render();
      });
      return r;
    };
  }
})();

(function () {
  var list = document.getElementById('faqList');
  if (!list) return;

  var items = Array.prototype.slice.call(list.querySelectorAll('.faq-item'));

  function setOpen(item, open) {
    item.classList.toggle('is-open', open);
    var btn = item.querySelector('.faq-q');
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  items.forEach(function (item) {
    setOpen(item, item.classList.contains('is-open'));
    var btn = item.querySelector('.faq-q');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var willOpen = !item.classList.contains('is-open');
      items.forEach(function (other) { setOpen(other, false); });
      setOpen(item, willOpen);
    });
  });
})();

/* «Смотреть планировку» — чип-кнопка стеклом поверх фото, план разворачивается
   оверлеем на тот же кадр, без отдельной колонки. is-open вешается на #plansViewer
   (весь кадр), а не на .plans-toggle: .plans-toggle-panel лежит рядом с кнопкой,
   не внутри, и inset:0 должен мериться от кадра. */
(function () {
  var viewer = document.getElementById('plansViewer');
  var btn = document.getElementById('plansToggleBtn');
  if (!viewer || !btn) return;
  btn.addEventListener('click', function () {
    var open = viewer.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  /* смена таба виллы закрывает панель — иначе старая схема висит открытой
     поверх фото нового типа, пока JS её не перезалил */
  var tabs = document.getElementById('plansTabs');
  if (tabs) tabs.addEventListener('click', function (e) {
    if (e.target.closest('.plans-tab')) {
      viewer.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
})();

/* Активный пункт навигации — секция, которая сейчас на экране. Линия отсчёта:
   верх страницы + высота хедера + запас, чтобы секция считалась текущей, как
   только её заголовок ушёл под хедер. */
(function () {
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  if (!navLinks.length) return;
  var sections = navLinks.map(function (a) {
    return document.querySelector(a.getAttribute('href'));
  });
  if (!sections.some(Boolean)) return;

  var header = document.querySelector('.site-header');
  var ticking = false;

  function update() {
    ticking = false;
    var headerH = header ? header.offsetHeight : 0;
    var line = window.scrollY + headerH + 24;
    var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    var current = null;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i] && sections[i].offsetTop <= line) current = sections[i];
    }
    if (atBottom) {
      for (var j = sections.length - 1; j >= 0; j--) {
        if (sections[j]) { current = sections[j]; break; }
      }
    }
    navLinks.forEach(function (a, i) {
      a.classList.toggle('is-active', !!current && sections[i] === current);
    });
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* ===== Галерея проекта: протяг мышью =====
   Трек — нативный overflow-x со спрятанным скроллбаром: пальцем листается, а на
   десктопе взяться не за что. Добавляем протяг мышью прямо за кадры; листание
   тем же scrollLeft, wireCarousel и точки не трогаем. */
(function () {
  var track = document.getElementById('galTrack');
  if (!track) return;

  /* Боковых стрелок нет: они дублировали стрелки в шапке секции. Листаем стрелками
     у заголовка (wireCarousel) и протягом мышью, на таче свайпом. */

  /* --- протяг мышью --- */
  var down = false, moved = false, suppressClick = false, startX = 0, startScroll = 0;
  track.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse') return;   /* палец и перо листают нативно */
    down = true; moved = false; suppressClick = false;
    startX = e.clientX; startScroll = track.scrollLeft;
    try { track.setPointerCapture(e.pointerId); } catch (err) {}
  });
  track.addEventListener('pointermove', function (e) {
    if (!down) return;
    var dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > 5) { moved = true; track.classList.add('is-drag'); }
    if (moved) { track.scrollLeft = startScroll - dx; e.preventDefault(); }
  });
  function endDrag(e) {
    if (!down) return;
    down = false;
    suppressClick = moved;   /* сбрасывается на следующем pointerdown, поэтому не залипает */
    track.classList.remove('is-drag');
    try { track.releasePointerCapture(e.pointerId); } catch (err) {}
  }
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);
  /* после протяга не открываем лайтбокс: гасим клик в фазе перехвата — она
     проходит раньше, чем всплытие до слушателя лайтбокса на этом же треке */
  track.addEventListener('click', function (e) {
    if (!suppressClick) return;
    suppressClick = false;
    e.stopPropagation();
    e.preventDefault();
  }, true);

  /* --- точки под галереей кликабельны --- */
  var dots = document.getElementById('galDots');
  if (dots && dots.children.length > 1) {
    Array.prototype.forEach.call(dots.children, function (d, i, arr) {
      d.addEventListener('click', function () {
        var max = track.scrollWidth - track.clientWidth;
        /* та же проекция доли прокрутки на индекс, что и в wireCarousel */
        track.scrollTo({ left: max * (i / (arr.length - 1)), behavior: 'smooth' });
      });
    });
  }
})();
