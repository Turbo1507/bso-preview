/* 3D-карта посёлка. В блоке обложка с кнопкой, сама карта открывается только на весь экран, на любой ширине.
   Заявка из карты открывает форму сайта: лид-бот, источник заявки и согласие работают как везде. */
(function () {
  var box = document.getElementById('bso3d');
  if (!box) return;

  var OPEN = { en: 'Open 3D map', ru: 'Открыть 3D-карту', id: 'Buka peta 3D', fr: 'Ouvrir la carte 3D', es: 'Abrir el mapa 3D',
    uk: 'Відкрити 3D-карту', it: 'Apri la mappa 3D', tr: '3D haritayı aç', nl: '3D-kaart openen' };
  var CLOSE = { en: 'Close', ru: 'Закрыть', id: 'Tutup', fr: 'Fermer', es: 'Cerrar', uk: 'Закрити', it: 'Chiudi', tr: 'Kapat', nl: 'Sluiten' };
  var OWN_COPY = { fr: 1, es: 1, uk: 1, it: 1, tr: 1, nl: 1 };

  function lang() { return String(window.__bsoLang || document.documentElement.lang || 'en').slice(0, 2).toLowerCase(); }
  function word(dict) { return dict[lang()] || dict.en; }
  function url() {
    var l = lang();
    return OWN_COPY[l] ? '/3d/l/' + l + '/index.html?embed=1&host=main' : '/3d/index.html?embed=1&host=main&lang=' + (l === 'ru' || l === 'id' ? l : 'en');
  }

  var frame = null, x = null, isFull = false, top0 = 0, paused = [];

  function makeFrame() {
    var f = document.createElement('iframe');
    f.src = url();
    f.title = 'Black Sands Oasis, 3D';
    f.addEventListener('load', function () { watch(f); });
    return f;
  }

  // пока внутри карты открыта панель, галерея, фильм или прогулка, у них свой выход, наш крест лёг бы на их заголовок
  function watch(f) {
    try {
      var d = f.contentDocument, sync = function () {
        d.documentElement.classList.add('bso-nofull');
        var c = d.body.classList;
        if (x) x.classList.toggle('is-covered', c.contains('has-upage') || c.contains('walking') || c.contains('has-rgal') || c.contains('is-touring') || c.contains('has-rq-open'));
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

  function enterFull() {
    if (isFull) return;
    isFull = true;
    top0 = box.getBoundingClientRect().top;
    document.documentElement.classList.add('bso3d-lock');
    // анимация появления блока даёт предку transform, и fixed считается от него, а не от экрана
    for (var p = box.parentElement; p && p !== document.body; p = p.parentElement) {
      if (getComputedStyle(p).transform !== 'none') { p.style.transition = 'none'; p.style.transform = 'none'; }
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
    // пока карта была открыта, страница могла сдвинуться: возвращаем блок на место
    var d = box.getBoundingClientRect().top - top0;
    if (Math.abs(d) > 1) window.scrollTo({ top: window.scrollY + d, behavior: 'instant' });
    if (!fromHistory && history.state && history.state.bso3d) history.back();
  }

  window.__bsoMapFull = enterFull;

  window.__bsoMapEsc = function () { exitFull(false); };

  window.__bsoMapLead = function (unit, agent) {
    exitFull(false);
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
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') exitFull(false); });

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'bso3d-open';
  btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 3 7.5 12 12l9-4.5L12 3Z"/><path d="m3 12 9 4.5 9-4.5"/><path d="m3 16.5 9 4.5 9-4.5"/></svg><span></span>';
  btn.querySelector('span').textContent = word(OPEN);
  btn.addEventListener('click', enterFull);
  box.appendChild(btn);

  // язык сайта поменялся без перезагрузки страницы
  document.addEventListener('bso:lang', function () {
    setTimeout(function () {
      if (frame) frame.src = url();
      var b = box.querySelector('.bso3d-open span');
      if (b) b.textContent = word(OPEN);
    }, 0);
  });
})();
