/* Языки сайта и выпадающий список в шапке.
   Выбор человека живёт в куки bso_lang (год). Главная (/) с куки другого языка
   уводит на его адрес скриптом в <head> index.html, здесь только сам список.
   Контейнер [data-lang-dd] наполняется тут. С data-inplace (юрстраницы, у них
   один адрес на все языки) клик не уходит по ссылке, а шлёт событие bso:lang. */
(function () {
  var LANGS = [
    ['en', 'English'], ['ru', 'Русский'], ['id', 'Bahasa Indonesia'],
    ['fr', 'Français'], ['es', 'Español'], ['uk', 'Українська'],
    ['it', 'Italiano'], ['tr', 'Türkçe'], ['nl', 'Nederlands']
  ];
  var CODES = LANGS.map(function (l) { return l[0]; });
  window.BSO_LANGS = CODES;

  function getCookie() {
    var m = document.cookie.match(/(?:^|;\s*)bso_lang=([a-z]{2})(?:;|$)/);
    return m && CODES.indexOf(m[1]) >= 0 ? m[1] : null;
  }
  function setCookie(l) {
    document.cookie = 'bso_lang=' + l + '; path=/; max-age=31536000; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
  }
  function url(l) { return l === 'en' ? '/' : '/' + l + '/'; }
  window.bsoLang = { codes: CODES, get: getCookie, set: setCookie, url: url };

  var CHEV = '<svg class="lang-dd-chev" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>';
  var all = [];

  function mount(root, n) {
    var inplace = root.hasAttribute('data-inplace');
    var id = 'langList' + n;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lang-dd-btn';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', id);
    var list = document.createElement('ul');
    list.className = 'lang-dd-list';
    list.id = id;
    list.hidden = true;
    list.innerHTML = LANGS.map(function (l) {
      return '<li><a href="' + url(l[0]) + '" lang="' + l[0] + '" hreflang="' + l[0] + '" data-lang-opt="' + l[0] + '">' + l[1] + '</a></li>';
    }).join('');
    root.innerHTML = '';
    root.appendChild(btn);
    root.appendChild(list);
    var links = Array.prototype.slice.call(list.querySelectorAll('a'));

    function sync(cur) {
      var name = '';
      LANGS.forEach(function (l) { if (l[0] === cur) name = l[1]; });
      btn.innerHTML = '<span>' + cur.toUpperCase() + '</span>' + CHEV;
      btn.setAttribute('aria-label', 'Language: ' + name);
      links.forEach(function (a) {
        if (a.getAttribute('data-lang-opt') === cur) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }
    function open() {
      all.forEach(function (o) { if (o !== api) o.close(); });
      list.hidden = false;
      root.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      var cur = list.querySelector('[aria-current]') || links[0];
      cur.focus();
    }
    function close(focusBtn) {
      if (list.hidden) return;
      list.hidden = true;
      root.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      if (focusBtn) btn.focus();
    }
    btn.addEventListener('click', function () { list.hidden ? open() : close(); });
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(); }
    });
    list.addEventListener('keydown', function (e) {
      var i = links.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); links[(i + 1) % links.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); links[(i - 1 + links.length) % links.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); links[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); links[links.length - 1].focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
      else if (e.key === 'Tab') close();
    });
    list.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-lang-opt]');
      if (!a) return;
      var l = a.getAttribute('data-lang-opt');
      setCookie(l);
      if (inplace) {
        e.preventDefault();
        close(true);
        document.dispatchEvent(new CustomEvent('bso:lang', { detail: l }));
      }
    });
    var api = { root: root, sync: sync, close: close };
    sync(document.documentElement.lang || 'en');
    return api;
  }

  document.querySelectorAll('[data-lang-dd]').forEach(function (root, n) { all.push(mount(root, n)); });
  document.addEventListener('click', function (e) {
    all.forEach(function (o) { if (!o.root.contains(e.target)) o.close(); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') all.forEach(function (o) { o.close(); });
  });
  window.bsoLangSync = function (l) { all.forEach(function (o) { o.sync(l); }); };
})();
