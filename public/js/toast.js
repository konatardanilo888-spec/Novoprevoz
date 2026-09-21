'use strict';

/** Jednostavan sistem toast notifikacija (bez eksternih biblioteka). */
const Toast = (() => {
  let container = null;

  function ensureContainer() {
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('role', 'status');
      document.body.appendChild(container);
    }
    return container;
  }

  function show(message, type = 'info', duration = 4200) {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = message;
    ensureContainer().appendChild(el);

    const remove = () => {
      el.classList.add('is-leaving');
      setTimeout(() => el.remove(), 220);
    };
    setTimeout(remove, duration);
    el.addEventListener('click', remove);
    return el;
  }

  return {
    success: (msg) => show(msg, 'success'),
    error: (msg) => show(msg, 'error'),
    warning: (msg) => show(msg, 'warning'),
    info: (msg) => show(msg, 'info'),
  };
})();
