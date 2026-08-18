/* Лightbox — клик по фото в галерее проекта или в слайдере типов вилл
   открывает фулл-скрин оверлей с теми же фото (стрелки листают, крестик/
   Esc/клик по фону закрывают). Список кадров собирается из <img> контейнера
   В МОМЕНТ клика — у слайдера типов вилл разметка перестраивается JS'ом
   при смене таба/языка, статичный список сразу бы устарел. */
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
    container.style.cursor = 'zoom-in';
    container.addEventListener('click', function (e) {
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
  if (window.matchMedia('(min-width: 821px)').matches) {
    v.preload = 'auto';
    v.play().catch(function () {});
  }
})();

/* BSO v2 — аккордеон FAQ.
   Поведение как в макете «бсо2»: открыт всегда ровно один пункт, клик по
   открытому его закрывает. Высота анимируется через grid-template-rows 0fr→1fr
   (см. css/v2.css) — max-height-хак не нужен, ответы разной длины не «дёргаются».
   Скрипт грузится ПОСЛЕ ../js/main.js, ничего из него не переопределяет. */
/* Галерея проекта — та же карусель, что у шагов покупки. wireCarousel объявлена
   в ../js/main.js обычной функцией на верхнем уровне классического скрипта,
   значит доступна как window.wireCarousel; дёргаем её отсюда, чтобы не трогать
   общий файл ради блока, которого в v1 нет. */
(function () {
  if (document.getElementById('galTrack') && typeof window.wireCarousel === 'function') {
    window.wireCarousel('galTrack', 'galPrev', 'galNext', 'galDots', 400);
  }
})();

/* Кастомные выпадающие списки в форме заявки (правка Босса: нужна видимая
   стрелка и список в наших цветах — нативный попап рисует ОС, покрасить его
   нельзя). Сам <select> остаётся в DOM и остаётся источником правды: его
   читают FormData и автоформат телефона в ../js/main.js. Мы только строим
   поверх свою кнопку со списком и синхронизируем значение + событие change. */
