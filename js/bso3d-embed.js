/* 3D-карта посёлка. В блоке обложка с кнопкой, сама карта открывается только на весь экран, на любой ширине.
   Заявка из карты открывает форму сайта: лид-бот, источник заявки и согласие работают как везде. */
(function () {
  var box = document.getElementById('bso3d');
  if (!box) return;

  var OPEN = { en: 'See available villas', ru: 'Смотреть свободные виллы', id: 'Lihat vila yang tersedia', fr: 'Voir les villas disponibles',
    es: 'Ver villas disponibles', uk: 'Дивитися вільні вілли', it: 'Vedi le ville disponibili', tr: 'Müsait villaları gör', nl: 'Bekijk beschikbare villa’s' };
  var CLOSE = { en: 'Close', ru: 'Закрыть', id: 'Tutup', fr: 'Fermer', es: 'Cerrar', uk: 'Закрити', it: 'Chiudi', tr: 'Kapat', nl: 'Sluiten' };
  var OWN_COPY = { fr: 1, es: 1, uk: 1, it: 1, tr: 1, nl: 1 };

  function lang() { return String(window.__bsoLang || document.documentElement.lang || 'en').slice(0, 2).toLowerCase(); }
  function word(dict) { return dict[lang()] || dict.en; }
  function url() {
    var l = lang();
    return OWN_COPY[l] ? '/3d/l/' + l + '/index.html?embed=1&host=main' : '/3d/index.html?embed=1&host=main&lang=' + (l === 'ru' || l === 'id' ? l : 'en');
  }

  var frame = null, x = null, isFull = false, top0 = 0, y0 = 0, anchor = null, paused = [];

  function makeFrame() {
    var f = document.createElement('iframe');
    f.src = url();
    f.title = 'Black Sands Oasis, 3D';
    f.addEventListener('load', function () { watch(f); });
    return f;
  }

  // пока внутри карты открыта панель, галерея или фильм, у них свой выход, наш крест лёг бы на их заголовок
  function watch(f) {
    try {
      var d = f.contentDocument, sync = function () {
        d.documentElement.classList.add('bso-nofull');
        var c = d.body.classList;
        if (x) x.classList.toggle('is-covered', c.contains('has-upage') || c.contains('has-rgal') || c.contains('is-touring') || c.contains('has-rq-open'));
      };
      sync();
      new MutationObserver(sync).observe(d.body, { attributes: true, attributeFilter: ['class'] });
    } catch (e) {}
  }

  function closeButton() {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'bso3d-close';
    b.setAttribute('aria-label', word(CLOSE));
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
    b.addEventListener('click', function () { exitFull(false); });
    return b;
  }

  // страница под картой не рисуется и не проигрывает видео: вся мощность уходит карте
  function pausePage() {
    paused = [].filter.call(document.querySelectorAll('video'), function (v) { return !v.paused; });
    paused.forEach(function (v) { v.pause(); });
  }
  function resumePage() {
    paused.forEach(function (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); });
    paused = [];
  }

  // from: кнопка, которой открыли карту. После закрытия человек остаётся у неё, а не у блока карты
  function enterFull(from) {
    if (isFull) return;
    isFull = true;
    var el = from && from.nodeType === 1 ? from : null;
    // пункт меню в шапке или в оверлее на месте не стоит, тогда держим саму прокрутку
    anchor = el ? (el.closest('.site-header, .menu-overlay') ? null : el) : box;
    y0 = window.scrollY;
    top0 = anchor ? anchor.getBoundingClientRect().top : 0;
    document.documentElement.classList.add('bso3d-lock');
    // анимация появления блока даёт предку transform, и fixed считается от него, а не от экрана
    for (var p = box.parentElement; p && p !== document.body; p = p.parentElement) {
      if (getComputedStyle(p).transform !== 'none') { p.style.transition = 'none'; p.style.transform = 'none'; }
      // карту открыли из шапки или первого экрана: блок ещё не проявился и прозрачен
      if (p.classList.contains('reveal')) p.classList.add('in');
    }
    box.classList.add('bso3d--full');
    pausePage();
    frame = makeFrame();
    box.appendChild(frame);
    x = closeButton();
    box.appendChild(x);
    try { history.pushState({ bso3d: 1 }, ''); } catch (e) {}
  }

  function exitFull(fromHistory) {
    if (!isFull) return;
    isFull = false;
    box.classList.remove('bso3d--full');
    document.documentElement.classList.remove('bso3d-lock');
    if (x) { x.remove(); x = null; }
    // закрытие убирает карту из памяти и с видеокарты
    if (frame) { frame.remove(); frame = null; }
    resumePage();
    // пока карта была открыта, страница могла сдвинуться: возвращаем кнопку на то же место экрана
    var d = anchor ? anchor.getBoundingClientRect().top - top0 : y0 - window.scrollY;
    if (Math.abs(d) > 1) window.scrollTo({ top: window.scrollY + d, behavior: 'instant' });
    if (!fromHistory && history.state && history.state.bso3d) history.back();
  }

  window.__bsoMapFull = enterFull;

  // карта открыта из планировок: когда загрузится, сама выбирает этот формат и показывает его свободные виллы
  var TYPE = { studio: 'STUDIO', '1bd': '1BD', '1bdsky': '1BD', '2bd': '2BD', '3bd': '3BD', '3bdsky': '3BD', '4bd': '4BD' };
  function pick(key) {
    var f = frame, tries = 0, calm = 0, clicks = 0, wait = 0;
    (function tick() {
      if (!f || f !== frame || tries++ > 300) return;
      try {
        var w = f.contentWindow, d = f.contentDocument, c = d && d.body && d.body.classList;
        var t = c && d.querySelector('.rdock__tab[data-key="' + key + '"]');
        // студии живут в корпусе: вместо списка карта открывает разрез по этажам
        if (t && (t.classList.contains('is-on') || (key === 'STUDIO' && c.contains('is-stack')))) return;
        // карта загрузилась, загрузчик снят, заставка доиграла, и так хотя бы секунду
        var idle = t && w.__bso && w.__bso.booted && w.__bso.booted() && !d.getElementById('loader') && !c.contains('is-intro') && !c.contains('intro-fade');
        calm = idle ? calm + 1 : 0;
        // пока карта готовит графику, нажатие срабатывает через пару секунд; второе нажатие сняло бы выбор
        if (wait > 0) wait--;
        else if (calm >= 4 && clicks < 2) { t.click(); clicks++; wait = 20; }
      } catch (e) {}
      setTimeout(tick, 300);
    })();
  }

  // кнопки «в 3D» в шапке, на первом экране и в планировках открывают карту сразу, без прокрутки к блоку
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('.js-map-open');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    enterFull(a);
    if (a.hasAttribute('data-map-plans')) {
      var tab = document.querySelector('#plansTabs .is-active'), key = tab && TYPE[tab.getAttribute('data-plan')];
      if (key) pick(key);
    }
  });
  ['pointerover', 'touchstart', 'focusin'].forEach(function (ev) {
    document.addEventListener(ev, function (e) {
      if (e.target && e.target.closest && e.target.closest('.js-map-open')) warm();
    }, { passive: true });
  });

  window.__bsoMapEsc = function () { exitFull(false); };

  window.__bsoMapLead = function (unit, agent) {
    var modal = document.getElementById('leadModal');
    if (isFull && modal) {
      // карта остаётся открытой под формой, после закрытия формы человек там же, где был
      var root = document.documentElement;
      root.classList.add('bso3d-form');
      var mo = new MutationObserver(function () {
        if (modal.classList.contains('is-open')) return;
        mo.disconnect();
        // снимаем позже: Esc, который закрыл форму, не должен закрыть и карту
        setTimeout(function () {
          root.classList.remove('bso3d-form');
          if (frame) frame.focus();
        }, 0);
      });
      mo.observe(modal, { attributes: true, attributeFilter: ['class'] });
    } else {
      exitFull(false);
    }
    var comment = document.querySelector('#leadForm textarea[name="comment"], textarea[name="comment"]');
    if (unit && typeof window.openLeadForUnit === 'function') {
      window.openLeadForUnit(unit);
      if (agent && comment) comment.value += ' (agent)';
      return;
    }
    // без номера: общая форма, у ссылки на минуту снимаем её тему
    var a = document.querySelector('.js-lead-open');
    if (!a) return;
    var intent = a.dataset.leadIntent;
    delete a.dataset.leadIntent;
    if (comment) comment.value = agent ? '(agent)' : '';
    a.click();
    if (intent) a.dataset.leadIntent = intent;
  };

  window.addEventListener('popstate', function () { exitFull(true); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !document.documentElement.classList.contains('bso3d-form')) exitFull(false);
  });

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'bso3d-open';
  btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 3 7.5 12 12l9-4.5L12 3Z"/><path d="m3 12 9 4.5 9-4.5"/><path d="m3 16.5 9 4.5 9-4.5"/></svg><span></span>';
  btn.querySelector('span').textContent = word(OPEN);
  btn.addEventListener('click', enterFull);
  box.appendChild(btn);

  // пока человек подъезжает к блоку, файлы карты тихо ложатся в кеш: нажал, и ждать меньше
  var warmed = false;
  function warm() {
    if (warmed) return;
    warmed = true;
    var c = navigator.connection;
    if (c && (c.saveData || /2g/.test(c.effectiveType || ''))) return;
    var get = function (u) { return fetch(u, { priority: 'low', credentials: 'same-origin' }).catch(function () {}); };
    var queue = [], busy = 0;
    function pump() {
      while (busy < 4 && queue.length) {
        busy++;
        get(queue.shift()).then(function () { busy--; pump(); });
      }
    }
    var page = url(), base = page.slice(0, page.lastIndexOf('/') + 1), phone = innerWidth <= 900;
    get(page).then(function (r) { return r && r.text(); }).then(function (h) {
      var m = h && h.match(/index-(\w+)\.js/);
      if (!m) return;
      var tag = m[1], re = /(?:href|src)="(\/3d\/[^"]+?\.(?:js|css)(?:\?[^"]*)?)"/g, f;
      while ((f = re.exec(h))) queue.push(f[1]);
      queue.push('/3d/poster2-' + (phone ? 'p' : 'd') + '.webp');
      ['N8AO', 'reception', 'roads', 'LineMaterial', 'LineSegments2', 'LineSegmentsGeometry'].forEach(function (c) { queue.push(base + 'assets/' + c + '-' + tag + '.js'); });
      pump();
      return get('/3d/warm.json?v=' + tag).then(function (r) { return r && r.json(); }).then(function (w) {
        if (w) { queue = queue.concat(w[phone ? 'low' : 'high'] || []); pump(); }
      });
    }).catch(function () {});
  }
  if ('IntersectionObserver' in window) {
    var near = new IntersectionObserver(function (es) {
      if (es.some(function (x) { return x.isIntersecting; })) { near.disconnect(); warm(); }
    }, { rootMargin: '900px 0px' });
    near.observe(box);
  }
  btn.addEventListener('pointerenter', warm);
  // на ПК кнопка карты есть уже на первом экране: файлы карты тихо качаются, как только страница освободилась
  if (innerWidth > 900) window.addEventListener('load', function () {
    setTimeout(function () { (window.requestIdleCallback || setTimeout)(warm, 2000); }, 3000);
  });

  // язык сайта поменялся без перезагрузки страницы
  document.addEventListener('bso:lang', function () {
    setTimeout(function () {
      if (frame) frame.src = url();
      var b = box.querySelector('.bso3d-open span');
      if (b) b.textContent = word(OPEN);
    }, 0);
  });
})();
