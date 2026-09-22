'use strict';

/** Javna stranica /galerija - učitava fotografije i prikazuje ih u mreži sa lightbox pregledom. */
(function () {
  const statusEl = document.getElementById('gallery-status');
  const gridEl = document.getElementById('gallery-grid');
  const overlay = document.getElementById('lightbox-overlay');
  const lightboxImage = document.getElementById('lightbox-image');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');

  function esc(v) {
    const div = document.createElement('div');
    div.textContent = v == null ? '' : String(v);
    return div.innerHTML;
  }

  const t = (key, fallback) => (window.I18N ? I18N.t(key) : fallback || key);

  let images = [];
  let currentIndex = -1;

  function openLightbox(index) {
    currentIndex = index;
    const img = images[currentIndex];
    lightboxImage.src = img.image_data;
    lightboxImage.alt = img.caption || '';
    lightboxCaption.textContent = img.caption || '';
    lightboxCaption.hidden = !img.caption;
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function showRelative(delta) {
    if (!images.length) return;
    currentIndex = (currentIndex + delta + images.length) % images.length;
    openLightbox(currentIndex);
  }

  closeBtn.addEventListener('click', closeLightbox);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeLightbox(); });
  prevBtn.addEventListener('click', () => showRelative(-1));
  nextBtn.addEventListener('click', () => showRelative(1));
  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showRelative(-1);
    if (e.key === 'ArrowRight') showRelative(1);
  });

  function itemHtml(img, index) {
    return `
      <button type="button" class="gallery-item" data-index="${index}" aria-label="${esc(img.caption || t('gallery.viewPhoto', 'Pogledaj fotografiju'))}">
        <img src="${img.image_data}" alt="${esc(img.caption || '')}" loading="lazy" />
        ${img.caption ? `<span class="gallery-item-caption">${esc(img.caption)}</span>` : ''}
      </button>
    `;
  }

  async function load() {
    try {
      const data = await Api.get('/gallery');
      images = data.images || [];
      if (!images.length) {
        statusEl.textContent = t('gallery.empty', 'Trenutno nema dostupnih fotografija.');
        return;
      }
      gridEl.innerHTML = images.map(itemHtml).join('');
      gridEl.hidden = false;
      statusEl.hidden = true;
      gridEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.gallery-item');
        if (!btn) return;
        openLightbox(Number(btn.dataset.index));
      });
    } catch (err) {
      statusEl.textContent = `${t('gallery.loadError', 'Nije moguće učitati galeriju.')} ${err.message || ''}`;
    }
  }

  load();
})();
