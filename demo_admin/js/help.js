(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ===== Настройки ===== */
  // DEMO: пока нет сервера, заявки лежат в localStorage и подставляются тестовые.
  // Когда появится API, поставьте false и замените load()/save() на запросы.
  const DEMO = true;
  const KEY = 'vinscan.help.tickets.v1';
  const SUPPORT = 'Служба поддержки';
  const MAX_FILES = 5;
  const MAX_SIZE = 10 * 1024 * 1024;
  const SCHEDULE = { week: [9, 19], weekend: [10, 18] }; // МСК, часы

  const STATUS = { new: 'Новая', work: 'В работе', pause: 'Пауза', done: 'Завершена' };
  const NOTES = {
    new: 'Заявка принята. Мы ответим в рабочее время.',
    work: 'Заявка в работе. Ответ появится в комментариях.',
    pause: 'Мы ответили на заявку. Если нужны уточнения, добавьте комментарий, и заявка вернётся в работу.',
    done: 'Заявка завершена. Если проблема осталась, добавьте комментарий, и мы откроем заявку заново.',
  };

  /* ===== Утилиты ===== */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  const MSK = 'Europe/Moscow';
  const dtf = new Intl.DateTimeFormat('ru-RU', { timeZone: MSK, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const df = new Intl.DateTimeFormat('ru-RU', { timeZone: MSK, day: '2-digit', month: '2-digit', year: 'numeric' });
  const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: MSK });
  const fmtDT = (iso) => dtf.format(new Date(iso));
  const fmtD = (iso) => df.format(new Date(iso));

  const live = (msg) => {
    const el = $('#hp-live');
    el.textContent = '';
    setTimeout(() => { el.textContent = msg; }, 50);
  };

  /* ===== Безопасное форматирование текста =====
     Сначала экранируем HTML, потом применяем свою простую разметку. */
  const inline = (t) => t
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');

  const renderText = (raw) => esc(raw || '').split('```').map((part, i) => {
    if (i % 2) return `<pre><code>${part.replace(/^\n/, '').replace(/\n$/, '')}</code></pre>`;
    let html = '';
    let quote = [];
    const flush = () => {
      if (quote.length) { html += `<blockquote>${quote.join('<br>')}</blockquote>`; quote = []; }
    };
    part.split('\n').forEach((line) => {
      if (/^&gt;\s?/.test(line)) quote.push(inline(line.replace(/^&gt;\s?/, '')));
      else { flush(); html += `${inline(line)}<br>`; }
    });
    flush();
    return html.replace(/(<br>)+$/, '').replace(/^(<br>)+/, '');
  }).join('');

  /* ===== Данные ===== */
  const seed = () => [
    {
      id: 1038, title: 'Как подключить виджет на сайт', status: 'done', assignee: SUPPORT, rating: null,
      body: 'Добрый день! Не могу разобраться, куда вставить код виджета.',
      files: [], created: '2026-10-12T07:15:00Z', updated: '2026-10-12T09:30:00Z',
      comments: [
        { who: 'staff', name: SUPPORT, at: '2026-10-12T08:02:00Z', text: 'Здравствуйте! Вставьте код перед закрывающим тегом </body>. Инструкция есть в разделе «Управление веб-виджетами».', files: [] },
        { who: 'client', at: '2026-10-12T09:30:00Z', text: 'Спасибо, вопрос решён.', files: [] },
      ],
    },
    {
      id: 1041, title: 'Не приходят уведомления о новых диалогах', status: 'pause', assignee: SUPPORT, rating: null,
      body: 'С понедельника в панели не появляются новые диалоги из виджета на сайте.',
      files: ['screenshot.png'], created: '2026-10-17T07:20:00Z', updated: '2026-10-17T09:05:00Z',
      comments: [
        { who: 'staff', name: SUPPORT, at: '2026-10-17T09:05:00Z', text: 'Мы проверили настройки: виджет работает. Уточните, пожалуйста, адрес сайта, на котором он установлен.', files: [] },
      ],
    },
    {
      id: 1043, title: 'Ошибка при оплате картой', status: 'work', assignee: SUPPORT, rating: null,
      body: 'При пополнении баланса картой страница возвращает ошибку. Сумма 3000 ₽.',
      files: [], created: '2026-10-19T11:40:00Z', updated: '2026-10-19T12:10:00Z', comments: [],
    },
  ];

  const load = () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* хранилище недоступно */ }
    return DEMO ? seed() : [];
  };
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(tickets)); } catch { /* ignore */ }
  };

  let tickets = load();
  save();
  const byId = (id) => tickets.find((t) => t.id === id);

  /* ===== График работы ===== */
  const isOpen = () => {
    const d = new Date(Date.now() + 3 * 36e5); // МСК = UTC+3
    const day = d.getUTCDay();
    const hours = d.getUTCHours() + d.getUTCMinutes() / 60;
    const [from, to] = day === 0 || day === 6 ? SCHEDULE.weekend : SCHEDULE.week;
    return hours >= from && hours < to;
  };

  const paintHours = () => {
    const open = isOpen();
    $('#hp-open').classList.toggle('is-open', open);
    $('#hp-open-text').textContent = open ? 'Сейчас мы на связи' : 'Сейчас мы не работаем';
    $('#hp-on').hidden = !open;
    $('#hp-off').hidden = open;
  };

  /* ===== Редактор: кнопки форматирования ===== */
  const WRAPS = { b: ['**', '**'], i: ['*', '*'], u: ['__', '__'], s: ['~~', '~~'], code: ['\n```\n', '\n```\n'] };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-fmt]');
    if (!btn) return;
    const ta = btn.closest('[data-editor]').querySelector('textarea');
    const { selectionStart: a, selectionEnd: b, value } = ta;
    const sel = value.slice(a, b);
    let text;
    if (btn.dataset.fmt === 'quote') {
      text = (sel || 'Цитата').split('\n').map((l) => `> ${l}`).join('\n');
    } else {
      const [l, r] = WRAPS[btn.dataset.fmt];
      text = l + (sel || 'текст') + r;
    }
    ta.setRangeText(text, a, b, 'end');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.focus();
  });

  /* ===== Выбор файлов ===== */
  const filePicker = (input, list, errEl) => {
    const paint = () => {
      const files = [...input.files];
      list.innerHTML = files.map((f) => (
        `<li><svg class="icon" aria-hidden="true"><use href="#i-clip"/></svg>${esc(f.name)} <span>${(f.size / 1048576).toFixed(1)} МБ</span></li>`
      )).join('');
      list.hidden = !files.length;
    };
    input.addEventListener('change', () => {
      const files = [...input.files];
      let err = '';
      if (files.length > MAX_FILES) err = `Можно приложить не больше ${MAX_FILES} файлов.`;
      else if (files.some((f) => f.size > MAX_SIZE)) err = 'Размер каждого файла не больше 10 МБ.';
      if (err) input.value = '';
      errEl.textContent = err;
      paint();
    });
    return {
      names: () => [...input.files].map((f) => f.name),
      reset: () => { input.value = ''; errEl.textContent = ''; paint(); },
    };
  };

  const createFiles = filePicker($('#c-files'), $('#c-files-list'), $('#c-files-err'));
  const replyFiles = filePicker($('#r-files'), $('#r-files-list'), $('#r-files-err'));

  /* ===== Навигация между видами ===== */
  const viewList = $('#view-list');
  const viewTicket = $('#view-ticket');
  let firstRoute = true;
  let freshId = null;
  let currentId = null;

  const setCrumbs = (items) => {
    $('#hp-crumbs').innerHTML = `<ol>${items.map((it, i) => (
      i === items.length - 1
        ? `<li><span aria-current="page">${esc(it.text)}</span></li>`
        : `<li><a href="${it.href}">${esc(it.text)}</a></li>`
    )).join('')}</ol>`;
  };

  const route = () => {
    const m = /^#ticket-(\d+)$/.exec(location.hash);
    const t = m && byId(Number(m[1]));
    if (t) showTicket(t); else showList();
    if (!firstRoute) $('#hp-title').focus();
    firstRoute = false;
  };

  /* ===== Список ===== */
  const statusBadge = (s) => `<span class="hp-badge hp-badge--${s}">${STATUS[s]}</span>`;

  const renderList = () => {
    const q = $('#f-q').value.trim().toLowerCase();
    const date = $('#f-date').value;
    const status = $('#f-status').value;

    const rows = tickets
      .filter((t) => (!status || t.status === status)
        && (!date || dayKey.format(new Date(t.created)) === date)
        && (!q || `${t.id} ${t.title} ${t.body}`.toLowerCase().includes(q)))
      .sort((a, b) => new Date(b.created) - new Date(a.created));

    $('#hp-rows').innerHTML = rows.map((t) => `
      <tr${t.id === freshId ? ' class="is-fresh"' : ''}>
        <td data-label="№"><a class="hp-num" href="#ticket-${t.id}">#${t.id}</a></td>
        <td data-label="Дата"><time datetime="${t.created}">${fmtD(t.created)}</time></td>
        <td data-label="Статус">${statusBadge(t.status)}</td>
        <td data-label="Название"><a class="hp-title-link" href="#ticket-${t.id}">${esc(t.title)}</a></td>
        <td data-label="Исполнитель">${t.assignee ? esc(t.assignee) : '<span class="hp-muted">Не назначен</span>'}</td>
        <td data-label="Обновлено"><time datetime="${t.updated}">${fmtDT(t.updated)}</time></td>
      </tr>`).join('');

    $('#hp-table-wrap').hidden = !rows.length;
    $('#hp-empty').hidden = tickets.length > 0;
    $('#hp-noresult').hidden = !(tickets.length && !rows.length);
    $('#hp-count').textContent = tickets.length ? `Показано ${rows.length} из ${tickets.length}` : '';
    freshId = null;
  };

  const showList = () => {
    currentId = null;
    viewTicket.hidden = true;
    viewList.hidden = false;
    setCrumbs([{ text: 'Помощь', href: '#tickets' }, { text: 'Мои заявки' }]);
    document.title = 'Помощь — Vin-Scan';
    renderList();
  };

  /* ===== Заявка ===== */
  const filesHTML = (files) => (files && files.length
    ? `<ul class="hp-files">${files.map((n) => `<li><svg class="icon" aria-hidden="true"><use href="#i-clip"/></svg>${esc(n)}</li>`).join('')}</ul>`
    : '');

  const commentHTML = (c) => `
    <li class="hp-comment${c.who === 'client' ? ' hp-comment--me' : ''}">
      <div class="hp-comment__meta">
        <strong class="hp-comment__name">${c.who === 'client' ? 'Ваш комментарий' : esc(c.name || SUPPORT)}</strong>
        <time datetime="${c.at}">${fmtDT(c.at)}</time>
      </div>
      <div class="hp-comment__text">
        ${c.text ? `<div class="hp-text">${renderText(c.text)}</div>` : ''}
        ${filesHTML(c.files)}
      </div>
    </li>`;

  const paintRate = (t) => {
    const box = $('#i-rate');
    box.hidden = t.status !== 'done';
    if (box.hidden) return;
    box.innerHTML = t.rating
      ? '<p class="hp-hint">Спасибо за оценку.</p>'
      : `<button type="button" data-rate="up"><svg class="icon" aria-hidden="true"><use href="#i-thumb-up"/></svg>Решение понравилось</button>
         <button type="button" data-rate="down"><svg class="icon" aria-hidden="true"><use href="#i-thumb-down"/></svg>Решение не понравилось</button>`;
  };

  const paintTicket = (t) => {
    $('#t-num').textContent = `#${t.id}`;
    $('#t-title').textContent = t.title;
    $('#t-body').innerHTML = renderText(t.body) || '<span class="hp-muted">Без описания</span>';
    $('#t-files').innerHTML = filesHTML(t.files);
    $('#t-comments').innerHTML = t.comments.length
      ? t.comments.map(commentHTML).join('')
      : '<li class="hp-comment hp-comment--empty">Ответов пока нет. Мы ответим в рабочее время.</li>';

    $('#t-note').textContent = NOTES[t.status];
    $('#i-status').innerHTML = statusBadge(t.status);
    $('#i-assignee').textContent = t.assignee || 'Не назначен';
    $('#i-created').textContent = fmtDT(t.created);
    $('#i-updated').textContent = fmtDT(t.updated);
    $('#r-submit').textContent = t.status === 'done'
      ? 'Добавить комментарий и открыть заявку заново'
      : 'Добавить комментарий';
    paintRate(t);
  };

  const showTicket = (t) => {
    currentId = t.id;
    viewList.hidden = true;
    viewTicket.hidden = false;
    setCrumbs([
      { text: 'Помощь', href: '#tickets' },
      { text: 'Мои заявки', href: '#tickets' },
      { text: `#${t.id}` },
    ]);
    document.title = `Заявка #${t.id} — Помощь — Vin-Scan`;
    paintTicket(t);
  };

  // Оценка решения
  $('#i-rate').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-rate]');
    const t = byId(currentId);
    if (!btn || !t) return;
    t.rating = btn.dataset.rate;
    save();
    paintRate(t);
    live('Спасибо за оценку');
  });

  // Добавление комментария
  $('#reply-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const t = byId(currentId);
    const ta = $('#r-text');
    const text = ta.value.trim();
    const files = replyFiles.names();
    if (!t) return;
    if (!text && !files.length) {
      $('#r-err').textContent = 'Напишите комментарий или приложите файл.';
      ta.focus();
      return;
    }
    $('#r-err').textContent = '';

    const reopened = t.status === 'pause' || t.status === 'done';
    const now = new Date().toISOString();
    t.comments.push({ who: 'client', at: now, text, files });
    t.updated = now;
    if (reopened) t.status = 'work'; // после ответа клиента заявка снова в работе
    save();

    ta.value = '';
    replyFiles.reset();
    paintTicket(t);
    live(reopened ? 'Комментарий добавлен, заявка снова в работе' : 'Комментарий добавлен');
  });
  $('#r-text').addEventListener('input', () => { $('#r-err').textContent = ''; });

  /* ===== Окно создания заявки ===== */
  const dlg = $('#hp-dialog');
  const titleInput = $('#c-title');

  $$('[data-open-create]').forEach((b) => b.addEventListener('click', () => {
    paintHours();
    dlg.showModal();
    titleInput.focus();
  }));
  $$('[data-close]', dlg).forEach((b) => b.addEventListener('click', () => dlg.close()));
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

  titleInput.addEventListener('input', () => {
    titleInput.removeAttribute('aria-invalid');
    $('#c-title-err').textContent = '';
  });

  $('#create-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    if (!title) {
      titleInput.setAttribute('aria-invalid', 'true');
      $('#c-title-err').textContent = 'Укажите название заявки.';
      titleInput.focus();
      return;
    }

    const now = new Date().toISOString();
    const id = tickets.reduce((max, t) => Math.max(max, t.id), 1000) + 1;
    tickets.push({
      id, title,
      body: $('#c-body').value.trim(),
      status: 'new',          // сразу после отправки заявка «Новая»
      assignee: null,
      rating: null,
      files: createFiles.names(),
      created: now, updated: now,
      comments: [],
    });
    save();

    $('#create-form').reset();
    createFiles.reset();
    dlg.close();

    freshId = id;
    if (location.hash === '#tickets') route(); else location.hash = '#tickets';
    live(`Заявка №${id} создана, статус: Новая`);
  });

  /* ===== Фильтры ===== */
  const filter = $('#hp-filter');
  filter.addEventListener('submit', (e) => { e.preventDefault(); renderList(); });
  filter.addEventListener('input', renderList);
  filter.addEventListener('change', renderList);
  filter.addEventListener('reset', () => setTimeout(renderList));

  /* ===== Старт ===== */
  paintHours();
  setInterval(paintHours, 60000);
  window.addEventListener('hashchange', route);
  route();
})();