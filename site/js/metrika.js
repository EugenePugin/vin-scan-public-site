(function () {
  const counterId = 113576256;
  const tagUrl = `https://mc.yandex.ru/metrika/tag.js?id=${counterId}`;
  const STORAGE_KEY = 'cookie_accepted';

  window.ym = window.ym || function () {
    (window.ym.a = window.ym.a || []).push(arguments);
  };
  window.ym.l = 1 * new Date();

  let started = false;

  const start = () => {
    if (started) return;
    started = true;

    if (!document.querySelector(`script[src="${tagUrl}"]`)) {
      const script = document.createElement('script');
      script.async = true;
      script.src = tagUrl;
      document.head.appendChild(script);
    }

    window.ym(counterId, 'init', {
      ssr: true,
      webvisor: true,
      clickmap: true,
      ecommerce: 'dataLayer',
      referrer: document.referrer,
      url: location.href,
      accurateTrackBounce: true,
      trackLinks: true,
    });
  };

  // Счётчик не должен конкурировать с первым экраном
  const whenIdle = (fn) => {
    const run = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(fn, { timeout: 2500 });
      } else {
        setTimeout(fn, 200);
      }
    };

    if (document.readyState === 'complete') run();
    else window.addEventListener('load', run, { once: true });
  };

  const accepted = () => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) {
      return false;
    }
  };

  if (accepted()) {
    whenIdle(start);
  } else {
    document.addEventListener('cookie-accepted', () => whenIdle(start), { once: true });
  }
})();
