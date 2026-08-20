# -*- coding: utf-8 -*-
"""Кэш-баст для v2. GitHub Pages отдаёт Cache-Control: max-age=600, а ссылки
на css/js стояли без версии — после деплоя браузер до 10 минут подтягивал
старые файлы к новой разметке. Тот же приём уже применён на unitdeveloper.com.

Версию бампить при каждом деплое (см. v2/README.md)."""
import io, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')
V = "20260820a"
# путь берём от самого скрипта: раньше здесь был захардкожен windows-путь
# машины, где скрипт писался, — с мака он не работал вообще
BASE = os.path.dirname(os.path.abspath(__file__))

TARGETS = {
    'index.html': ['css/styles.css', 'css/v2.css', 'js/i18n.js',
                   'js/v2-i18n.js', 'js/main.js', 'js/v2.js'],
    'consent.html': ['css/styles.css', 'css/v2.css', 'js/legal.js'],
    'legal-info.html': ['css/styles.css', 'css/v2.css', 'js/legal.js'],
}

for fname, assets in TARGETS.items():
    p = os.path.join(BASE, fname)
    s = io.open(p, encoding='utf-8').read()
    n = 0
    for a in assets:
        # снимаем прежнюю версию, если была, и ставим текущую
        s, k = re.subn(r'(["\'])' + re.escape(a) + r'(\?v=[^"\']*)?\1',
                       lambda m: m.group(1) + a + '?v=' + V + m.group(1), s)
        assert k >= 1, (fname, a)
        n += k
    io.open(p, 'w', encoding='utf-8').write(s)
    print(f'{fname}: проставлено ссылок — {n}')
