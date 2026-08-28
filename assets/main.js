/* COMITY — navigation behaviour.
   Panels open on click, not hover: hover menus are a keyboard and touch
   liability and fire accidentally while reading. (Phase 04 §07)          */

(function () {
  'use strict';

  var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-panel]'));
  var panels  = Array.prototype.slice.call(document.querySelectorAll('.panel'));

  function closeAll(exceptId) {
    buttons.forEach(function (btn) {
      var id = btn.getAttribute('data-panel');
      if (id === exceptId) return;
      btn.setAttribute('aria-expanded', 'false');
    });
    panels.forEach(function (panel) {
      if (panel.id === exceptId) return;
      panel.removeAttribute('data-open');
    });
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-panel');
      var panel = document.getElementById(id);
      if (!panel) return;
      var isOpen = btn.getAttribute('aria-expanded') === 'true';
      closeAll(isOpen ? null : id);
      btn.setAttribute('aria-expanded', String(!isOpen));
      if (isOpen) { panel.removeAttribute('data-open'); }
      else { panel.setAttribute('data-open', ''); }
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var open = document.querySelector('[data-panel][aria-expanded="true"]');
    closeAll(null);
    if (open) open.focus();
  });

  document.addEventListener('click', function (e) {
    if (e.target.closest('.masthead')) return;
    closeAll(null);
  });

  /* Mobile menu */
  var toggle = document.querySelector('.nav-toggle');
  var list = document.querySelector('.nav-list');
  if (toggle && list) {
    toggle.addEventListener('click', function () {
      var isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isOpen));
      if (isOpen) { list.removeAttribute('data-open'); }
      else { list.setAttribute('data-open', ''); }
    });
  }
}());

/* Theme control. The stylesheet defines all three states already — bare :root
   for light, prefers-color-scheme for the unstamped default, and an explicit
   data-theme stamp that beats both. This only cycles the stamp.
   Order: Auto → Light → Dark. Auto removes the stamp and returns the page to
   the viewer's OS setting, which is the correct default and so comes first. */
(function () {
  'use strict';
  var btn = document.getElementById('theme-toggle');
  if (!btn) return;

  var root = document.documentElement;
  var label = btn.querySelector('[data-theme-label]');
  var isES = (document.documentElement.lang || 'en').indexOf('es') === 0;
  var NAMES = isES
    ? { auto: 'Auto', light: 'Claro', dark: 'Oscuro' }
    : { auto: 'Auto', light: 'Light', dark: 'Dark' };
  var ORDER = ['auto', 'light', 'dark'];

  function read() {
    try {
      var v = localStorage.getItem('cc-theme');
      return (v === 'light' || v === 'dark') ? v : 'auto';
    } catch (e) { return 'auto'; }
  }

  function apply(mode) {
    if (mode === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', mode);
    if (label) label.textContent = NAMES[mode];
    btn.setAttribute('aria-label',
      (isES ? 'Tema: ' : 'Theme: ') + NAMES[mode]);
    try {
      if (mode === 'auto') localStorage.removeItem('cc-theme');
      else localStorage.setItem('cc-theme', mode);
    } catch (e) { /* private mode — the choice just won't persist */ }
  }

  apply(read());

  btn.addEventListener('click', function () {
    apply(ORDER[(ORDER.indexOf(read()) + 1) % ORDER.length]);
  });
}());
