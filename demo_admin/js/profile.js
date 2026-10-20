(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const MAX_PHONES = 5;

  // ===== Несколько телефонов =====
  const list = $('#pf-phones');
  const addBtn = $('#pf-phone-add');
  const phoneStatus = $('#pf-phone-status');

  const say = (text) => { phoneStatus.textContent = text; };

  // Нумерует поля, прячет «Удалить» у единственной строки, блокирует «Добавить» на лимите
  const refreshPhones = () => {
    const rows = list.querySelectorAll('.pf-phone');
    rows.forEach((row, i) => {
      const n = i + 1;
      const input = row.querySelector('input');
      const label = row.querySelector('label');
      const remove = row.querySelector('.pf-phone__remove');
      input.id = `pf-phone-${n}`;
      label.htmlFor = input.id;
      label.textContent = `Телефон ${n}`;
      remove.hidden = rows.length === 1;
      remove.setAttribute('aria-label', `Удалить телефон ${n}`);
    });
    addBtn.disabled = rows.length >= MAX_PHONES;
  };

  addBtn?.addEventListener('click', () => {
    if (list.children.length >= MAX_PHONES) return;
    const row = list.firstElementChild.cloneNode(true);
    row.querySelector('input').value = '';
    list.appendChild(row);
    refreshPhones();
    row.querySelector('input').focus();
    say(`Добавлено поле: телефон ${list.children.length}`);
  });

  list?.addEventListener('click', (e) => {
    const btn = e.target.closest('.pf-phone__remove');
    if (!btn) return;
    const row = btn.closest('.pf-phone');
    const prev = row.previousElementSibling || row.nextElementSibling;
    row.remove();
    refreshPhones();
    prev?.querySelector('input')?.focus();
    say('Телефон удалён');
  });

  // В телефоне оставляем только цифры, плюс, пробелы, скобки и дефис
  list?.addEventListener('input', (e) => {
    if (e.target.matches('input[type="tel"]')) {
      e.target.value = e.target.value.replace(/[^\d+\s()\-]/g, '');
    }
  });

  refreshPhones();

  // ===== Числовые реквизиты: только цифры =====
  document.querySelectorAll('[data-digits]').forEach((el) => {
    el.addEventListener('input', () => {
      el.value = el.value.replace(/\D/g, '');
    });
  });

  // ===== Фактический адрес совпадает с юридическим =====
  const same = $('#pf-same');
  const legal = $('#pf-legal');
  const actual = $('#pf-actual');

  same?.addEventListener('change', () => {
    actual.readOnly = same.checked;
    if (same.checked) actual.value = legal.value;
  });
  legal?.addEventListener('input', () => {
    if (same.checked) actual.value = legal.value;
  });

  // ===== Счётчик символов в «О себе» =====
  const about = $('#pf-about');
  const count = $('#pf-about-count');
  const syncCount = () => {
    count.textContent = `${about.value.length} / ${about.maxLength}`;
  };
  about?.addEventListener('input', syncCount);
  syncCount();
})();
