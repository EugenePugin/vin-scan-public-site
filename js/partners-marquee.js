(() => {
  const list = document.querySelector('.partners');
  if (!list) return;

  const SPEED = 40; // пикселей в секунду
  const mq = window.matchMedia('(min-width: 1181px)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let active = false, raf = 0, last = 0, pos = 0, L = 0;
  let hovered = false, focused = false, dragging = false, touching = false, visible = true;
  let clones = [], cleanups = [], io = null;

  const paused = () =>
    hovered || focused || dragging || touching || !visible || reduceMotion.matches;

  const on = (el, ev, fn, opt) => {
    el.addEventListener(ev, fn, opt);
    cleanups.push(() => el.removeEventListener(ev, fn, opt));
  };

  function frame(t) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((t - last) / 1000, 0.1);
    last = t;

    // Бесшовная петля: держим позицию в средней части ленты
    let sl = list.scrollLeft;
    if (sl >= 2 * L) sl -= L;
    else if (sl <= 0) sl += L;
    if (sl !== list.scrollLeft) list.scrollLeft = sl;

    // Пауза или пользователь сам двигает ленту (колесо, тачпад, инерция)
    if (paused() || Math.abs(sl - pos) > 1.5) {
      pos = sl;
      return;
    }
    pos += SPEED * dt;
    list.scrollLeft = pos;
  }

  function start() {
    if (active) return;
    active = true;
    list.classList.add('is-marquee');

    const items = Array.from(list.children);
    const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
    const firstEl = items[0];
    const lastEl = items[items.length - 1];
    // Ширина одного набора карточек вместе с промежутком
    L = lastEl.offsetLeft + lastEl.offsetWidth + gap - firstEl.offsetLeft;

    // Нужно минимум 2 набора плюс запас на ширину видимой области
    const sets = 2 + Math.ceil(list.clientWidth / L);
    for (let s = 1; s < sets; s++) {
      items.forEach((li) => {
        const c = li.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        c.querySelector('a').tabIndex = -1;
        const img = c.querySelector('img');
        if (img) img.loading = 'eager';
        list.appendChild(c);
        clones.push(c);
      });
    }

    list.scrollLeft = L;
    pos = L;

    on(list, 'mouseenter', () => { hovered = true; });
    on(list, 'mouseleave', () => { hovered = false; });
    // Пауза по фокусу только при навигации с клавиатуры, не после клика мышью
    on(list, 'focusin', (e) => { focused = e.target.matches(':focus-visible'); });
    on(list, 'focusout', () => { focused = false; });
    on(list, 'touchstart', () => { touching = true; }, { passive: true });
    on(list, 'touchend', () => { touching = false; }, { passive: true });
    on(list, 'touchcancel', () => { touching = false; }, { passive: true });

    // Перетаскивание мышью
    let startX = 0, moved = 0;
    on(list, 'mousedown', (e) => {
      if (e.button !== 0) return;
      dragging = true;
      startX = e.clientX;
      moved = 0;
      list.classList.add('is-dragging');
    });
    on(window, 'mousemove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      startX = e.clientX;
      moved += Math.abs(dx);
      list.scrollLeft -= dx;
    });
    on(window, 'mouseup', () => {
      if (!dragging) return;
      dragging = false;
      list.classList.remove('is-dragging');
    });
    // После перетаскивания не открываем ссылку
    on(list, 'click', (e) => {
      if (moved > 5) { e.preventDefault(); e.stopPropagation(); }
      moved = 0;
    }, true);
    on(list, 'dragstart', (e) => e.preventDefault());

    // Не крутим ленту, пока она вне экрана
    io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    io.observe(list);

    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (!active) return;
    active = false;
    cancelAnimationFrame(raf);
    cleanups.forEach((fn) => fn());
    cleanups = [];
    if (io) { io.disconnect(); io = null; }
    clones.forEach((c) => c.remove());
    clones = [];
    hovered = focused = dragging = touching = false;
    list.classList.remove('is-marquee', 'is-dragging');
    list.scrollLeft = 0;
  }

  const sync = () => (mq.matches ? start() : stop());
  mq.addEventListener('change', sync);

  // При изменении ширины пересчитываем размеры наборов
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (active) { stop(); sync(); }
    }, 200);
  });

  sync();
})();
