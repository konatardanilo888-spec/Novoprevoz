'use strict';

/**
 * Učitava listu stanica iz baze (GET /api/stations) i puni <select>
 * elemente jedinstvenim gradovima (pretraga i vozni red rade po gradu,
 * ne po tačnom nazivu stanice - jednostavnije za putnika).
 */
const StationsSelect = (() => {
  let citiesCache = null;

  async function loadCities() {
    if (citiesCache) return citiesCache;
    const data = await Api.get('/stations');
    const cities = [...new Set(data.stations.map((s) => s.city))].sort((a, b) =>
      a.localeCompare(b, 'sr')
    );
    citiesCache = cities;
    return cities;
  }

  function fillSelect(selectEl, cities, placeholder) {
    selectEl.innerHTML = '';
    const placeholderOpt = document.createElement('option');
    placeholderOpt.value = '';
    placeholderOpt.textContent = placeholder;
    selectEl.appendChild(placeholderOpt);
    cities.forEach((city) => {
      const opt = document.createElement('option');
      opt.value = city;
      opt.textContent = city;
      selectEl.appendChild(opt);
    });
  }

  async function populate(selectEls, placeholder) {
    const label = placeholder || (window.I18N ? I18N.t('stations.select') : 'Izaberi stanicu');
    try {
      const cities = await loadCities();
      selectEls.forEach((el) => {
        if (el) fillSelect(el, cities, label);
      });
      return cities;
    } catch (err) {
      const errLabel = window.I18N ? I18N.t('stations.loadError') : 'Greška pri učitavanju stanica';
      selectEls.forEach((el) => {
        if (el) {
          el.innerHTML = `<option value="">${errLabel}</option>`;
        }
      });
      throw err;
    }
  }

  /**
   * Puni <select> elemente stanicama po ID-ju (value = station.id), a ne
   * po gradu - koristi se u admin formama (dodavanje/izmjena vožnje) gdje
   * je backend-u potreban tačan from_station_id / to_station_id.
   */
  async function populateWithIds(selectEls, placeholder = 'Izaberi stanicu') {
    const data = await Api.get('/stations');
    const stations = data.stations.sort((a, b) => a.city.localeCompare(b.city, 'sr') || a.name.localeCompare(b.name, 'sr'));
    selectEls.forEach((el) => {
      if (!el) return;
      el.innerHTML = '';
      const placeholderOpt = document.createElement('option');
      placeholderOpt.value = '';
      placeholderOpt.textContent = placeholder;
      el.appendChild(placeholderOpt);
      stations.forEach((s) => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.name} (${s.city})`;
        el.appendChild(opt);
      });
    });
    return stations;
  }

  return { populate, populateWithIds, loadCities };
})();
