(function () {
  const counterId = 113576256;
  const tagUrl = `https://mc.yandex.ru/metrika/tag.js?id=${counterId}`;

  window.ym = window.ym || function () {
    (window.ym.a = window.ym.a || []).push(arguments);
  };
  window.ym.l = 1 * new Date();

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
})();
