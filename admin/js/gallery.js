'use strict';

(function () {
  const form = document.getElementById('gallery-form');
  const fileInput = document.getElementById('gallery-file');
  const captionInput = document.getElementById('gallery-caption');
  const previewWrap = document.getElementById('gallery-preview-wrap');
  const previewImg = document.getElementById('gallery-preview');
  const submitBtn = document.getElementById('gallery-submit-btn');
  const statusEl = document.getElementById('gallery-admin-status');
  const gridEl = document.getElementById('gallery-admin-grid');

  const MAX_DIM = 1600;
  const JPEG_QUALITY = 0.82;
  const MAX_DATA_LENGTH = 4_200_000;

  function esc(v) {
    const div = document.createElement('div');
    div.textContent = v == null ? '' : String(v);
    return div.innerHTML;
  }

  function clearErrors() {
    form.querySelectorAll('.field-error').forEach((el) => { el.textContent = ''; el.classList.remove('is-visible'); });
  }
  function applyErrors(errors) {
    errors.forEach(({ field, message }) => {
      const el = form.querySelector(`[data-error-for="${field}"]`);
      if (el) { el.textContent = message; el.classList.add('is-visible'); }
    });
  }

  /** Učitava izabrani fajl, po potrebi ga smanjuje/kompresuje preko <canvas>-a
   * (GIF prolazi bez izmjene da ne izgubi animaciju), i vraća base64 data URL. */
  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Greška pri čitanju fajla.'));
      reader.onload = () => {
        if (file.type === 'image/gif') {
          resolve(reader.result);
          return;
        }
        const img = new Image();
        img.onerror = () => reject(new Error('Fajl nije validna slika.'));
        img.onload = () => {
          let { width, height } = img;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width >= height) {
              height = Math.round(height * (MAX_DIM / width));
              width = MAX_DIM;
            } else {
              width = Math.round(width * (MAX_DIM / height));
              height = MAX_DIM;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          resolve(canvas.toDataURL(mime, JPEG_QUALITY));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  let pendingDataUrl = null;

  fileInput.addEventListener('change', async () => {
    clearErrors();
    previewWrap.hidden = true;
    pendingDataUrl = null;
    const file = fileInput.files[0];
    if (!file) return;
    try {
      pendingDataUrl = await fileToDataUrl(file);
      if (pendingDataUrl.length > MAX_DATA_LENGTH) {
        applyErrors([{ field: 'image_data', message: 'Slika je i dalje prevelika nakon kompresije. Izaberite manju fotografiju.' }]);
        pendingDataUrl = null;
        return;
      }
      previewImg.src = pendingDataUrl;
      previewWrap.hidden = false;
    } catch (err) {
      applyErrors([{ field: 'image_data', message: err.message || 'Nije moguće obraditi fajl.' }]);
    }
  });

  function cardHtml(img) {
    return `
      <div class="gallery-admin-card" data-id="${img.id}">
        <img src="${img.image_data}" alt="${esc(img.caption || '')}" />
        <div class="gallery-admin-card-body">
          <span class="gallery-admin-caption">${img.caption ? esc(img.caption) : '<span class="text-muted">Bez opisa</span>'}</span>
          <button type="button" class="icon-btn danger" data-action="delete" title="Obriši" aria-label="Obriši fotografiju">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      </div>`;
  }

  let cache = [];

  async function load() {
    statusEl.hidden = false;
    statusEl.textContent = 'Učitavanje...';
    gridEl.hidden = true;
    try {
      const data = await AdminApi.get('/gallery');
      cache = data.images || [];
      if (!cache.length) {
        statusEl.textContent = 'Još uvijek nema dodatih fotografija.';
        return;
      }
      gridEl.innerHTML = cache.map(cardHtml).join('');
      gridEl.hidden = false;
      statusEl.hidden = true;
    } catch (err) {
      statusEl.textContent = `Greška: ${err.message}`;
    }
  }

  gridEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="delete"]');
    if (!btn) return;
    const card = e.target.closest('[data-id]');
    const id = Number(card.dataset.id);
    const img = cache.find((i) => i.id === id);
    const confirmed = await ConfirmModal.open({
      title: 'Brisanje fotografije',
      message: `Da li ste sigurni da želite obrisati ovu fotografiju${img && img.caption ? ` ("${img.caption}")` : ''}?`,
    });
    if (!confirmed) return;
    try {
      const res = await AdminApi.delete(`/gallery/${id}`);
      Toast.success(res.message || 'Fotografija je obrisana.');
      load();
    } catch (err) {
      Toast.error(err.message || 'Greška pri brisanju.');
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    if (!pendingDataUrl) {
      applyErrors([{ field: 'image_data', message: 'Izaberite fotografiju.' }]);
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Dodavanje...';
    try {
      const res = await AdminApi.post('/gallery', {
        image_data: pendingDataUrl,
        caption: captionInput.value.trim(),
      });
      Toast.success(res.message || 'Fotografija je dodata.');
      form.reset();
      previewWrap.hidden = true;
      pendingDataUrl = null;
      load();
    } catch (err) {
      if (err.errors) applyErrors(err.errors);
      Toast.error(err.message || 'Greška pri dodavanju fotografije.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '+ Dodaj fotografiju';
    }
  });

  load();
})();
