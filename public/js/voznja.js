'use strict';

(async function () {
  const container = document.getElementById('trip-detail-container');
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    container.innerHTML = `<div class="empty-state"><p>${I18N.t('trip.notSelectedPrefix')} <a href="/polasci">${I18N.t('trip.searchLink')}</a>.</p></div>`;
    return;
  }

  try {
    const data = await Api.get(`/trips/${encodeURIComponent(id)}`);
    render(data.trip);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p>${I18N.t('trip.notFound')} ${TripRender.escapeHtml(err.message)}</p></div>`;
  }

  function render(trip) {
    document.title = `Linija ${trip.route_number} - ${trip.from_station.city} → ${trip.to_station.city} - NOVOPREVOZ`;

    const cancelledBanner =
      trip.status === 'OTKAZANA'
        ? `<div class="cancelled-banner"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> ${I18N.t('trip.cancelledBanner')}</div>`
        : '';

    container.innerHTML = `
      ${cancelledBanner}
      <div class="detail-hero">
        <span class="trip-line-badge" style="background:rgba(255,255,255,0.15); color:#fff;">${I18N.t('trip.line')} ${TripRender.escapeHtml(trip.route_number)}</span>
        <div class="route" style="margin-top:12px;">
          ${TripRender.escapeHtml(trip.from_station.city)}
          <span aria-hidden="true">&rarr;</span>
          ${TripRender.escapeHtml(trip.to_station.city)}
        </div>
        <p style="color:#C9DAF8; margin-top:8px;">${TripRender.formatDate(trip.departure_date)} &middot; ${trip.departure_time} - ${trip.arrival_time}</p>
      </div>

      <div class="detail-grid">
        <div class="detail-item"><div class="label">${I18N.t('detail.fromStation')}</div><div class="value">${TripRender.escapeHtml(trip.from_station.name)}</div></div>
        <div class="detail-item"><div class="label">${I18N.t('detail.toStation')}</div><div class="value">${TripRender.escapeHtml(trip.to_station.name)}</div></div>
        <div class="detail-item"><div class="label">${I18N.t('detail.date')}</div><div class="value">${TripRender.formatDate(trip.departure_date)}</div></div>
        <div class="detail-item"><div class="label">${I18N.t('detail.departureTime')}</div><div class="value">${trip.departure_time}</div></div>
        <div class="detail-item"><div class="label">${I18N.t('detail.arrivalTime')}</div><div class="value">${trip.arrival_time}</div></div>
        <div class="detail-item"><div class="label">${I18N.t('detail.duration')}</div><div class="value">${TripRender.formatDuration(trip.duration_minutes)}</div></div>
        <div class="detail-item"><div class="label">${I18N.t('detail.price')}</div><div class="value">${TripRender.formatPrice(trip.price)}</div></div>
        <div class="detail-item"><div class="label">${I18N.t('detail.busType')}</div><div class="value">${TripRender.escapeHtml(trip.bus_type)}</div></div>
        <div class="detail-item"><div class="label">${I18N.t('detail.status')}</div><div class="value">${TripRender.statusBadge(trip.status)}</div></div>
      </div>

      ${trip.notes ? `<div class="card" style="margin-top:24px; padding:20px;"><div class="detail-item" style="border:none; padding:0;"><div class="label">${I18N.t('detail.notes')}</div><div class="value" style="font-weight:500; font-size:1rem;">${TripRender.escapeHtml(trip.notes)}</div></div></div>` : ''}
    `;
  }
})();
