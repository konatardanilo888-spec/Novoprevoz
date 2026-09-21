'use strict';

(async function () {
  function esc(v) { return TripRender.escapeHtml(v); }

  function statRow(label, value, icon, tone) {
    return `
      <div class="stat-card tone-${tone}">
        <div class="stat-icon">${icon}</div>
        <div class="stat-value">${value}</div>
        <div class="stat-label">${label}</div>
      </div>`;
  }

  function tripRow(trip, columns) {
    const cells = columns.map((col) => {
      if (col === 'route') return `<td><strong>${esc(trip.route_number)}</strong></td>`;
      if (col === 'relation') return `<td>${esc(trip.from_station.city)} → ${esc(trip.to_station.city)}</td>`;
      if (col === 'departure') return `<td>${trip.departure_time}</td>`;
      if (col === 'date') return `<td>${TripRender.formatDate(trip.departure_date)}</td>`;
      if (col === 'status') return `<td>${TripRender.statusBadge(trip.status)}</td>`;
      if (col === 'notes') return `<td>${esc(trip.notes || '-')}</td>`;
      return '<td></td>';
    });
    return `<tr>${cells.join('')}</tr>`;
  }

  function renderTable(tbodySelector, trips, columns, emptyMessage) {
    const tbody = document.querySelector(`${tbodySelector} tbody`);
    if (!trips.length) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="4">${emptyMessage}</td></tr>`;
      return;
    }
    tbody.innerHTML = trips.map((t) => tripRow(t, columns)).join('');
  }

  try {
    const data = await AdminApi.get('/trips/dashboard-stats');
    const { stats, todayTrips, upcomingTrips, recentTrips, cancelledTrips } = data;

    document.getElementById('stat-grid').innerHTML = [
      statRow('Ukupno vožnji', stats.totalTrips, '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>', 'blue'),
      statRow('Današnji polasci', stats.todayDepartures, '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', 'gold'),
      statRow('Aktivne linije', stats.activeLines, '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/></svg>', 'green'),
      statRow('Broj stanica', stats.totalStations, '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>', 'red'),
    ].join('');

    renderTable('#today-table', todayTrips, ['route', 'relation', 'departure', 'status'], 'Nema polazaka danas.');
    renderTable('#upcoming-table', upcomingTrips, ['route', 'relation', 'departure', 'status'], 'Nema nadolazećih polazaka.');
    renderTable('#recent-table', recentTrips, ['route', 'relation', 'date', 'status'], 'Nema dodatih vožnji.');
    renderTable('#cancelled-table', cancelledTrips, ['route', 'relation', 'date', 'notes'], 'Nema otkazanih vožnji.');
  } catch (err) {
    Toast.error(err.message || 'Greška pri učitavanju dashboard podataka.');
  }
})();
