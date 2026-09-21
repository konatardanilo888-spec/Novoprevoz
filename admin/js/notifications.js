'use strict';

(function () {
    const tbody = document.getElementById('notifications-tbody');
    const addBtn = document.getElementById('add-notification-btn');
    const modal = document.getElementById('notification-modal');
    const form = document.getElementById('notification-form');
    const cancelBtn = document.getElementById('notification-cancel-btn');
    const modalTitle = document.getElementById('notification-modal-title');
    const idInput = document.getElementById('notification-id');

   const TYPE_LABELS = { INFO: 'Info', UPOZORENJE: 'Upozorenje', VAZNO: 'Važno' };

   function esc(v) { return TripRender.escapeHtml(v); }

   function openModal(n) {
         form.reset();
         clearErrors();
         if (n) {
                 modalTitle.textContent = 'Uredi obavještenje';
                 idInput.value = n.id;
                 document.getElementById('notification-title').value = n.title;
                 document.getElementById('notification-content').value = n.content;
                 document.getElementById('notification-title-en').value = n.title_en || '';
                 document.getElementById('notification-content-en').value = n.content_en || '';
                 document.getElementById('notification-type').value = n.type;
                 document.getElementById('notification-active').checked = Boolean(n.is_active);
         } else {
                 modalTitle.textContent = 'Dodaj obavještenje';
                 idInput.value = '';
                 document.getElementById('notification-active').checked = true;
         }
         modal.classList.add('is-open');
   }
    function closeModal() { modal.classList.remove('is-open'); }

   function clearErrors() {
         form.querySelectorAll('.field-error').forEach((el) => { el.textContent = ''; el.classList.remove('is-visible'); });
   }
    function applyErrors(errors) {
          errors.forEach(({ field, message }) => {
                  const el = form.querySelector(`[data-error-for="${field}"]`);
                  if (el) { el.textContent = message; el.classList.add('is-visible'); }
          });
    }

   function rowHtml(n) {
         return `
               <tr data-id="${n.id}">
                       <td><strong>${esc(n.title)}</strong></td>
                               <td><span class="notice-item type-${n.type}" style="display:inline-flex; padding:4px 10px;">${TYPE_LABELS[n.type]}</span></td>
                                       <td>
                                                 <label class="toggle-switch">
                                                             <input type="checkbox" data-action="toggle" ${n.is_active ? 'checked' : ''} />
                                                                         <span class="toggle-slider"></span>
                                                                                   </label>
                                                                                           </td>
                                                                                                   <td>${TripRender.formatDate(n.created_at.slice(0, 10))}</td>
                                                                                                           <td>
                                                                                                                     <div class="row-actions">
                                                                                                                                 <button class="icon-btn" data-action="edit" title="Uredi" aria-label="Uredi obavještenje">
                                                                                                                                               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                                                                                                                                                           </button>
                                                                                                                                                                       <button class="icon-btn danger" data-action="delete" title="Obriši" aria-label="Obriši obavještenje">
                                                                                                                                                                                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                                                                                                                                                                                                 </button>
                                                                                                                                                                                                           </div>
                                                                                                                                                                                                                   </td>
                                                                                                                                                                                                                         </tr>`;
   }

   let cache = [];

   async function load() {
         tbody.innerHTML = `<tr class="empty-row"><td colspan="5">Učitavanje...</td></tr>`;
         try {
                 const data = await AdminApi.get('/notifications');
                 cache = data.notifications;
                 tbody.innerHTML = cache.length ? cache.map(rowHtml).join('') : `<tr class="empty-row"><td colspan="5">Nema obavještenja.</td></tr>`;
         } catch (err) {
                 tbody.innerHTML = `<tr class="empty-row"><td colspan="5">Greška: ${esc(err.message)}</td></tr>`;
         }
   }

   addBtn.addEventListener('click', () => openModal(null));
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

   tbody.addEventListener('click', async (e) => {
         const row = e.target.closest('tr[data-id]');
         if (!row) return;
         const id = Number(row.dataset.id);
         const item = cache.find((n) => n.id === id);

                              if (e.target.closest('[data-action="edit"]')) {
                                      openModal(item);
                              } else if (e.target.closest('[data-action="delete"]')) {
                                      const confirmed = await ConfirmModal.open({
                                                title: 'Brisanje obavještenja',
                                                message: `Da li ste sigurni da želite obrisati obavještenje "${item.title}"?`,
                                      });
                                      if (!confirmed) return;
                                      try {
                                                const res = await AdminApi.delete(`/notifications/${id}`);
                                                Toast.success(res.message || 'Obavještenje je obrisano.');
                                                load();
                                      } catch (err) {
                                                Toast.error(err.message || 'Greška pri brisanju.');
                                      }
                              }
   });

   tbody.addEventListener('change', async (e) => {
         const checkbox = e.target.closest('[data-action="toggle"]');
         if (!checkbox) return;
         const row = e.target.closest('tr[data-id]');
         const id = Number(row.dataset.id);
         try {
                 await AdminApi.put(`/notifications/${id}`, { is_active: checkbox.checked });
                 Toast.success(checkbox.checked ? 'Obavještenje je aktivirano.' : 'Obavještenje je deaktivirano.');
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
                 title: document.getElementById('notification-title').value.trim(),
                 content: document.getElementById('notification-content').value.trim(),
                 title_en: document.getElementById('notification-title-en').value.trim(),
                 content_en: document.getElementById('notification-content-en').value.trim(),
                 type: document.getElementById('notification-type').value,
                 is_active: document.getElementById('notification-active').checked,
         };
         const id = idInput.value;
         try {
                 const res = id
                   ? await AdminApi.put(`/notifications/${id}`, payload)
                           : await AdminApi.post('/notifications', payload);
                 Toast.success(res.message || 'Obavještenje je sačuvano.');
                 closeModal();
                 load();
         } catch (err) {
                 if (err.errors) applyErrors(err.errors);
                 Toast.error(err.message || 'Neispravni podaci.');
         }
   });

   load();
})();
