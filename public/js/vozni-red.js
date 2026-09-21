'use strict';

(async function () {
  const form = document.getElementById('filters-form');
  const fromSelect = document.getElementById('f-from');
  const toSelect = document.getElementById('f-to');
  const dateInput = document.getElementById('f-date');
  const timeInput = document.getElementById('f-time');
  const statusSelect = document.getElementById('f-status');
  const resultsContainer = document.getElementById('results-container');

  const params = new URLSearchParams(window.location.search);

  try {
    await StationsSelect.populate([fromSelect, toSelect], I18N.t('stations.selectAll'));
  } catch {
    Toast.error(I18N.t('toast.stationsError'));
  }

  fromSelect.value = params.get('from') || '';
  toSelect.value = params.get('to') || '';
  dateInput.value = params.get('date') || '';
  timeInput.value = params.get('time') || '';
  statusSelect.value = params.get('status') || '';

  async function loadTrips() {
    resultsContainer.innerHTML = `<div class="loading-block"><span class="spinner spinner-dark"></span> ${I18N.t('loading.timetable')}</div>`;

    const query = new URLSearchParams();
    if (fromSelect.value) query.set('from', fromSelect.value);
    if (toSelect.value) query.set('to', toSelect.value);
    if (dateInput.value) query.set('date', dateInput.value);
    if (timeInput.value) query.set('time', timeInput.value);
    if (statusSelect.value) query.set('status', statusSelect.value);

    // Ažuriraj URL bez ponovnog učitavanja stranice, radi lakšeg dijeljenja/nazad-dugmeta.
    const newUrl = query.toString() ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);

    try {
      const data = await Api.get(`/trips?${query.toString()}`);
      renderResults(data.trips);
    } catch (err) {
      resultsContainer.innerHTML = `<div class="empty-state"><p>${I18N.t('timetable.loadError')} ${TripRender.escapeHtml(err.message)}</p></div>`;
    }
  }

  function renderResults(trips) {
    if (!trips.length) {
      resultsContainer.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          <p>${I18N.t('timetable.empty')}</p>
        </div>`;
      return;
    }

    const tableHtml = `
      <div class="table-wrap">
        <table class="timetable">
          <thead><tr><th>${I18N.t('table.line')}</th><th>${I18N.t('filters.from')}</th><th>${I18N.t('table.departure')}</th><th>${I18N.t('filters.to')}</th><th>${I18N.t('table.arrival')}</th><th>${I18N.t('table.duration')}</th><th>${I18N.t('table.price')}</th><th>${I18N.t('table.status')}</th><th></th></tr></thead>
          <tbody>${trips.map(TripRender.timetableRow).join('')}</tbody>
        </table>
      </div>`;
    const cardsHtml = `<div class="timetable-cards">${trips.map(TripRender.timetableCard).join('')}</div>`;
    resultsContainer.innerHTML = tableHtml + cardsHtml;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    loadTrips();
  });

  loadTrips();
})();
