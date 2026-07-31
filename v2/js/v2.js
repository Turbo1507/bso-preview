/* BSO v2 — аккордеон FAQ.
   Поведение как в макете «бсо2»: открыт всегда ровно один пункт, клик по
   открытому его закрывает. Высота анимируется через grid-template-rows 0fr→1fr
   (см. css/v2.css) — max-height-хак не нужен, ответы разной длины не «дёргаются».
   Скрипт грузится ПОСЛЕ ../js/main.js, ничего из него не переопределяет. */
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
