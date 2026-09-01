/* Интерактивная карта мастер-плана — hover-зоны по зданиям (BSO_BUILDINGS)
   + попап с наличием юнитов конкретно этого здания (данные из BSO_UNITS). */
(function () {
  const map = document.getElementById('iplanMap');
  const hotspotsEl = document.getElementById('iplanHotspots');
  const popup = document.getElementById('iplanPopup');
  if (!map || !hotspotsEl || typeof BSO_BUILDINGS === 'undefined' || typeof BSO_UNITS === 'undefined') return;

  const STATUS_LABEL = {
    early: { ru: 'Доступен', en: 'Available' },
    prebooked: { ru: 'Забронирован', en: 'Reserved' },
    booked: { ru: 'Продан', en: 'Sold' },
    presale: { ru: 'Доступен', en: 'Available' },
  };
  let unitsByNumber = {};
  BSO_UNITS.forEach(u => { unitsByNumber[u.n] = u; });

  BSO_BUILDINGS.forEach(b => {
    const zone = document.createElement('div');
    zone.className = 'iplan-hotspot';
    zone.style.left = b.l + '%';
    zone.style.top = b.t + '%';
    zone.style.width = b.w + '%';
    zone.style.height = b.h + '%';
    zone.dataset.buildingId = b.n;
    hotspotsEl.appendChild(zone);

    const show = () => {
      hotspotsEl.querySelectorAll('.iplan-hotspot').forEach(z => z.classList.toggle('is-active', z === zone));
      renderPopup(b, zone);
    };
    const hide = () => {
      zone.classList.remove('is-active');
      popup.classList.remove('is-open');
    };
    zone.addEventListener('mouseenter', show);
    zone.addEventListener('mouseleave', hide);
    zone.addEventListener('click', e => { e.preventDefault(); show(); });
  });

  map.addEventListener('mouseleave', () => {
    hotspotsEl.querySelectorAll('.iplan-hotspot').forEach(z => z.classList.remove('is-active'));
    popup.classList.remove('is-open');
  });

  function fmtPrice(n) { return '$' + n.toLocaleString('en-US'); }

  const RESERVE_ICON = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h10a1 1 0 0 1 1 1v13l-6-3.5L4 17V4a1 1 0 0 1 1-1z"/></svg>';
  const RESERVE_LABEL = { ru: 'Забронировать', en: 'Reserve' };
  const ALL_SOLD_LABEL = { ru: 'Все юниты этого здания проданы', en: 'All units in this building are sold' };

  function renderPopup(building, zone) {
    const lang = (window.__bsoLang || document.documentElement.lang || 'en') === 'ru' ? 'ru' : 'en';
    // проданные юниты в попапе НЕ показываем (правка Босса 01.09) — только
    // в развёрнутой таблице сбоку, там статус "Продан" остаётся как есть
    const allUnits = building.units.map(n => unitsByNumber[n]).filter(Boolean);
    const units = allUnits.filter(u => u.st !== 'booked');
    const title = lang === 'ru' ? `Юниты: ${building.units.join(', ')}` : `Units: ${building.units.join(', ')}`;
    if (units.length === 0) {
      popup.innerHTML = `<div class="iplan-popup-title">${title}</div><p class="iplan-popup-empty">${ALL_SOLD_LABEL[lang]}</p>`;
    } else {
      const rows = units.map(u => {
        const st = u.st === 'presale' ? 'early' : u.st;
        const label = STATUS_LABEL[st][lang];
        return `<li class="iplan-popup-row is-${st}"><b>${u.n}</b><span>${u.t}</span><span>${fmtPrice(u.c)}</span><span class="iplan-status is-${st}">${label}</span><button type="button" class="iplan-reserve-btn" data-unit="${u.n}" aria-label="${RESERVE_LABEL[lang]}" title="${RESERVE_LABEL[lang]}">${RESERVE_ICON}</button></li>`;
      }).join('');
      popup.innerHTML = `<div class="iplan-popup-title">${title}</div><ul class="iplan-popup-list">${rows}</ul>`;
    }

    // позиционируем попап рядом со зданием, не давая уехать за край карты
    const mapRect = map.getBoundingClientRect();
    const zoneRect = zone.getBoundingClientRect();
    popup.classList.add('is-open');
    const popupRect = popup.getBoundingClientRect();
    let left = zoneRect.left - mapRect.left + zoneRect.width / 2 - popupRect.width / 2;
    left = Math.max(8, Math.min(left, mapRect.width - popupRect.width - 8));
    let top = zoneRect.top - mapRect.top + zoneRect.height + 10;
    if (top + popupRect.height > mapRect.height - 8) {
      top = zoneRect.top - mapRect.top - popupRect.height - 10;
    }
    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
  }

  popup.addEventListener('click', e => {
    const btn = e.target.closest('.iplan-reserve-btn');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    if (typeof window.openLeadForUnit === 'function') window.openLeadForUnit(btn.dataset.unit);
  });

  const origSetLang = window.setLang;
  if (typeof origSetLang === 'function') {
    window.setLang = function (lang) {
      origSetLang(lang);
      const active = hotspotsEl.querySelector('.iplan-hotspot.is-active');
      if (active) {
        const b = BSO_BUILDINGS[active.dataset.buildingId];
        if (b) renderPopup(b, active);
      }
    };
  }

  /* Живая подгрузка из гугл-таблицы (units-live.js) — обновляет цену/статус
     по номеру юнита и, если попап сейчас открыт, перерисовывает его. */
  window.__bsoRefreshMapUnits = function (freshUnits) {
    freshUnits.forEach(u => {
      if (unitsByNumber[u.n]) Object.assign(unitsByNumber[u.n], u);
    });
    const active = hotspotsEl.querySelector('.iplan-hotspot.is-active');
    if (active) {
      const b = BSO_BUILDINGS[active.dataset.buildingId];
      if (b) renderPopup(b, active);
    }
  };
})();
