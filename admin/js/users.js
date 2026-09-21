'use strict';

(async function () {
  const tbody = document.getElementById('users-tbody');
  const addBtn = document.getElementById('add-user-btn');
  const modal = document.getElementById('user-modal');
  const form = document.getElementById('user-form');
  const cancelBtn = document.getElementById('user-cancel-btn');
  const accessDenied = document.getElementById('access-denied');
  const usersContent = document.getElementById('users-content');

  function esc(v) { return TripRender.escapeHtml(v); }

  // Provjeri rolu na klijentu radi UX-a (server je stvarna linija odbrane).
  try {
    const me = await Api.get('/auth/me');
    if (me.user.role !== 'superadmin') {
      accessDenied.style.display = 'block';
      usersContent.style.display = 'none';
      return;
    }
  } catch (err) {
    if (err.status === 401) { window.location.href = '/admin/login'; return; }
  }

  let currentUserId = null;
  Api.get('/auth/me').then((d) => { currentUserId = d.user.id; }).catch(() => {});

  function roleLabel(role) {
    return { admin: 'Admin', superadmin: 'Superadmin', editor: 'Urednik' }[role] || role;
  }

  function rowHtml(u) {
    return `
      <tr data-id="${u.id}">
        <td><strong>${esc(u.name)}</strong></td>
        <td>${esc(u.email)}</td>
        <td><span class="badge-role role-${u.role}">${roleLabel(u.role)}</span></td>
        <td>
          <label class="toggle-switch">
            <input type="checkbox" data-action="toggle-active" ${u.is_active ? 'checked' : ''} />
            <span class="toggle-slider"></span>
          </label>
        </td>
        <td>${TripRender.formatDate(u.created_at.slice(0, 10))}</td>
        <td>
          <div class="row-actions">
            <button class="icon-btn danger" data-action="delete" title="Obriši" aria-label="Obriši korisnika">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
  }

  let cache = [];

  async function load() {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Učitavanje...</td></tr>`;
    try {
      const data = await AdminApi.get('/users');
      cache = data.users;
      tbody.innerHTML = cache.length ? cache.map(rowHtml).join('') : `<tr class="empty-row"><td colspan="6">Nema korisnika.</td></tr>`;
    } catch (err) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Greška: ${esc(err.message)}</td></tr>`;
    }
  }

  addBtn.addEventListener('click', () => { form.reset(); clearErrors(); modal.classList.add('is-open'); });
  cancelBtn.addEventListener('click', () => modal.classList.remove('is-open'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('is-open'); });

  function clearErrors() {
    form.querySelectorAll('.field-error').forEach((el) => { el.textContent = ''; el.classList.remove('is-visible'); });
  }
  function applyErrors(errors) {
    errors.forEach(({ field, message }) => {
      const el = form.querySelector(`[data-error-for="${field}"]`);
      if (el) { el.textContent = message; el.classList.add('is-visible'); }
    });
  }

  tbody.addEventListener('click', async (e) => {
    const row = e.target.closest('tr[data-id]');
    if (!row) return;
    const id = Number(row.dataset.id);
    const user = cache.find((u) => u.id === id);

    if (e.target.closest('[data-action="delete"]')) {
      if (id === currentUserId) {
        Toast.error('Ne možete obrisati sopstveni nalog.');
        return;
      }
      const confirmed = await ConfirmModal.open({
        title: 'Brisanje korisnika',
        message: `Da li ste sigurni da želite obrisati korisnika "${user.name}"?`,
      });
      if (!confirmed) return;
      try {
        const res = await AdminApi.delete(`/users/${id}`);
        Toast.success(res.message || 'Korisnik je obrisan.');
        load();
      } catch (err) {
        Toast.error(err.message || 'Greška pri brisanju.');
      }
    }
  });

  tbody.addEventListener('change', async (e) => {
    const checkbox = e.target.closest('[data-action="toggle-active"]');
    if (!checkbox) return;
    const row = e.target.closest('tr[data-id]');
    const id = Number(row.dataset.id);
    try {
      await AdminApi.put(`/users/${id}`, { is_active: checkbox.checked });
      Toast.success('Status korisnika je izmijenjen.');
      load();
    } catch (err) {
      Toast.error(err.message || 'Greška pri izmjeni statusa.');
      checkbox.checked = !checkbox.checked;
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    const payload = {
      name: document.getElementById('user-name').value.trim(),
      email: document.getElementById('user-email').value.trim(),
      password: document.getElementById('user-password').value,
      role: document.getElementById('user-role').value,
    };
    try {
      const res = await AdminApi.post('/users', payload);
      Toast.success(res.message || 'Korisnik je dodat.');
      modal.classList.remove('is-open');
      load();
    } catch (err) {
      if (err.errors) applyErrors(err.errors);
      Toast.error(err.message || 'Neispravni podaci.');
    }
  });

  load();
})();
