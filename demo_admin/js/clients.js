(function () {
  var tbody = document.getElementById('tbody');
  var rows = Array.prototype.slice.call(tbody.rows);
  var q = document.getElementById('q');
  var fo = document.getElementById('f-orders');
  var sort = document.getElementById('sort');
  var chips = document.querySelectorAll('.chip');
  var nores = document.getElementById('nores');
  var tableCard = document.getElementById('tbl').parentNode.parentNode;
  var checkAll = document.getElementById('check-all');
  var bulk = document.getElementById('bulk');
  var ruleN = document.getElementById('rule-n');
  var dlg = document.getElementById('confirm');
  var status = '';
  var pending = null;

  var BADGES = {
    blocked: '<span class="badge badge--blocked">Заблокирован</span>',
    risk: '<span class="badge badge--warn">Зона риска</span>',
    active: '<span class="badge badge--ok">Активен</span>'
  };
  var BTN_BLOCK = '<button class="btn btn--danger-outline btn--sm" type="button" data-act="block"><svg class="icon" aria-hidden="true"><use href="#i-block"/></svg>Заблокировать</button>';
  var BTN_UNBLOCK = '<button class="btn btn--outline btn--sm" type="button" data-act="unblock"><svg class="icon" aria-hidden="true"><use href="#i-unlock"/></svg>Разблокировать</button>';

  function num(tr, k) { return +tr.dataset[k]; }
  function name(tr) { return tr.querySelector('.cl__name').textContent; }
  function set(id, v) { document.getElementById(id).textContent = v; }

  // Статус: заблокирован / зона риска (нет заказов и от 50 запросов) / активен
  function setState(tr, blocked) {
    var st = blocked ? 'blocked' : (num(tr, 'orders') === 0 && num(tr, 'req') >= 50 ? 'risk' : 'active');
    tr.dataset.status = st;
    tr.classList.toggle('row-blocked', blocked);
    tr.querySelector('.cell-status').innerHTML = BADGES[st];
    tr.querySelector('.row-actions').innerHTML = blocked ? BTN_UNBLOCK : BTN_BLOCK;
  }

  function counts() {
    var c = { active: 0, risk: 0, blocked: 0 };
    rows.forEach(function (tr) { c[tr.dataset.status]++; });
    set('c-all', rows.length); set('c-active', c.active); set('c-risk', c.risk); set('c-blocked', c.blocked);
    set('k-all', rows.length); set('k-active', c.active + c.risk); set('k-risk', c.risk); set('k-blocked', c.blocked);
  }

  function apply() {
    var term = q.value.trim().toLowerCase();
    var shown = 0;
    rows.forEach(function (tr) {
      var o = num(tr, 'orders');
      var ok = (!status || tr.dataset.status === status) &&
              (!fo.value || (fo.value === 'with' ? o > 0 : o === 0)) &&
              (!term || (tr.dataset.name + ' ' + tr.dataset.kind).indexOf(term) !== -1);
      tr.hidden = !ok;
      if (ok) shown++;
    });
    set('count', shown);
    nores.hidden = shown !== 0;
    tableCard.hidden = shown === 0;
    syncBulk();
  }

  function order() {
    var k = sort.value;
    rows.sort(function (a, b) {
      if (k === 'name') return a.dataset.name < b.dataset.name ? -1 : 1;
      if (k === 'orders') return num(b, 'orders') - num(a, 'orders');
      if (k === 'conv') return num(b, 'conv') - num(a, 'conv');
      if (k === 'waste') return waste(b) - waste(a);
      return num(b, 'req') - num(a, 'req');
    });
    rows.forEach(function (tr) { tbody.appendChild(tr); });
  }
  function waste(tr) { return num(tr, 'orders') === 0 ? num(tr, 'req') : 0; }

  function selected() {
    return rows.filter(function (tr) { return !tr.hidden && tr.querySelector('.cl-check').checked; });
  }
  function syncBulk() {
    var n = selected().length;
    set('bulk-n', n);
    bulk.hidden = n === 0;
    var vis = rows.filter(function (tr) { return !tr.hidden; });
    checkAll.checked = vis.length > 0 && n === vis.length;
  }

  // Правило автоблокировки
  function ruleTargets() {
    var min = Math.max(1, +ruleN.value || 1);
    return rows.filter(function (tr) {
      return tr.dataset.status !== 'blocked' && num(tr, 'orders') === 0 && num(tr, 'req') >= min;
    });
  }
  function ruleView() {
    var t = ruleTargets();
    set('rule-count', t.length);
    set('rule-names', t.length ? ': ' + t.map(name).join(', ') : '');
    document.getElementById('rule-apply').disabled = t.length === 0;
  }

  function ask(title, text, okLabel, fn) {
    pending = fn;
    set('m-title', title); set('m-text', text); set('m-ok', okLabel);
    if (dlg.showModal) dlg.showModal(); else if (window.confirm(text)) done('ok');
  }
  function done(v) { if (v === 'ok' && pending) pending(); pending = null; }
  dlg.addEventListener('close', function () { done(dlg.returnValue); });

  function change(list, blocked) {
    list.forEach(function (tr) { setState(tr, blocked); tr.querySelector('.cl-check').checked = false; });
    counts(); ruleView(); apply();
  }

  tbody.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]');
    if (!b) return;
    var tr = b.closest('tr'), blocked = b.dataset.act === 'block';
    ask(blocked ? 'Заблокировать клиента?' : 'Разблокировать клиента?',
        blocked ? name(tr) + ' потеряет доступ к чату. Это можно отменить в любой момент.'
                : name(tr) + ' снова сможет пользоваться чатом.',
        blocked ? 'Заблокировать' : 'Разблокировать',
        function () { change([tr], blocked); });
  });
  tbody.addEventListener('change', syncBulk);
  checkAll.addEventListener('change', function () {
    rows.forEach(function (tr) { if (!tr.hidden) tr.querySelector('.cl-check').checked = checkAll.checked; });
    syncBulk();
  });

  function bulkDo(blocked) {
    var sel = selected();
    ask(blocked ? 'Заблокировать выбранных?' : 'Разблокировать выбранных?',
        'Клиентов: ' + sel.length + '. ' + (blocked ? 'Доступ к чату будет закрыт.' : 'Доступ к чату будет открыт.'),
        blocked ? 'Заблокировать' : 'Разблокировать',
        function () { change(sel, blocked); });
  }
  document.getElementById('bulk-block').addEventListener('click', function () { bulkDo(true); });
  document.getElementById('bulk-unblock').addEventListener('click', function () { bulkDo(false); });

  document.getElementById('rule-apply').addEventListener('click', function () {
    var t = ruleTargets();
    if (!t.length) return;
    ask('Применить правило?', 'Будет заблокировано клиентов: ' + t.length + ' (' + t.map(name).join(', ') + ').',
        'Заблокировать', function () { change(t, true); });
  });
  ruleN.addEventListener('input', ruleView);

  var sw = document.getElementById('auto-switch');
  sw.addEventListener('click', function () {
    sw.setAttribute('aria-checked', sw.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
  });

  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      status = c.dataset.status;
      chips.forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
      apply();
    });
  });
  q.addEventListener('input', apply);
  fo.addEventListener('change', apply);
  sort.addEventListener('change', function () { order(); apply(); });

  function reset() {
    q.value = ''; fo.value = ''; sort.value = 'req'; status = '';
    chips.forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.status === '' ? 'true' : 'false'); });
    order(); apply();
  }
  document.getElementById('reset').addEventListener('click', reset);
  document.getElementById('reset2').addEventListener('click', reset);

  order(); counts(); ruleView(); apply();
})();
