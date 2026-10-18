// Один открытый вопрос: клик по заголовку закрывает предыдущий и плавно раскрывает новый
(() => {
  const items = Array.from(document.querySelectorAll('.faq .faq__item'));
  if (!items.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const DURATION = 280;
  const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';
  const animations = new WeakMap();
  const opened = new WeakMap();
  let active = items.find((item) => item.open) || null;

  items.forEach((item) => {
    opened.set(item, item.open);
    item.classList.toggle('is-open', item.open);
  });

  const panelOf = (item) => item.querySelector('.faq__panel');

  const reset = (item) => {
    const panel = panelOf(item);
    if (!panel) return;
    panel.style.height = '';
    panel.style.overflow = '';
  };

  const stop = (item) => {
    const animation = animations.get(item);
    if (animation) {
      animation.cancel();
      animations.delete(item);
    }
    reset(item);
  };

  // Стартуем с текущей высоты, чтобы быстрые клики не дёргали панель
  const animate = (item, shouldOpen) => {
    const panel = panelOf(item);
    if (!panel) return;

    const from = item.open ? panel.getBoundingClientRect().height : 0;
    stop(item);
    opened.set(item, shouldOpen);
    item.classList.toggle('is-open', shouldOpen);

    if (shouldOpen) item.open = true;

    if (reduced.matches) {
      item.open = shouldOpen;
      return;
    }

    const to = shouldOpen ? panel.scrollHeight : 0;
    panel.style.overflow = 'hidden';

    const animation = panel.animate(
      [{ height: from + 'px' }, { height: to + 'px' }],
      { duration: DURATION, easing: EASING },
    );

    animations.set(item, animation);
    animation.onfinish = () => {
      animations.delete(item);
      if (!shouldOpen) item.open = false;
      reset(item);
    };
  };

  items.forEach((item) => {
    const summary = item.querySelector('.faq__q');
    if (!summary) return;

    summary.addEventListener('click', (event) => {
      event.preventDefault();

      if (opened.get(item)) {
        if (active === item) active = null;
        animate(item, false);
        return;
      }

      if (active && active !== item) animate(active, false);
      active = item;
      animate(item, true);
    });
  });
})();
