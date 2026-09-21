'use strict';

(async function () {
  const form = document.getElementById('trip-form');
  const submitBtn = document.getElementById('submit-btn');
  const fromSelect = document.getElementById('from_station_id');
  const toSelect = document.getElementById('to_station_id');

  // Prepoznaje da li smo u režimu izmjene na osnovu putanje: /admin/trips/:id/edit
  const editMatch = window.location.pathname.match(/^\/admin\/trips\/(\d+)\/edit$/);
  const tripId = editMatch ? editMatch[1] : null;
  const isEditMode = Boolean(tripId);

  if (isEditMode) {
    document.getElementById('page-title').textContent = 'Uredi vožnju - NOVOPREVOZ Admin';
    document.getElementById('topbar-title').textContent = 'Uredi vožnju';
    document.getElementById('form-heading').textContent = 'Uredi vožnju';
    document.getElementById('breadcrumb-current').textContent = 'Uredi vožnju';
    submitBtn.textContent = 'SAČUVAJ IZMJENE';
  }

  function clearFieldErrors() {
    form.querySelectorAll('.field-error').forEach((el) => { el.textContent = ''; el.classList.remove('is-visible'); });
    form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  }

  function applyFieldErrors(errors) {
    errors.forEach(({ field, message }) => {
      const errorEl = form.querySelector(`[data-error-for="${field}"]`);
      const inputEl = form.querySelector(`[name="${field}"]`);
      if (errorEl) { errorEl.textContent = message; errorEl.classList.add('is-visible'); }
      if (inputEl) inputEl.classList.add('is-invalid');
    });
  }

  try {
    await StationsSelect.populateWithIds([fromSelect, toSelect], 'Izaberi stanicu');
  } catch {
    Toast.error('Nije moguće učitati listu stanica.');
  }

  if (isEditMode) {
    try {
      const data = await AdminApi.get(`/trips/${tripId}`);
      const trip = data.trip;
      form.route_number.value = trip.route_number;
      form.bus_type.value = trip.bus_type;
      form.from_station_id.value = trip.from_station_id;
      form.to_station_id.value = trip.to_station_id;
      form.departure_date.value = trip.departure_date;
      form.departure_time.value = trip.departure_time;
      form.arrival_time.value = trip.arrival_time;
      form.price.value = trip.price;
      form.status.value = trip.status;
      form.notes.value = trip.notes || '';
    } catch (err) {
      Toast.error(err.message || 'Nije moguće učitati podatke o vožnji.');
    }
  } else {
    form.departure_date.value = new Date().toISOString().slice(0, 10);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldErrors();

    const payload = {
      route_number: form.route_number.value.trim(),
      from_station_id: Number(form.from_station_id.value),
      to_station_id: Number(form.to_station_id.value),
      departure_date: form.departure_date.value,
      departure_time: form.departure_time.value,
      arrival_time: form.arrival_time.value,
      price: Number(form.price.value),
      bus_type: form.bus_type.value,
      status: form.status.value,
      notes: form.notes.value.trim() || null,
    };

    submitBtn.disabled = true;
    const originalLabel = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="spinner" style="width:16px;height:16px;"></span> Čuvanje...';

    try {
      const res = isEditMode
        ? await AdminApi.put(`/trips/${tripId}`, payload)
        : await AdminApi.post('/trips', payload);
      Toast.success(res.message || 'Vožnja je sačuvana.');
      window.location.href = '/admin/trips';
    } catch (err) {
      if (err.errors) applyFieldErrors(err.errors);
      Toast.error(err.message || 'Neispravni podaci.');
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });
})();
