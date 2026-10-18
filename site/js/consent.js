(() => {
  const STORAGE_KEY = 'cookie_accepted';
  const card = document.getElementById('cookie-card');
  const button = card ? card.querySelector('[data-cookie-accept]') : null;
  if (!card || !button) return;

  const accepted = () => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) {
      return false;
    }
  };

  if (accepted()) return;

  card.hidden = false;

  button.addEventListener('click', () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch (e) {
      // Хранилище недоступно: плашку всё равно закрываем, согласие действует до перезагрузки
    }
    card.hidden = true;
    button.blur();
    document.dispatchEvent(new CustomEvent('cookie-accepted'));
  });
})();
