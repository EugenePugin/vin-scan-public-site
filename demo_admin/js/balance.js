(() => {
  const $ = (s, r = document) => r.querySelector(s);

  // Быстрые суммы пополнения
  const amount = $('#topup-amount');
  const chips = document.querySelectorAll('.bal-chip');
  chips.forEach((chip) => {
    chip.setAttribute('aria-pressed', 'false');
    chip.addEventListener('click', () => {
      amount.value = chip.dataset.amount;
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      amount.focus();
    });
  });
  amount?.addEventListener('input', () => {
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.amount === amount.value)));
  });

  // Автоплатёж: включение и отключение полей
  const sw = $('#ap-enabled');
  const fields = $('#ap-fields');
  const state = $('#ap-state');
  const syncAutopay = () => {
    fields.disabled = !sw.checked;
    state.textContent = sw.checked ? 'включён' : 'выключен';
  };
  sw?.addEventListener('change', syncAutopay);
  syncAutopay();

  // Копирование партнёрской ссылки
  const copyBtn = $('#ref-copy');
  const link = $('#ref-link');
  const status = $('#ref-status');
  copyBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(link.value);
    } catch {
      link.select();
      document.execCommand('copy');
    }
    status.textContent = 'Ссылка скопирована';
    setTimeout(() => { status.textContent = ''; }, 2500);
  });
})();
