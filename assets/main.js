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
