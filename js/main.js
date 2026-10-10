document.addEventListener('DOMContentLoaded', () => {
  const burger = document.querySelector('.header__burger');
  const nav = document.getElementById('main-nav');
  const dropdownButtons = document.querySelectorAll('.nav__item--dropdown > .nav__link');

  if (!burger || !nav) return;

  // Закрыть все выпадающие меню, кроме указанного
  const closeDropdowns = (except = null) => {
    dropdownButtons.forEach((btn) => {
      if (btn === except) return;
      btn.setAttribute('aria-expanded', 'false');
      btn.parentElement.classList.remove('is-open');
    });
  };

  // Закрыть само мобильное меню
  const closeMobileNav = () => {
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
    nav.classList.remove('is-open');
    closeDropdowns();
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

  // Мобильное меню (бургер)
  burger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!isOpen));
    burger.setAttribute('aria-label', isOpen ? 'Открыть меню' : 'Закрыть меню');
    nav.classList.toggle('is-open', !isOpen);
    if (isOpen) closeDropdowns();
  });

  // Клик вне меню закрывает и дропдауны, и само мобильное меню
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav__item--dropdown')) {
      closeDropdowns();
    }
    if (!e.target.closest('.header')) {
      closeMobileNav();
    }
  });

  // Закрытие мобильного меню при клике на якорные ссылки внутри него
  nav.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', () => closeMobileNav());
  });

  // Escape закрывает и дропдауны, и мобильное бургер-меню
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const openedDropdown = document.querySelector('.nav__item--dropdown.is-open > .nav__link');
    closeDropdowns();
    if (openedDropdown) {
      openedDropdown.focus();
    } else if (nav.classList.contains('is-open')) {
      closeMobileNav();
      burger.focus();
    }
  });
});