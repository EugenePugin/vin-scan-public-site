(function () {
  var list = document.getElementById('dlg-list');
  var items = Array.prototype.slice.call(list.children);
  var q = document.getElementById('q');
  var fc = document.getElementById('f-client');
  var fo = document.getElementById('f-out');
  var fp = document.getElementById('f-period');
  var sort = document.getElementById('sort');
  var count = document.getElementById('count');
  var nores = document.getElementById('nores');
  var chips = document.querySelectorAll('.chip');
  var status = '';

  function apply() {
    var term = q.value.trim().toLowerCase();
    var days = fp.value === '' ? null : +fp.value;
    var shown = 0;
    items.forEach(function (li) {
      var d = li.dataset;
      var ok = (!status || d.status === status) &&
               (!fc.value || d.client === fc.value) &&
               (!fo.value || d.outcome === fo.value) &&
               (days === null || +d.days <= days) &&
               (!term || d.text.indexOf(term) !== -1);
      li.hidden = !ok;
      if (ok) shown++;
    });
    count.textContent = shown;
    nores.hidden = shown !== 0;
    list.hidden = shown === 0;
  }

  function order() {
    var k = sort.value;
    items.sort(function (a, b) {
      if (k === 'dur') return (+b.dataset.dur) - (+a.dataset.dur);
      var r = a.dataset.ts < b.dataset.ts ? -1 : 1;
      return k === 'old' ? r : -r;
    });
    items.forEach(function (li) { list.appendChild(li); });
  }

  function reset() {
    q.value = ''; fc.value = ''; fo.value = ''; fp.value = ''; status = ''; sort.value = 'new';
    chips.forEach(function (c) { c.setAttribute('aria-pressed', c.dataset.status === ''); });
    order(); apply();
  }

  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      status = c.dataset.status;
      chips.forEach(function (x) { x.setAttribute('aria-pressed', x === c); });
      apply();
    });
  });
  [fc, fo, fp].forEach(function (el) { el.addEventListener('change', apply); });
  q.addEventListener('input', apply);
  sort.addEventListener('change', function () { order(); apply(); });
  document.getElementById('reset').addEventListener('click', reset);
  document.getElementById('reset2').addEventListener('click', reset);

  // Раскрытие переписки
  list.addEventListener('click', function (e) {
    var b = e.target.closest('.dlg__toggle');
    if (!b) return;
    var panel = document.getElementById(b.getAttribute('aria-controls'));
    var open = panel.hidden;
    panel.hidden = !open;
    b.setAttribute('aria-expanded', open);
    b.textContent = open ? 'Скрыть переписку' : 'Показать переписку';
  });

  // Ссылка со страницы «Клиенты»: ?client=ID
  var pre = new URLSearchParams(location.search).get('client');
  if (pre) fc.value = pre;
  apply();
})();
