'use strict';

(async function () {
  const form = document.getElementById('filters-form');
  const fromSelect = document.getElementById('f-from');
  const toSelect = document.getElementById('f-to');
  const dateInput = document.getElementById('f-date');
  const statusSelect = document.getElementById('f-status');
  const resetBtn = document.getElementById('reset-filters-btn');
  const tbody = document.getElementById('trips-tbody');
  const countEl = document.getElementById('trip-count');

  try {
    await StationsSelect.populate([fromSelect, toSelect], 'Svi');
  } catch {
    Toast.error('Nije moguće učitati listu stanica.');
  }

  function esc(v) { return TripRender.escapeHtml(v); }

  function rowHtml(trip) {
    return `
      <tr data-id="${trip.id}">
        <td><strong>${esc(trip.route_number)}</strong></td>
        <td>${esc(trip.from_station.city)}</td>
        <td>${esc(trip.to_station.city)}</td>
        <td>${TripRender.formatDate(trip.departure_date)}</td>
        <td>${trip.departure_time}</td>
        <td>${trip.arrival_time}</td>
        <td>${TripRender.formatPrice(trip.price)}</td>
        <td>${TripRender.statusBadge(trip.status)}</td>
        <td>
          <div class="row-actions">
            <a class="icon-btn" href="/admin/trips/${trip.id}/edit" title="Uredi" aria-label="Uredi vožnju">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
            </a>
            <button class="icon-btn danger" data-action="delete" data-id="${trip.id}" data-label="${esc(trip.route_number)} (${esc(trip.from_station.city)} → ${esc(trip.to_station.city)})" title="Obriši" aria-label="Obriši vožnju">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
  }

  async function loadTrips() {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="9">Učitavanje...</td></tr>`;
    const query = new URLSearchParams();
    if (fromSelect.value) query.set('from', fromSelect.value);
    if (toSelect.value) query.set('to', toSelect.value);
    if (dateInput.value) query.set('date', dateInput.value);
    if (statusSelect.value) query.set('status', statusSelect.value);

    try {
      const data = await AdminApi.get(`/trips?${query.toString()}`);
      countEl.textContent = `${data.trips.length} ${data.trips.length === 1 ? 'vožnja' : 'vožnji'}`;
      tbody.innerHTML = data.trips.length
        ? data.trips.map(rowHtml).join('')
        : `<tr class="empty-row"><td colspan="9">Nema vožnji za odabrane filtere.</td></tr>`;
    } catch (err) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="9">Greška: ${esc(err.message)}</td></tr>`;
    }
  }

  tbody.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="delete"]');
    if (!btn) return;
    const id = btn.dataset.id;
    const label = btn.dataset.label;

    const confirmed = await ConfirmModal.open({
      title: 'Brisanje vožnje',
      message: `Da li ste sigurni da želite obrisati vožnju "${label}"?`,
    });
    if (!confirmed) return;

    try {
      const res = await AdminApi.delete(`/trips/${id}`);
      Toast.success(res.message || 'Vožnja je obrisana.');
      loadTrips();
    } catch (err) {
      Toast.error(err.message || 'Greška pri brisanju vožnje.');
    }
  });

  form.addEventListener('submit', (e) => { e.preventDefault(); loadTrips(); });
  resetBtn.addEventListener('click', () => {
    fromSelect.value = ''; toSelect.value = ''; dateInput.value = ''; statusSelect.value = '';
    loadTrips();
  });

  loadTrips();
})();
