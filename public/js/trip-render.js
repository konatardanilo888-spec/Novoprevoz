'use strict';

/** Zajedničke funkcije za formatiranje i prikaz vožnji. */
const TripRender = (() => {
  // Rezervne (srpske) oznake statusa - koriste se u admin panelu, koji
  // nema učitan i18n.js (admin panel nije preveden, samo javni sajt).
  const STATUS_LABELS_SR = { AKTIVNA: 'Aktivna', OTKAZANA: 'Otkazano', ZAVRSENA: 'Završena' };

  function statusLabel(status) {
    if (window.I18N) return I18N.t(`status.${status}`);
    return STATUS_LABELS_SR[status] || status;
  }

  function formatPrice(price) {
    return `${Number(price).toFixed(2)} €`;
  }

  function formatDuration(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('sr-Latn-ME', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function statusBadge(status) {
    return `<span class="status-badge status-${status}">${statusLabel(status)}</span>`;
  }

  function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }

  /** Kartica vožnje - koristi se u rezultatima pretrage (/polasci). */
  function tripCard(trip) {
    return `
      <article class="card trip-card reveal is-visible" data-trip-id="${trip.id}" data-href="/voznja?id=${trip.id}">
        <div class="trip-route-info">
          <span class="trip-line-badge">${window.I18N ? I18N.t('trip.line') : 'Linija'} ${escapeHtml(trip.route_number)}</span>
          <div class="trip-cities">${escapeHtml(trip.from_station.city)} → ${escapeHtml(trip.to_station.city)}</div>
          <div class="trip-times">
            <span class="time">${trip.departure_time}</span>
            <span aria-hidden="true">→</span>
            <span class="time">${trip.arrival_time}</span>
            <span>&middot;</span>
            <span>${formatDate(trip.departure_date)}</span>
          </div>
        </div>
        <div class="trip-schedule">
          <div class="trip-duration">${window.I18N ? I18N.t('trip.duration') : 'Trajanje'}</div>
          <div><strong>${formatDuration(trip.duration_minutes)}</strong></div>
        </div>
        <div class="trip-price-block">
          ${statusBadge(trip.status)}
          <div class="trip-price">${formatPrice(trip.price)}</div>
          <a class="btn btn-outline btn-sm" href="/voznja?id=${trip.id}">${window.I18N ? I18N.t('trip.details') : 'Detalji'}</a>
        </div>
      </article>
    `;
  }

  /** Red u tabeli voznog reda (/vozni-red, desktop prikaz). */
  function timetableRow(trip) {
    return `
      <tr data-href="/voznja?id=${trip.id}">
        <td><strong>${escapeHtml(trip.route_number)}</strong></td>
        <td>${escapeHtml(trip.from_station.city)}</td>
        <td>${trip.departure_time}</td>
        <td>${escapeHtml(trip.to_station.city)}</td>
        <td>${trip.arrival_time}</td>
        <td>${formatDuration(trip.duration_minutes)}</td>
        <td>${formatPrice(trip.price)}</td>
        <td>${statusBadge(trip.status)}</td>
        <td><a class="btn btn-outline btn-sm" href="/voznja?id=${trip.id}">${window.I18N ? I18N.t('trip.details') : 'Detalji'}</a></td>
      </tr>
    `;
  }

  /** Kartica voznog reda za mobilni prikaz (/vozni-red, ispod 860px). */
  function timetableCard(trip) {
    const t = window.I18N ? I18N.t : (k, d) => d || k;
    return `
      <div class="card timetable-card" data-href="/voznja?id=${trip.id}">
        <div class="row"><span class="label">${t('trip.line')}</span><span class="value">${escapeHtml(trip.route_number)}</span></div>
        <div class="row"><span class="label">${t('card.relation')}</span><span class="value">${escapeHtml(trip.from_station.city)} → ${escapeHtml(trip.to_station.city)}</span></div>
        <div class="row"><span class="label">${t('table.departure')}</span><span class="value">${trip.departure_time} (${formatDate(trip.departure_date)})</span></div>
        <div class="row"><span class="label">${t('table.arrival')}</span><span class="value">${trip.arrival_time}</span></div>
        <div class="row"><span class="label">${t('trip.duration')}</span><span class="value">${formatDuration(trip.duration_minutes)}</span></div>
        <div class="row"><span class="label">${t('table.price')}</span><span class="value">${formatPrice(trip.price)}</span></div>
        <div class="row"><span class="label">${t('table.status')}</span>${statusBadge(trip.status)}</div>
        <a class="btn btn-outline btn-block btn-sm" href="/voznja?id=${trip.id}">${t('trip.details')}</a>
      </div>
    `;
  }

  return { formatPrice, formatDuration, formatDate, statusBadge, statusLabel, tripCard, timetableRow, timetableCard, escapeHtml };
})();
