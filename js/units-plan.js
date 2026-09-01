/* Интерактивный план (v1) — рендер таблицы юнитов + фильтры/сортировка.
   Данные — BSO_UNITS из units-data.js. Статусы: early/prebooked/booked
   (presale в шахматке объединён с early — с точки зрения покупателя это
   тоже "доступен", разница только внутренняя бухгалтерская). */
(function () {
  const tbody = document.getElementById('iplanTbody');
  if (!tbody || typeof BSO_UNITS === 'undefined') return;

  const countEl = document.getElementById('iplanCount');
  const typeFiltersEl = document.getElementById('iplanTypeFilters');
  const statusFiltersEl = document.getElementById('iplanStatusFilters');
  const table = tbody.closest('table');

  const STATUS_LABEL = {
    early: { ru: 'Доступен', en: 'Available' },
    prebooked: { ru: 'Забронирован', en: 'Reserved' },
    booked: { ru: 'Продан', en: 'Sold' },
  };

  // presale — тот же смысл, что early stage (доступен), только другая
  // внутренняя стадия продаж; для покупателя разницы нет.
  let units = BSO_UNITS.map(u => ({ ...u, st: u.st === 'presale' ? 'early' : u.st }));

  const types = Array.from(new Set(units.map(u => u.t)));
  types.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'iplan-chip';
    btn.dataset.type = t;
    btn.textContent = t;
    typeFiltersEl.appendChild(btn);
  });

  let activeType = 'all';
  let activeStatus = 'all';
  let sortKey = 'n';
  let sortDir = 1;

  // "P1".."P8" (пентхаусы) — не число, parseInt даёт NaN||0 и лезет в начало
  // сортировки перед обычными номерами; сортируем их после всех числовых.
  function unitSortValue(n) {
    return /^\d+$/.test(n) ? parseInt(n, 10) : 1000 + (parseInt(n.replace(/\D/g, ''), 10) || 0);
  }

  function fmtPrice(n) {
    return '$' + n.toLocaleString('en-US');
  }

  const RESERVE_ICON = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h10a1 1 0 0 1 1 1v13l-6-3.5L4 17V4a1 1 0 0 1 1-1z"/></svg>';
  const RESERVE_LABEL = { ru: 'Забронировать', en: 'Reserve' };

  function render() {
    const lang = (window.__bsoLang || document.documentElement.lang || 'en');
    let rows = units.filter(u =>
      (activeType === 'all' || u.t === activeType) &&
      (activeStatus === 'all' || u.st === activeStatus)
    );
    rows.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === 'n') { av = unitSortValue(av); bv = unitSortValue(bv); }
      if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
      if (av < bv) return -1 * sortDir;
      if (av > bv) return 1 * sortDir;
      return 0;
    });
    const langKey = lang === 'ru' ? 'ru' : 'en';
    tbody.innerHTML = rows.map(u => {
      const label = STATUS_LABEL[u.st][langKey];
      const reserveCell = u.st === 'booked'
        ? ''
        : `<button type="button" class="iplan-reserve-btn" data-unit="${u.n}" aria-label="${RESERVE_LABEL[langKey]}" title="${RESERVE_LABEL[langKey]}">${RESERVE_ICON}</button>`;
      return `<tr class="iplan-row is-${u.st}">
        <td>${u.n}</td>
        <td>${u.t}</td>
        <td>${String(u.s).replace('.', ',')}</td>
        <td>${fmtPrice(u.c)}</td>
        <td><span class="iplan-status is-${u.st}">${label}</span></td>
        <td class="iplan-reserve-cell">${reserveCell}</td>
      </tr>`;
    }).join('');
    const total = units.length;
    countEl.textContent = lang === 'ru'
      ? `Показано ${rows.length} из ${total} юнитов`
      : `Showing ${rows.length} of ${total} units`;
  }

  typeFiltersEl.addEventListener('click', e => {
    const btn = e.target.closest('.iplan-chip');
    if (!btn) return;
    activeType = btn.dataset.type;
    typeFiltersEl.querySelectorAll('.iplan-chip').forEach(b => b.classList.toggle('is-active', b === btn));
    render();
  });
  statusFiltersEl.addEventListener('click', e => {
    const btn = e.target.closest('.iplan-chip');
    if (!btn) return;
    activeStatus = btn.dataset.status;
    statusFiltersEl.querySelectorAll('.iplan-chip').forEach(b => b.classList.toggle('is-active', b === btn));
    render();
  });
  table.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      sortDir = (sortKey === key) ? -sortDir : 1;
      sortKey = key;
      table.querySelectorAll('th[data-sort]').forEach(t => t.classList.remove('is-sorted-asc', 'is-sorted-desc'));
      th.classList.add(sortDir === 1 ? 'is-sorted-asc' : 'is-sorted-desc');
      render();
    });
  });

  tbody.addEventListener('click', e => {
    const btn = e.target.closest('.iplan-reserve-btn');
    if (!btn) return;
    e.preventDefault();
    if (typeof window.openLeadForUnit === 'function') window.openLeadForUnit(btn.dataset.unit);
  });

  render();
  // перерисовать подписи статусов при смене языка
  const origSetLang = window.setLang;
  if (typeof origSetLang === 'function') {
    window.setLang = function (lang) {
      origSetLang(lang);
      render();
    };
  }

  /* Живая подгрузка из гугл-таблицы (units-live.js) — перезаписывает
     цену/статус/размер по номеру юнита и перерисовывает таблицу. Список
     типов/чипов не пересобираем: набор форматов виллы стабилен, меняются
     только цена/наличие. */
  window.__bsoRefreshUnits = function (freshUnits) {
    const byNumber = {};
    freshUnits.forEach(u => { byNumber[u.n] = u; });
    units = units.map(u => {
      const fresh = byNumber[u.n];
      if (!fresh) return u;
      const st = fresh.st === 'presale' ? 'early' : fresh.st;
      return { ...u, ...fresh, st };
    });
    render();
  };
})();
