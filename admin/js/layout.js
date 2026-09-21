'use strict';

/**
 * Zajednička logika za admin layout (sidebar + topbar), učitava se na
 * svakoj admin stranici osim login-a.
 */
(function () {
  const sidebar = document.querySelector('.admin-sidebar');
  const backdrop = document.querySelector('.sidebar-backdrop');
  const toggleBtn = document.querySelector('.sidebar-toggle');
  const logoutBtn = document.querySelector('[data-action="logout"]');

  function openSidebar() {
    sidebar.classList.add('is-open');
    backdrop.classList.add('is-open');
  }
  function closeSidebar() {
    sidebar.classList.remove('is-open');
    backdrop.classList.remove('is-open');
  }
  if (toggleBtn) toggleBtn.addEventListener('click', openSidebar);
  if (backdrop) backdrop.addEventListener('click', closeSidebar);
  sidebar?.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeSidebar));

  // Obilježi aktivnu stavku u sidebaru na osnovu trenutne putanje - bira
  // se najspecifičniji (najduži) link koji odgovara putanji, tako da npr.
  // "/admin/trips/new" ne obilježi istovremeno i "Vozni red" i "Dodaj vožnju".
  const currentPath = window.location.pathname;
  let bestMatch = null;
  sidebar?.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    const matches = href === currentPath || currentPath.startsWith(href + '/');
    if (matches && (!bestMatch || href.length > bestMatch.href.length)) {
      bestMatch = { a, href };
    }
  });
  if (bestMatch) bestMatch.a.classList.add('is-active');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await Api.post('/auth/logout');
      } catch {
        // Bez obzira na grešku, ipak preusmjeri na login.
      }
      window.location.href = '/admin/login';
    });
  }

  // Učitaj podatke o prijavljenom korisniku i popuni topbar; sakrij
  // stavke menija za koje korisnik nema dozvolu (npr. Korisnici je
  // rezervisano za superadmin rolu).
  (async function loadCurrentUser() {
    try {
      const data = await Api.get('/auth/me');
      const user = data.user;
      window.__currentUser = user;

      const nameEl = document.querySelector('[data-user-name]');
      const roleEl = document.querySelector('[data-user-role]');
      const avatarEl = document.querySelector('[data-user-avatar]');
      const roleLabels = { admin: 'Administrator', superadmin: 'Super Administrator', editor: 'Urednik' };

      if (nameEl) nameEl.textContent = user.name;
      if (roleEl) roleEl.textContent = roleLabels[user.role] || user.role;
      if (avatarEl) avatarEl.textContent = user.name.slice(0, 2).toUpperCase();

      if (user.role !== 'superadmin') {
        document.querySelectorAll('[data-requires-role="superadmin"]').forEach((el) => el.remove());
      }
    } catch (err) {
      if (err.status === 401) window.location.href = '/admin/login';
    }
  })();
})();
