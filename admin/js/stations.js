'use strict';

(function () {
  const tbody = document.getElementById('stations-tbody');
  const addBtn = document.getElementById('add-station-btn');
  const modal = document.getElementById('station-modal');
  const form = document.getElementById('station-form');
  const cancelBtn = document.getElementById('station-cancel-btn');
  const modalTitle = document.getElementById('station-modal-title');
  const idInput = document.getElementById('station-id');

  function esc(v) { return TripRender.escapeHtml(v); }

  function openModal(station) {
    form.reset();
    clearErrors();
    if (station) {
      modalTitle.textContent = 'Uredi stanicu';
      idInput.value = station.id;
      document.getElementById('station-name').value = station.name;
      document.getElementById('station-city').value = station.city;
      document.getElementById('station-address').value = station.address || '';
      document.getElementById('station-phone').value = station.phone || '';
      document.getElementById('station-description').value = station.description || '';
    } else {
      modalTitle.textContent = 'Dodaj stanicu';
      idInput.value = '';
    }
    modal.classList.add('is-open');
  }
  function closeModal() { modal.classList.remove('is-open'); }

  function clearErrors() {
    form.querySelectorAll('.field-error').forEach((el) => { el.textContent = ''; el.classList.remove('is-visible'); });
  }
  function applyErrors(errors) {
    errors.forEach(({ field, message }) => {
      const el = form.querySelector(`[data-error-for="${field}"]`);
      if (el) { el.textContent = message; el.classList.add('is-visible'); }
    });
  }

  function rowHtml(station) {
    return `
      <tr data-id="${station.id}">
        <td><strong>${esc(station.name)}</strong></td>
        <td>${esc(station.city)}</td>
        <td>${esc(station.address || '-')}</td>
        <td>${esc(station.phone || '-')}</td>
        <td>
          <div class="row-actions">
            <button class="icon-btn" data-action="edit" title="Uredi" aria-label="Uredi stanicu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
            </button>
            <button class="icon-btn danger" data-action="delete" title="Obriši" aria-label="Obriši stanicu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
  }

  let stationsCache = [];

  async function loadStations() {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5">Učitavanje...</td></tr>`;
    try {
      const data = await AdminApi.get('/stations');
      stationsCache = data.stations;
      tbody.innerHTML = stationsCache.length
        ? stationsCache.map(rowHtml).join('')
        : `<tr class="empty-row"><td colspan="5">Nema dodatih stanica.</td></tr>`;
    } catch (err) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="5">Greška: ${esc(err.message)}</td></tr>`;
    }
  }

  addBtn.addEventListener('click', () => openModal(null));
  cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  tbody.addEventListener('click', async (e) => {
    const row = e.target.closest('tr[data-id]');
    if (!row) return;
    const id = Number(row.dataset.id);
    const station = stationsCache.find((s) => s.id === id);

    if (e.target.closest('[data-action="edit"]')) {
      openModal(station);
    } else if (e.target.closest('[data-action="delete"]')) {
      const confirmed = await ConfirmModal.open({
        title: 'Brisanje stanice',
        message: `Da li ste sigurni da želite obrisati stanicu "${station.name}"?`,
      });
      if (!confirmed) return;
      try {
        const res = await AdminApi.delete(`/stations/${id}`);
        Toast.success(res.message || 'Stanica je obrisana.');
        loadStations();
      } catch (err) {
        Toast.error(err.message || 'Greška pri brisanju stanice.');
      }
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    const payload = {
      name: document.getElementById('station-name').value.trim(),
      city: document.getElementById('station-city').value.trim(),
      address: document.getElementById('station-address').value.trim(),
      phone: document.getElementById('station-phone').value.trim(),
      description: document.getElementById('station-description').value.trim(),
    };
    const id = idInput.value;

    try {
      const res = id
        ? await AdminApi.put(`/stations/${id}`, payload)
        : await AdminApi.post('/stations', payload);
      Toast.success(res.message || 'Stanica je sačuvana.');
      closeModal();
      loadStations();
    } catch (err) {
      if (err.errors) applyErrors(err.errors);
      Toast.error(err.message || 'Neispravni podaci.');
    }
  });

  loadStations();
})();
