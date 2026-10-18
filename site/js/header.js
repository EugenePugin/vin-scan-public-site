// Добавляет шапке класс is-stuck, когда она прилипла к верху экрана
(() => {
  // Отключаем автоматическое восстановление скролла браузером при обновлении страницы
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  if (!window.location.hash) {
    window.scrollTo(0, 0);
  }

  const header = document.querySelector('.header');
  if (!header) return;

  let ticking = false;

  const update = () => {
    // Шапка прилипла, когда её верхний край дошёл до края окна
    header.classList.toggle('is-stuck', header.getBoundingClientRect().top <= 0.5);
    ticking = false;
  };

  // requestAnimationFrame: не чаще одного пересчёта за кадр
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  window.addEventListener('resize', update);
  update(); // если страница открылась уже прокрученной

  const burger = document.querySelector('.header__burger');
  const nav = document.getElementById('main-nav');

  if (!burger || !nav) return;

  const closeMobileNav = () => {
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
    nav.classList.remove('is-open');
  };

  burger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!isOpen));
    burger.setAttribute('aria-label', isOpen ? 'Открыть меню' : 'Закрыть меню');
    nav.classList.toggle('is-open', !isOpen);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.header')) {
      closeMobileNav();
    }
  });

  nav.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', () => closeMobileNav());
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !nav.classList.contains('is-open')) return;
    closeMobileNav();
    burger.focus();
  });
})();
