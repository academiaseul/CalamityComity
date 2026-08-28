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

/* Day / night. Two states, nothing else.

   The stylesheet still supports three — bare :root, prefers-color-scheme,
   and an explicit data-theme stamp. On a first visit there is no stamp, so
   the page follows the reader's OS setting; the control simply reports which
   of the two the reader is actually looking at, and swaps it. */
(function () {
  'use strict';
  var btn = document.getElementById('theme-toggle');
  if (!btn) return;

  var root = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var isES = (root.lang || 'en').indexOf('es') === 0;
  var LABEL = isES
    ? { light: 'Cambiar a modo noche', dark: 'Cambiar a modo día' }
    : { light: 'Switch to night mode', dark: 'Switch to day mode' };

  function stored() {
    try {
      var v = localStorage.getItem('cc-theme');
      return (v === 'light' || v === 'dark') ? v : null;
    } catch (e) { return null; }
  }

  // What the reader is actually seeing right now.
  function effective() {
    return stored() || (mq && mq.matches ? 'dark' : 'light');
  }

  function paint(mode) {
    btn.setAttribute('data-mode', mode);
    btn.setAttribute('aria-label', LABEL[mode]);
    btn.setAttribute('title', LABEL[mode]);
  }

  function set(mode) {
    root.setAttribute('data-theme', mode);
    try { localStorage.setItem('cc-theme', mode); } catch (e) { /* private mode */ }
    paint(mode);
  }

  paint(effective());

  btn.addEventListener('click', function () {
    set(effective() === 'dark' ? 'light' : 'dark');
  });

  // Follow the OS while the reader has not chosen for themselves.
  if (mq && mq.addEventListener) {
    mq.addEventListener('change', function () { if (!stored()) paint(effective()); });
  }
}());
