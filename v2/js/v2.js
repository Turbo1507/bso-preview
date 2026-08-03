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

/* Раскрывашка «Смотреть планировку» над фото в блоке планировок — реф Figma
   «план1»/«план2» (295:331/332, канал 41fc2tir). Высота панели через
   max-height (не grid-template-rows, как у FAQ выше) — картинка внутри
   меняет intrinsic-размер при смене таба виллы, а grid 0fr→1fr анимирует
   ряд, а не контент, и рвано скакал бы при каждом переключении типа. */
(function () {
  var toggle = document.getElementById('plansToggle');
  var btn = document.getElementById('plansToggleBtn');
  if (!toggle || !btn) return;
  btn.addEventListener('click', function () {
    var open = toggle.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  /* смена таба виллы закрывает панель — иначе старая схема висит открытой
     поверх фото нового типа, пока JS её не перезалил */
  var tabs = document.getElementById('plansTabs');
  if (tabs) tabs.addEventListener('click', function (e) {
    if (e.target.closest('.plans-tab')) {
      toggle.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
})();
