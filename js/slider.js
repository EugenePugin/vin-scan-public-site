// Слайдер с фото чата: стрелки, точки, свайп (scroll-snap), клавиатура, автопрокрутка с паузой
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-slider]').forEach(initSlider);
});

function initSlider(root) {
  const track = root.querySelector('[data-slider-track]');
  const slides = Array.from(track.children);
  const prevBtn = root.querySelector('[data-slider-prev]');
  const nextBtn = root.querySelector('[data-slider-next]');
  const dotsWrap = root.querySelector('[data-slider-dots]');
  const toggleBtn = root.querySelector('[data-slider-toggle]');

  const DELAY = 5000; // интервал автопрокрутки, мс
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (slides.length < 2) {
    root.classList.add('is-single');
    return;
  }

  let index = 0;
  let timer = null;
  let autoplay = !reduceMotion; // при «уменьшении движения» автопрокрутка выключена
  let hovered = false;
  let focused = false;

  // Подписи слайдов и точки навигации
  const dots = slides.map((slide, i) => {
    slide.setAttribute('aria-label', `${i + 1} из ${slides.length}`);

    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'chat-slider__dot';
    dot.setAttribute('aria-label', `Показать слайд ${i + 1} из ${slides.length}`);
    dot.addEventListener('click', () => { goTo(i); start(); });
    dotsWrap.appendChild(dot);
    return dot;
  });

  function setActive(i) {
    index = i;
    dots.forEach((dot, k) => dot.setAttribute('aria-current', k === i ? 'true' : 'false'));
  }

  function goTo(i) {
    const n = (i + slides.length) % slides.length; // по кругу
    track.scrollTo({ left: n * track.clientWidth, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  // Активная точка вычисляется по положению прокрутки (стрелки, свайп, тачпад)
  let ticking = false;
  track.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const i = Math.round(track.scrollLeft / track.clientWidth);
      const safe = Math.min(Math.max(i, 0), slides.length - 1);
      if (safe !== index) setActive(safe);
      ticking = false;
    });
  }, { passive: true });

  // Автопрокрутка
  function stop() {
    clearInterval(timer);
    timer = null;
  }
  function start() {
    stop();
    if (autoplay && !hovered && !focused && !document.hidden) {
      timer = setInterval(() => goTo(index + 1), DELAY);
    }
  }

  function renderToggle() {
    toggleBtn.classList.toggle('is-paused', !autoplay);
    toggleBtn.setAttribute('aria-label', autoplay ? 'Остановить автопрокрутку' : 'Включить автопрокрутку');
    // При ручном листании скринридер озвучивает смену слайда, при автопрокрутке нет
    track.setAttribute('aria-live', autoplay ? 'off' : 'polite');
  }

  prevBtn.addEventListener('click', () => { goTo(index - 1); start(); });
  nextBtn.addEventListener('click', () => { goTo(index + 1); start(); });

  toggleBtn.addEventListener('click', () => {
    autoplay = !autoplay;
    renderToggle();
    start();
  });

  // Клавиатура: стрелки, когда фокус на ленте
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(index - 1); start(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); start(); }
  });

  // Пауза при наведении, фокусе с клавиатуры и касании
  root.addEventListener('mouseenter', () => { hovered = true; stop(); });
  root.addEventListener('mouseleave', () => { hovered = false; start(); });
  root.addEventListener('focusin', (e) => {
    if (e.target.matches(':focus-visible')) { focused = true; stop(); }
  });
  root.addEventListener('focusout', (e) => {
    if (!root.contains(e.relatedTarget)) { focused = false; start(); }
  });
  track.addEventListener('touchstart', stop, { passive: true });
  track.addEventListener('touchend', start, { passive: true });
  track.addEventListener('touchcancel', start, { passive: true });


  // Не листаем во фоновой вкладке
  document.addEventListener('visibilitychange', start);

  // При повороте экрана или ресайзе возвращаем текущий слайд на место
  if ('ResizeObserver' in window) {
    let lastWidth = track.clientWidth;
    new ResizeObserver(() => {
      if (track.clientWidth === lastWidth) return;
      lastWidth = track.clientWidth;
      track.scrollTo({ left: index * track.clientWidth, behavior: 'auto' });
    }).observe(track);
  }
  
  setActive(0);
  renderToggle();
  start();
}
