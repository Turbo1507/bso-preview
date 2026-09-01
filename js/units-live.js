/* Живая подгрузка шахматки юнитов из Google Sheets — обновляет цену/статус
   (и, если есть, размер) поверх статичных данных из units-data.js при
   каждом заходе на страницу. Ничего не ломает при недоступности сети: если
   fetch падает или формат не распознан, молча остаёмся на статичных данных
   (units-data.js), которые уже отрендерены синхронно units-plan.js/iplan-map.js.

   БЕЗОПАСНОСТЬ (просьба Босса 01.09, "неохота сливать файл таблицы"): сюда
   подставляется ссылка "Опубликовать в интернете" (Файл → Опубликовать в
   интернете → выбрать конкретный лист → CSV), НЕ обычная ссылка на
   редактирование/просмотр файла. Публикация отдаёт только один снапшот
   ОДНОГО листа как CSV — не даёт скачать саму книгу, не даёт доступа к
   остальным листам/формулам/истории версий. Если когда-нибудь понадобится
   отозвать публичный доступ — снять публикацию в тех же настройках, ссылка
   сразу перестанет отвечать.

   ЗАПОЛНИТЬ перед боевым использованием: BSO_SHEET_CSV_URL. */
(function () {
  const BSO_SHEET_CSV_URL = ''; // <- сюда вставить ссылку "Опубликовать в интернете" (CSV)
  if (!BSO_SHEET_CSV_URL) { console.warn('[units-live] BSO_SHEET_CSV_URL не задан — остаёмся на статичных данных units-data.js'); return; }

  // ---------- разбор CSV с учётом кавычек (запятые/переводы строк внутри полей) ----------
  function parseCSV(text) {
    const rows = [];
    let row = [], field = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
        } else field += c;
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field); field = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field); field = '';
        if (row.length > 1 || row[0] !== '') rows.push(row);
        row = [];
      } else field += c;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  // ---------- сопоставление колонок по имени заголовка (не по индексу —
  // порядок колонок в живой таблице может отличаться от статичного массива) ----------
  const HEADER_MATCH = {
    n: /unit|юнит|номер|№/i,
    t: /type|тип/i,
    s: /size|m2|m²|площадь/i,
    c: /price|цена|\$/i,
    st: /status|статус/i,
  };

  function normalizeStatus(raw) {
    const v = String(raw || '').trim().toLowerCase();
    if (/^(booked|sold|продан)/.test(v)) return 'booked';
    if (/^(prebooked|reserved|резерв|брон)/.test(v)) return 'prebooked';
    if (/^(early|presale|available|доступ|своб)/.test(v)) return 'early';
    return null; // неизвестное значение — не трогаем существующий статус
  }

  function rowsToUnits(rows) {
    if (rows.length < 2) return [];
    const header = rows[0].map(h => h.trim());
    const colIdx = {};
    Object.keys(HEADER_MATCH).forEach(key => {
      const idx = header.findIndex(h => HEADER_MATCH[key].test(h));
      if (idx >= 0) colIdx[key] = idx;
    });
    if (colIdx.n === undefined) return []; // без номера юнита сопоставить с существующими данными нельзя

    return rows.slice(1).map(r => {
      const unit = { n: (r[colIdx.n] || '').trim() };
      if (!unit.n) return null;
      if (colIdx.t !== undefined && r[colIdx.t]) unit.t = r[colIdx.t].trim();
      if (colIdx.s !== undefined && r[colIdx.s]) {
        const s = parseFloat(String(r[colIdx.s]).replace(',', '.').replace(/[^\d.]/g, ''));
        if (!isNaN(s)) unit.s = s;
      }
      if (colIdx.c !== undefined && r[colIdx.c]) {
        const c = parseInt(String(r[colIdx.c]).replace(/[^\d]/g, ''), 10);
        if (!isNaN(c)) unit.c = c;
      }
      if (colIdx.st !== undefined && r[colIdx.st]) {
        const st = normalizeStatus(r[colIdx.st]);
        if (st) unit.st = st;
      }
      return unit;
    }).filter(Boolean);
  }

  fetch(BSO_SHEET_CSV_URL, { cache: 'no-store' })
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
    .then(text => {
      const units = rowsToUnits(parseCSV(text));
      if (!units.length) { console.warn('[units-live] таблица прочитана, но 0 распознанных строк — проверить заголовки колонок'); return; }
      if (typeof window.__bsoRefreshUnits === 'function') window.__bsoRefreshUnits(units);
      if (typeof window.__bsoRefreshMapUnits === 'function') window.__bsoRefreshMapUnits(units);
      console.log('[units-live] обновлено юнитов из живой таблицы:', units.length);
    })
    .catch(err => console.warn('[units-live] не удалось подгрузить живые данные, остаёмся на статичных:', err.message));
})();
