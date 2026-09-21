'use strict';

/**
 * Reusable modal za potvrdu akcije (npr. brisanje vožnje).
 * Upotreba: ConfirmModal.open({ title, message, confirmLabel }) vraća Promise<boolean>.
 */
const ConfirmModal = (() => {
  let overlay = null;

  function ensure() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
        <h3 id="confirm-modal-title"></h3>
        <p id="confirm-modal-message"></p>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline" data-action="cancel">OTKAŽI</button>
          <button type="button" class="btn btn-danger" data-action="confirm">OBRIŠI</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  function open({ title = 'Da li ste sigurni?', message = '', confirmLabel = 'OBRIŠI', danger = true } = {}) {
    const el = ensure();
    el.querySelector('#confirm-modal-title').textContent = title;
    el.querySelector('#confirm-modal-message').textContent = message;
    const confirmBtn = el.querySelector('[data-action="confirm"]');
    confirmBtn.textContent = confirmLabel;
    confirmBtn.className = danger ? 'btn btn-danger' : 'btn btn-primary';

    el.classList.add('is-open');

    return new Promise((resolve) => {
      function cleanup(result) {
        el.classList.remove('is-open');
        el.removeEventListener('click', onOverlayClick);
        confirmBtn.removeEventListener('click', onConfirm);
        cancelBtn.removeEventListener('click', onCancel);
        resolve(result);
      }
      function onConfirm() { cleanup(true); }
      function onCancel() { cleanup(false); }
      function onOverlayClick(e) { if (e.target === el) cleanup(false); }

      const cancelBtn = el.querySelector('[data-action="cancel"]');
      confirmBtn.addEventListener('click', onConfirm);
      cancelBtn.addEventListener('click', onCancel);
      el.addEventListener('click', onOverlayClick);
    });
  }

  return { open };
})();
