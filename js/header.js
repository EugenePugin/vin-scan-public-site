// Добавляет шапке класс is-stuck, когда она прилипла к верху экрана
(() => {
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
})();
