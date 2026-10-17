// Форма заявки пилота.
// Если в data-endpoint указан URL, заявка уходит POST-запросом (JSON).
// Если пусто, открывается письмо на data-mailto с заполненными полями (работает без бэкенда).
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('pilot-form');
  if (!form) return;

  const status = form.querySelector('.form__status');
  const btn = form.querySelector('button[type="submit"]');
  const group = form.querySelector('.field--group');
  const channels = Array.from(form.querySelectorAll('input[name="channel"]'));

  // Блок «Другое»: чекбокс + поле для своего варианта
  const otherCheck = document.getElementById('channel-other');
  const otherWrap = document.getElementById('channel-other-wrap');
  const otherInput = document.getElementById('channel-other-text');

  const LABELS = {
    name: 'Имя',
    shop: 'Магазин или сервис',
    city: 'Город',
    contact: 'Телефон или Telegram',
    volume: 'Запросов на подбор в день',
    channel: 'Где общаются с клиентами'
  };

  const say = (msg, ok) => {
    status.textContent = msg;
    status.className = 'form__status ' + (ok ? 'is-ok' : 'is-error');
  };

  // Нужен хотя бы один канал: ошибку вешаем на первый чекбокс,
  // чтобы reportValidity показал подсказку и поставил фокус в группу.
  const syncChannels = () => {
    if (!channels.length) return;
    const any = channels.some((c) => c.checked);
    channels[0].setCustomValidity(any ? '' : 'Выберите хотя бы один вариант');
    if (group) {
      group.classList.toggle('is-invalid', !any && form.classList.contains('was-validated'));
    }
  };

  // «Другое»: показываем поле, делаем его обязательным, не пускаем пустую строку из пробелов.
  const syncOther = (focus = false) => {
    if (!otherCheck || !otherWrap || !otherInput) return;
    const on = otherCheck.checked;
    otherWrap.hidden = !on;
    otherInput.required = on;
    otherCheck.setAttribute('aria-expanded', String(on));
    if (on) {
      otherInput.setCustomValidity(otherInput.value.trim() ? '' : 'Опишите, где вы общаетесь с клиентами');
      if (focus) otherInput.focus();
    } else {
      otherInput.value = '';
      otherInput.setCustomValidity('');
    }
  };

  channels.forEach((c) => c.addEventListener('change', syncChannels));
  if (otherCheck && otherInput) {
    otherCheck.addEventListener('change', () => syncOther(true));
    otherInput.addEventListener('input', () => syncOther());
  }
  syncChannels();
  syncOther();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    form.classList.add('was-validated');
    syncChannels();
    syncOther();

    if (!form.checkValidity()) {
      form.reportValidity();
      say('Заполните обязательные поля и подтвердите согласие.', false);
      return;
    }

    const fd = new FormData(form);
    const data = Object.fromEntries(fd);
    // массив: ["Telegram", "Телефон", "Другое: Авито-чат"]
    data.channel = channels
      .filter((c) => c.checked)
      .map((c) => (c === otherCheck ? 'Другое: ' + otherInput.value.trim() : c.value));
    delete data.channel_other; // текст уже внутри data.channel
    delete data.consent;
    btn.disabled = true;

    try {
      if (form.dataset.endpoint) {
        const res = await fetch(form.dataset.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        form.classList.remove('was-validated');
        syncChannels();
        syncOther(); // reset не шлёт change, поэтому прячем поле вручную
        say('Спасибо! Ответим в течение одного рабочего дня.', true);
      } else {
        const body = Object.keys(LABELS)
          .map((k) => LABELS[k] + ': ' + (Array.isArray(data[k]) ? data[k].join(', ') : (data[k] || '')))
          .join('\n');
        window.location.href = 'mailto:' + form.dataset.mailto +
          '?subject=' + encodeURIComponent('Заявка на пилот Vin-Scan') +
          '&body=' + encodeURIComponent(body);
        say('Открыли письмо с вашими данными. Если почта не открылась, напишите на ' + form.dataset.mailto + '.', true);
      }
      if (window.ym) window.ym(113576256, 'reachGoal', 'pilot_form_submit');
    } catch (err) {
      say('Не удалось отправить заявку. Напишите нам на почту или в Telegram.', false);
    } finally {
      btn.disabled = false;
    }
  });
});
