'use strict';

(function () {
  const tbody = document.getElementById('messages-tbody');
  function esc(v) { return TripRender.escapeHtml(v); }

  function rowHtml(m) {
    const truncated = m.message.length > 60 ? m.message.slice(0, 60) + '…' : m.message;
    return `
      <tr data-id="${m.id}" style="${m.is_read ? '' : 'font-weight:600;'}">
        <td>${esc(m.name)}</td>
        <td>${esc(m.email)}</td>
        <td>${esc(m.phone || '-')}</td>
        <td title="${esc(m.message)}">${esc(truncated)}</td>
        <td>${TripRender.formatDate(m.created_at.slice(0, 10))}</td>
        <td>${m.is_read ? '<span class="status-badge status-ZAVRSENA">Pročitano</span>' : '<span class="status-badge status-AKTIVNA">Novo</span>'}</td>
        <td>
          <div class="row-actions">
            ${!m.is_read ? `<button class="icon-btn" data-action="read" title="Označi kao pročitano"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></button>` : ''}
            <button class="icon-btn danger" data-action="delete" title="Obriši"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>
          </div>
        </td>
      </tr>`;
  }

  let cache = [];

  async function load() {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Učitavanje...</td></tr>`;
    try {
      const data = await AdminApi.get('/contact');
      cache = data.messages;
      tbody.innerHTML = cache.length ? cache.map(rowHtml).join('') : `<tr class="empty-row"><td colspan="7">Nema poruka.</td></tr>`;
    } catch (err) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Greška: ${esc(err.message)}</td></tr>`;
    }
  }

  tbody.addEventListener('click', async (e) => {
    const row = e.target.closest('tr[data-id]');
    if (!row) return;
    const id = Number(row.dataset.id);

    if (e.target.closest('[data-action="read"]')) {
      try {
        await AdminApi.put(`/contact/${id}/read`);
        load();
      } catch (err) {
        Toast.error(err.message || 'Greška.');
      }
    } else if (e.target.closest('[data-action="delete"]')) {
      const confirmed = await ConfirmModal.open({ title: 'Brisanje poruke', message: 'Da li ste sigurni da želite obrisati ovu poruku?' });
      if (!confirmed) return;
      try {
        const res = await AdminApi.delete(`/contact/${id}`);
        Toast.success(res.message || 'Poruka je obrisana.');
        load();
      } catch (err) {
        Toast.error(err.message || 'Greška pri brisanju.');
      }
    }
  });

  load();
})();
