'use strict';

(function () {
  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');

  // Ako je korisnik već prijavljen, prebaci ga direktno na dashboard.
  Api.get('/auth/me')
    .then(() => { window.location.href = '/admin/dashboard'; })
    .catch(() => {}); // 401 je očekivano ako nije prijavljen - ignorišemo

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.remove('is-visible');

    const email = form.email.value.trim();
    const password = form.password.value;

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="width:16px;height:16px;"></span> Prijavljivanje...';

    try {
      await Api.post('/auth/login', { email, password });
      window.location.href = '/admin/dashboard';
    } catch (err) {
      errorEl.textContent = err.message || 'Pogrešan email ili lozinka.';
      errorEl.classList.add('is-visible');
      btn.disabled = false;
      btn.innerHTML = '<span class="btn-text">PRIJAVI SE</span>';
    }
  });
})();
