'use strict';

(async function () {
  const form = document.getElementById('search-form');
  const fromSelect = document.getElementById('p-from');
  const toSelect = document.getElementById('p-to');
  const dateInput = document.getElementById('p-date');
  const errorEl = document.getElementById('search-error');
  const resultsContainer = document.getElementById('results-container');
  const resultsSummary = document.getElementById('results-summary');

  const today = new Date().toISOString().slice(0, 10);
  dateInput.min = today;

  const params = new URLSearchParams(window.location.search);

  try {
    await StationsSelect.populate([fromSelect, toSelect]);
  } catch {
    Toast.error(I18N.t('toast.stationsError'));
  }

  fromSelect.value = params.get('from') || '';
  toSelect.value = params.get('to') || '';
  dateInput.value = params.get('date') || today;

  async function search() {
    const from = fromSelect.value;
    const to = toSelect.value;
    const date = dateInput.value;

    if (!from || !to || !date) {
      errorEl.textContent = I18N.t('search.errorFill');
      errorEl.classList.add('is-visible');
      return;
    }
    if (from === to) {
      errorEl.textContent = I18N.t('search.errorSame');
      errorEl.classList.add('is-visible');
      return;
    }
    errorEl.classList.remove('is-visible');

    const query = new URLSearchParams({ from, to, date }).toString();
    window.history.replaceState({}, '', `${window.location.pathname}?${query}`);

    resultsContainer.innerHTML = `<div class="loading-block"><span class="spinner spinner-dark"></span> ${I18N.t('search.loading')}</div>`;
    resultsSummary.textContent = '';

    try {
      const data = await Api.get(`/trips?${query}`);
      renderResults(data.trips, from, to);
    } catch (err) {
      resultsContainer.innerHTML = `<div class="empty-state"><p>${I18N.t('search.errorPrefix')} ${TripRender.escapeHtml(err.message)}</p></div>`;
    }
  }

  function renderResults(trips, from, to) {
    if (!trips.length) {
      resultsSummary.textContent = '';
      resultsContainer.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/></svg>
          <p>${I18N.t('search.emptyResult')}</p>
        </div>`;
      return;
    }
    const foundText = trips.length === 1 ? I18N.t('search.foundOne') : I18N.t('search.foundMany', { n: trips.length });
    resultsSummary.textContent = `${foundText} ${from} → ${to}`;
    resultsContainer.innerHTML = trips.map(TripRender.tripCard).join('');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    search();
  });

  if (params.get('from') && params.get('to') && params.get('date')) {
    search();
  } else {
    resultsContainer.innerHTML = `
      <div class="empty-state">
        <p>${I18N.t('search.initialPrompt')}</p>
      </div>`;
  }
})();
