(function () {
  var body = document.body;

  // Боковая панель на узких экранах
  var burger = document.querySelector('.topbar__burger');
  var scrim = document.querySelector('.scrim');
  function setNav(open) {
    body.classList.toggle('is-nav-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  }
  burger.addEventListener('click', function () { setNav(!body.classList.contains('is-nav-open')); });
  scrim.addEventListener('click', function () { setNav(false); });

  // Выпадающее меню профиля
  var btn = document.querySelector('.user-menu__btn');
  var panel = document.getElementById('user-menu');
  function setMenu(open) { panel.hidden = !open; btn.setAttribute('aria-expanded', open); }
  btn.addEventListener('click', function () { setMenu(panel.hidden); });
  document.addEventListener('click', function (e) {
    if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!panel.hidden) { setMenu(false); btn.focus(); }
    setNav(false);
  });

  // Переключатели периода (визуальное состояние)
  document.querySelectorAll('.seg').forEach(function (g) {
    g.addEventListener('click', function (e) {
      var b = e.target.closest('.seg__btn');
      if (!b) return;
      g.querySelectorAll('.seg__btn').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
    });
  });
})();
