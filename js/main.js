document.addEventListener('DOMContentLoaded', () => {
  const burger = document.querySelector('.header__burger');
  const nav = document.getElementById('main-nav');
  const dropdownButtons = document.querySelectorAll('.nav__item--dropdown > .nav__link');

  // Закрыть все выпадающие меню, кроме указанного
  const closeDropdowns = (except = null) => {
    dropdownButtons.forEach((btn) => {
      if (btn === except) return;
      btn.setAttribute('aria-expanded', 'false');
      btn.parentElement.classList.remove('is-open');
    });
  };

  // Открытие/закрытие выпадающих меню по клику (тач и клавиатура)
  dropdownButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      closeDropdowns(btn);
      btn.setAttribute('aria-expanded', String(!isOpen));
      btn.parentElement.classList.toggle('is-open', !isOpen);
    });
  });

  // Мобильное меню
  burger.addEventListener('click', () => {
    const isOpen = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!isOpen));
    burger.setAttribute('aria-label', isOpen ? 'Открыть меню' : 'Закрыть меню');
    nav.classList.toggle('is-open', !isOpen);
  });

  // Клик вне меню закрывает выпадашки
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav__item--dropdown')) closeDropdowns();
  });

  // Escape закрывает меню и возвращает фокус на кнопку
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const opened = document.querySelector('.nav__item--dropdown.is-open > .nav__link');
    closeDropdowns();
    if (opened) opened.focus();
  });
});
