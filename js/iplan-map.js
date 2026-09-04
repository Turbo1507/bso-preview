/* Интерактивная карта мастер-плана — hover-зоны по зданиям (BSO_BUILDINGS)
   + попап с наличием юнитов конкретно этого здания (данные из BSO_UNITS). */
(function () {
  const map = document.getElementById('iplanMap');
  const hotspotsEl = document.getElementById('iplanHotspots');
  const popup = document.getElementById('iplanPopup');
  if (!map || !hotspotsEl || typeof BSO_BUILDINGS === 'undefined' || typeof BSO_UNITS === 'undefined') return;

  /* Протяг мышью по плану (правка Босса 05.09, реф andreevskiy.by) — тот же
     приём, что у .gal-track в v2.js. Отдельно: пока идёт протяг, гасим
     pointer-events у слоя зон — иначе курсор при перетаскивании проходит
     через несколько зданий подряд и открывает/закрывает попапы вперемешку
     со скроллом (mouseenter не знает про drag, он не нативный browser-drag). */
  const panTrack = document.getElementById('iplanPan');
  if (panTrack) {
    let down = false, moved = false, startX = 0, startScroll = 0;
    panTrack.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') return; // палец/перо листают нативно
      down = true; moved = false;
      startX = e.clientX; startScroll = panTrack.scrollLeft;
      try { panTrack.setPointerCapture(e.pointerId); } catch (err) {}
    });
    panTrack.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) {
        moved = true;
        panTrack.classList.add('is-drag');
        hotspotsEl.style.pointerEvents = 'none';
        cancelShow(); scheduleHide();
      }
      if (moved) { panTrack.scrollLeft = startScroll - dx; e.preventDefault(); }
    });
    const endDrag = e => {
      if (!down) return;
      down = false;
      panTrack.classList.remove('is-drag');
      hotspotsEl.style.pointerEvents = '';
      try { panTrack.releasePointerCapture(e.pointerId); } catch (err) {}
    };
    panTrack.addEventListener('pointerup', endDrag);
    panTrack.addEventListener('pointercancel', endDrag);
  }

  const STATUS_LABEL = {
    early: { ru: 'Доступен', en: 'Available' },
    prebooked: { ru: 'Забронирован', en: 'Reserved' },
    booked: { ru: 'Продан', en: 'Sold' },
    presale: { ru: 'Доступен', en: 'Available' },
  };
  let unitsByNumber = {};
  BSO_UNITS.forEach(u => { unitsByNumber[u.n] = u; });

  // Попап лежит НИЖЕ зоны здания с зазором. Раньше он закрывался сразу на
  // mouseleave зоны — курсор не успевал доехать до кнопки брони внутри попапа.
  // Теперь закрытие отложенное (закрываем с задержкой), и пока мышь над самим
  // попапом — отменяем закрытие. Курсор свободно переходит зона → попап → кнопка.
  let hideTimer = null;
  const cancelHide = () => { if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; } };
  // Здания у Босса обведены вручную (Pen tool) — контур местами зубчатый
  // (мелкие насечки по силуэту крыши), у некоторых зданий (напр. n:10,
  // "102-103") это создавало флики на границе: курсор чуть дрожит на стыке
  // двух соседних вершин зубца — мышь входит-выходит-входит из полигона за
  // доли секунды, mouseenter/mouseleave чередуются, и то, что успевает
  // сработать последним перед проверкой — то и остаётся ("через раз
  // получается перейти в попап" — Босс 04.09). Небольшая задержка на show
  // (как в любом hover-меню) гасит это дрожание: попап открывается, только
  // если курсор реально задержался в зоне, а не мазнул по зубцу.
  let showTimer = null;
  const cancelShow = () => { if (showTimer) { clearTimeout(showTimer); showTimer = null; } };
  const closePopup = () => {
    hideTimer = null;
    hotspotsEl.querySelectorAll('.iplan-hotspot').forEach(z => z.classList.remove('is-active'));
    popup.classList.remove('is-open');
    if (svg) svg.classList.remove('is-dim');   // снять затемнение фона
  };
  const scheduleHide = () => { cancelHide(); hideTimer = setTimeout(closePopup, 160); };

  popup.addEventListener('mouseenter', cancelHide);
  popup.addEventListener('mouseleave', scheduleHide);

  // Зоны — SVG-полигоны поверх карты: только золотой контур по силуэту здания
  // + свечение, БЕЗ заливки (правка Босса). viewBox 0..100 + preserveAspectRatio
  // none → точки b.poly (в % от картинки) ложатся 1:1 на бокс карты.
  // non-scaling-stroke — чтобы линия не растягивалась анизотропно.
  const SVGNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('class', 'iplan-hotspots-svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('preserveAspectRatio', 'none');
  hotspotsEl.appendChild(svg);

  // Слой затемнения фона: полупрозрачный прямоугольник на всю карту с ДЫРКОЙ
  // по контуру активной зоны (fill-rule:evenodd). d обновляется на hover.
  // Откат фичи: удалить этот блок + класс is-dim ниже + CSS .iplan-dim-path.
  const dimPath = document.createElementNS(SVGNS, 'path');
  dimPath.setAttribute('class', 'iplan-dim-path');
  svg.appendChild(dimPath);
  const zoneSubpath = b => Array.isArray(b.poly) && b.poly.length >= 3
    ? 'M' + b.poly.map(p => p[0] + ' ' + p[1]).join('L') + 'Z'
    : `M${b.l} ${b.t}H${b.l + b.w}V${b.t + b.h}H${b.l}Z`;

  BSO_BUILDINGS.forEach(b => {
    let zone;
    if (Array.isArray(b.poly) && b.poly.length >= 3) {
      zone = document.createElementNS(SVGNS, 'polygon');
      zone.setAttribute('points', b.poly.map(p => p[0] + ',' + p[1]).join(' '));
    } else {
      zone = document.createElementNS(SVGNS, 'rect');
      zone.setAttribute('x', b.l); zone.setAttribute('y', b.t);
      zone.setAttribute('width', b.w); zone.setAttribute('height', b.h);
    }
    zone.setAttribute('class', 'iplan-hotspot');
    zone.setAttribute('vector-effect', 'non-scaling-stroke');
    zone.dataset.buildingId = b.n;
    svg.appendChild(zone);

    const show = () => {
      cancelHide();
      svg.querySelectorAll('.iplan-hotspot').forEach(z => z.classList.toggle('is-active', z === zone));
      dimPath.setAttribute('d', 'M0 0H100V100H0Z' + zoneSubpath(b));
      svg.classList.add('is-dim');
      renderPopup(b, zone);
    };
    zone.addEventListener('mouseenter', () => {
      cancelShow();
      showTimer = setTimeout(() => { showTimer = null; show(); }, 55);
    });
    zone.addEventListener('mouseleave', () => { cancelShow(); scheduleHide(); });
    zone.addEventListener('click', e => { e.preventDefault(); cancelShow(); show(); });
  });

  map.addEventListener('mouseleave', scheduleHide);

  function fmtPrice(n) { return '$' + n.toLocaleString('en-US'); }

  const RESERVE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>';
  const RESERVE_LABEL = { ru: 'Забронировать', en: 'Reserve' };
  const ALL_SOLD_LABEL = { ru: 'Все юниты этого здания проданы', en: 'All units in this building are sold' };

  /* Зоны укрупнённые (одна масса рендера = много юнитов) — в заголовке попапа
     сворачиваем подряд идущие номера в диапазоны: 1,2,3,...,20,P1,...,P8 →
     «1–20, P1–P8». Числовые и P-юниты нумеруются отдельными сериями. */
  function fmtUnitList(list) {
    const groups = { num: [], P: [], other: [] };
    list.forEach(u => {
      const s = String(u);
      if (/^\d+$/.test(s)) groups.num.push(+s);
      else if (/^P\d+$/i.test(s)) groups.P.push(+s.slice(1));
      else groups.other.push(s);
    });
    const runs = arr => {
      arr.sort((a, b) => a - b);
      const out = [];
      let i = 0;
      while (i < arr.length) {
        let j = i;
        while (j + 1 < arr.length && arr[j + 1] === arr[j] + 1) j++;
        out.push(j > i ? `${arr[i]}–${arr[j]}` : `${arr[i]}`);
        i = j + 1;
      }
      return out;
    };
    const pRuns = runs(groups.P).map(r => r.includes('–') ? 'P' + r.split('–').join('–P') : 'P' + r);
    return [...runs(groups.num), ...pRuns, ...groups.other].join(', ');
  }

  function renderPopup(building, zone) {
    const lang = (window.__bsoLang || document.documentElement.lang || 'en') === 'ru' ? 'ru' : 'en';
    // проданные юниты в попапе НЕ показываем (правка Босса 01.09) — только
    // в развёрнутой таблице сбоку, там статус "Продан" остаётся как есть
    const allUnits = building.units.map(n => unitsByNumber[n]).filter(Boolean);
    const units = allUnits.filter(u => u.st !== 'booked');
    const title = lang === 'ru' ? `Юниты: ${fmtUnitList(building.units)}` : `Units: ${fmtUnitList(building.units)}`;
    if (units.length === 0) {
      popup.innerHTML = `<div class="iplan-popup-title">${title}</div><p class="iplan-popup-empty">${ALL_SOLD_LABEL[lang]}</p>`;
    } else {
      const rows = units.map(u => {
        const st = u.st === 'presale' ? 'early' : u.st;
        const label = STATUS_LABEL[st][lang];
        return `<li class="iplan-popup-row is-${st}"><b>${u.n}</b><span>${u.t}</span><span class="iplan-status is-${st}">${label}</span><span>${fmtPrice(u.c)}</span><button type="button" class="iplan-reserve-btn" data-unit="${u.n}" aria-label="${RESERVE_LABEL[lang]}" title="${RESERVE_LABEL[lang]}">${RESERVE_ICON}</button></li>`;
      }).join('');
      popup.innerHTML = `<div class="iplan-popup-title">${title}</div><ul class="iplan-popup-list">${rows}</ul>`;
    }

    // Попап уезжает В БОК от зоны (не поверх неё): вправо если есть место,
    // иначе влево; на узкой карте (моб.) — снизу/сверху как раньше.
    const mapRect = map.getBoundingClientRect();
    const zoneRect = zone.getBoundingClientRect();
    popup.classList.add('is-open');
    const popupRect = popup.getBoundingClientRect();
    const GAP = 14;
    const pw = popupRect.width, ph = popupRect.height;
    const zL = zoneRect.left - mapRect.left;
    const zR = zoneRect.right - mapRect.left;
    const zT = zoneRect.top - mapRect.top;
    const zCy = zT + zoneRect.height / 2;
    let left, top;

    if (mapRect.width < 560) {
      // мобилка: снизу зоны, при нехватке — сверху
      left = zL + zoneRect.width / 2 - pw / 2;
      top = zT + zoneRect.height + 10;
      if (top + ph > mapRect.height - 8) top = zT - ph - 10;
    } else {
      const roomRight = mapRect.width - zR - GAP;
      const roomLeft = zL - GAP;
      if (roomRight >= pw) left = zR + GAP;            // вправо
      else if (roomLeft >= pw) left = zL - GAP - pw;   // влево
      else left = roomRight >= roomLeft ? mapRect.width - pw - 8 : 8; // куда больше места
      // по вертикали — по центру зоны
      top = zCy - ph / 2;
    }
    // жёсткий клэмп в пределах карты
    left = Math.max(8, Math.min(left, mapRect.width - pw - 8));
    top = Math.max(8, Math.min(top, mapRect.height - ph - 8));
    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
  }

  /* u.t ("STUDIO GARDEN", "1BD SKY", "PENTHOUSE OCEAN VIEW"...) -> data-plan
     таба в блоке #plans ("studio","1bdsky"...). Пентхаусы (P1-P8) своего
     таба не имеют — для них null, старое поведение (открыть лид-форму). */
  function unitTypeToPlanId(t) {
    const s = (t || '').toUpperCase();
    if (s.includes('STUDIO')) return 'studio';
    if (s.includes('PENTHOUSE')) return null;
    if (s.startsWith('1BD SKY')) return '1bdsky';
    if (s.startsWith('1BD')) return '1bd';
    if (s.startsWith('2BD')) return '2bd';
    if (s.startsWith('3BD SKY')) return '3bdsky';
    if (s.startsWith('3BD')) return '3bd';
    if (s.startsWith('4BD')) return '4bd';
    return null;
  }

  popup.addEventListener('click', e => {
    const btn = e.target.closest('.iplan-reserve-btn');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    // Правка Босса 04.09: кнопка на юните плана теперь "проваливается" в блок
    // Layouts на подходящий таб (а не сразу открывает лид-форму) — план
    // виллы важнее увидеть до брони. Резерв конкретного юнита остаётся
    // доступен через CTA внутри самого блока Layouts (.js-lead-open).
    // Пентхаусы без своего таба — как раньше, сразу лид-форма.
    const unit = unitsByNumber[btn.dataset.unit];
    const planId = unit && unitTypeToPlanId(unit.t);
    const tabBtn = planId && document.querySelector(`.plans-tab[data-plan="${planId}"]`);
    if (tabBtn) {
      closePopup();
      tabBtn.click();
      // block:'start' на всей секции прятал CTA «Узнать подробнее» под
      // фолдом (заголовок+лид+вкладки съедают верх экрана, фото-коллаж
      // 600px высотой — кнопка внизу панели не влезала). Правка Босса:
      // скроллим на саму CTA-строку по центру экрана — гарантированно видно
      // и кнопку, и коллаж/статы над ней, независимо от высоты вьюпорта.
      const ctaRow = document.querySelector('.plans-cta-row');
      (ctaRow || document.getElementById('plans')).scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (typeof window.openLeadForUnit === 'function') {
      window.openLeadForUnit(btn.dataset.unit);
    }
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
