// Форма заявки пилота.
// Если в data-endpoint указан URL, заявка уходит POST-запросом (JSON).
// Если пусто, открывается письмо на data-mailto с заполненными полями (работает без бэкенда).
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('pilot-form');
  if (!form) return;

  const status = form.querySelector('.form__status');
  const btn = form.querySelector('button[type="submit"]');
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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    form.classList.add('was-validated');

    if (!form.checkValidity()) {
      form.reportValidity();
      say('Заполните обязательные поля и подтвердите согласие.', false);
      return;
    }

    const data = Object.fromEntries(new FormData(form));
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
        say('Спасибо! Ответим в течение одного рабочего дня.', true);
      } else {
        const body = Object.keys(LABELS).map((k) => LABELS[k] + ': ' + (data[k] || '')).join('\n');
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
