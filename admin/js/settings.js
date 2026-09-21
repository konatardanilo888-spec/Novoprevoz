'use strict';

(async function () {
  const settingsForm = document.getElementById('settings-form');
  const passwordForm = document.getElementById('password-form');

  try {
    const data = await AdminApi.get('/settings');
    Object.entries(data.settings).forEach(([key, value]) => {
      const input = settingsForm.querySelector(`[name="${key}"]`);
      if (input) input.value = value;
    });
  } catch (err) {
    Toast.error(err.message || 'Greška pri učitavanju podešavanja.');
  }

  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(settingsForm);
    const payload = Object.fromEntries(formData.entries());
    try {
      const res = await AdminApi.put('/settings', payload);
      Toast.success(res.message || 'Podešavanja su sačuvana.');
    } catch (err) {
      Toast.error(err.message || 'Greška pri čuvanju podešavanja.');
    }
  });

  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    passwordForm.querySelectorAll('.field-error').forEach((el) => { el.textContent = ''; el.classList.remove('is-visible'); });

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;

    try {
      const res = await AdminApi.post('/auth/change-password', { currentPassword, newPassword });
      Toast.success(res.message || 'Lozinka je promijenjena.');
      passwordForm.reset();
    } catch (err) {
      if (err.errors) {
        err.errors.forEach(({ field, message }) => {
          const el = passwordForm.querySelector(`[data-error-for="${field}"]`);
          if (el) { el.textContent = message; el.classList.add('is-visible'); }
        });
      }
      Toast.error(err.message || 'Greška pri promjeni lozinke.');
    }
  });
})();