(function () {
  var selects = document.querySelectorAll('.lead-field select');
  if (!selects.length) return;
  var CHEV = '<svg class="csel-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
             'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
  var widgets = [];

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

    var list = document.createElement('ul');
    list.className = 'csel-list';
    list.setAttribute('role', 'listbox');
    list.hidden = true;

    wrap.appendChild(btn);
    wrap.appendChild(list);

    var w = { select: select, wrap: wrap, btn: btn, list: list, active: -1 };

    function render() {
      var opts = Array.prototype.filter.call(select.options, function (o) { return !o.disabled; });
      list.innerHTML = '';
      opts.forEach(function (o) {
        var li = document.createElement('li');
        li.className = 'csel-opt' + (o.value === select.value ? ' is-sel' : '');
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', o.value === select.value ? 'true' : 'false');
        li.dataset.value = o.value;
        li.textContent = o.textContent;
        list.appendChild(li);
      });
      var cur = select.selectedOptions[0];
      var isPlaceholder = !cur || cur.disabled;
      btn.querySelector('.csel-val').textContent = cur ? cur.textContent : '';
      btn.dataset.placeholder = isPlaceholder ? 'true' : 'false';
    }
    w.render = render;

    function open() {
      close(true);                      // одновременно открыт только один
      list.hidden = false;
      wrap.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      var sel = list.querySelector('.is-sel');
      w.active = sel ? Array.prototype.indexOf.call(list.children, sel) : 0;
      highlight();
      if (sel) sel.scrollIntoView({ block: 'nearest' });
    }
    function close(silent) {
      widgets.forEach(function (other) {
        if (silent && other === w) return;
        other.list.hidden = true;
        other.wrap.classList.remove('is-open');
        other.btn.setAttribute('aria-expanded', 'false');
      });
    }
    w.close = function () { close(false); };

    function highlight() {
      Array.prototype.forEach.call(list.children, function (li, i) {
        li.classList.toggle('is-active', i === w.active);
      });
    }
    function pick(li) {
      if (!li) return;
      select.value = li.dataset.value;
      /* change нужен именно на нативном элементе — на него подписан
         автоформат телефона в main.js */
      select.dispatchEvent(new Event('change', { bubbles: true }));
      render();
      close(false);
      btn.focus();
    }

    btn.addEventListener('click', function () {
      if (list.hidden) open(); else close(false);
    });
    list.addEventListener('click', function (e) {
      var li = e.target.closest('.csel-opt');
      if (li) pick(li);
    });
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (list.hidden) open(); else pick(list.children[w.active]);
      } else if (e.key === 'Escape') {
        close(false);
      } else if (!list.hidden && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
      }
    });
    wrap.addEventListener('keydown', function (e) {
      if (list.hidden) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); w.active = Math.min(w.active + 1, list.children.length - 1); highlight(); list.children[w.active].scrollIntoView({ block: 'nearest' }); }
      if (e.key === 'ArrowUp') { e.preventDefault(); w.active = Math.max(w.active - 1, 0); highlight(); list.children[w.active].scrollIntoView({ block: 'nearest' }); }
      if (e.key === 'Escape') { e.preventDefault(); close(false); btn.focus(); }
    });

    render();
    widgets.push(w);
  }

  Array.prototype.forEach.call(selects, build);

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.csel')) widgets.forEach(function (w) { w.close(); });
  });

  /* смена языка переписывает текст <option> через data-i18n — списки надо
     перерисовать, иначе останутся подписи на прежнем языке */
  var origSetLang = window.setLang;
  if (typeof origSetLang === 'function') {
    window.setLang = function () {
      var r = origSetLang.apply(this, arguments);
      widgets.forEach(function (w) { w.render(); });
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

/* Раскрывашка «Смотреть планировку» — чип-кнопка стеклом поверх фото, план
   разворачивается оверлеем на тот же кадр (реф идея «план1»/«план2»,
   295:331/332, канал 41fc2tir, без отдельной колонки — правка Босса 04.08:
   не тратить полблока на то, что могут не открыть). is-open вешается на
   #plansViewer (весь фото-кадр), а не на .plans-toggle (маленькая кнопка) —
   .plans-toggle-panel лежит рядом с .plans-toggle, не внутри ннего, и должна
   мерить inset:0 от кадра целиком, не от кнопки. */
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

/* Активный пункт хедер-навигации — подсвечивается секция, которая сейчас
   в зоне видимости (правка Босса 04.08). Линия отсчёта — верх страницы +
   высота хедера + небольшой запас, чтобы секция считалась «текущей» сразу
   как её заголовок скрылся под хедером, а не только когда она заполнила
   весь экран. */
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

/* ===== Галерея проекта: сделать слайдер слайдером (правка Босса 17.08) =====
   Жалоба с ноутбука: «не видно слайдера, не получается слайдить». Трек — это
   нативный overflow-x со спрятанным скроллбаром: на тач-устройстве листается
   пальцем, а на десктопе взяться не за что (полосы нет, стрелки — в шапке
   секции). Добавляем протяг мышью прямо за кадры и круглые стрелки на самом
   треке; листание остаётся тем же scrollLeft, wireCarousel и точки не трогаем. */
(function () {
  var track = document.getElementById('galTrack');
  if (!track) return;

  /* обёртка: краевым стрелкам нужен позиционированный родитель ровно по треку */
  var shell = document.createElement('div');
  shell.className = 'gal-shell';
  track.parentNode.insertBefore(shell, track);
  shell.appendChild(track);

  var CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
             'stroke-linecap="round" stroke-linejoin="round"><path d="%D%"/></svg>';
  function mkBtn(dir) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'gal-edge ' + dir;
    /* дублируют стрелки в шапке секции — из таб-порядка и скринридера убираем */
    b.tabIndex = -1;
    b.setAttribute('aria-hidden', 'true');
    b.innerHTML = CHEV.replace('%D%', dir === 'prev' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6');
    b.addEventListener('click', function () {
      track.scrollBy({ left: (dir === 'prev' ? -1 : 1) * (track.clientWidth * 0.7), behavior: 'smooth' });
    });
    shell.appendChild(b);
    return b;
  }
  var bPrev = mkBtn('prev');
  var bNext = mkBtn('next');
  function syncEdges() {
    var max = track.scrollWidth - track.clientWidth;
    bPrev.disabled = track.scrollLeft <= 4;
    bNext.disabled = track.scrollLeft >= max - 4;
  }
  track.addEventListener('scroll', syncEdges, { passive: true });
  window.addEventListener('resize', syncEdges);
  syncEdges();

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
