'use strict';

(function () {
  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('contact-submit-btn');

  function setFieldError(field, message) {
    const errorEl = form.querySelector(`[data-error-for="${field}"]`);
    const inputEl = form.querySelector(`[name="${field}"]`);
    if (errorEl) {
      errorEl.textContent = message || '';
      errorEl.classList.toggle('is-visible', Boolean(message));
    }
    if (inputEl) inputEl.classList.toggle('is-invalid', Boolean(message));
  }

  function clearErrors() {
    ['name', 'email', 'phone', 'message'].forEach((f) => setFieldError(f, ''));
  }

  function validateClientSide(data) {
    let ok = true;
    if (!data.name || data.name.trim().length < 2) {
      setFieldError('name', I18N.t('contact.errorName'));
      ok = false;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailPattern.test(data.email)) {
      setFieldError('email', I18N.t('contact.errorEmail'));
      ok = false;
    }
    if (!data.message || data.message.trim().length < 5) {
      setFieldError('message', I18N.t('contact.errorMessage'));
      ok = false;
    }
    return ok;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const data = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      message: form.message.value.trim(),
    };

    if (!validateClientSide(data)) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner" style="width:16px;height:16px;"></span> ${I18N.t('contact.sending')}`;

    try {
      const res = await Api.post('/contact', data);
      Toast.success(res.message || I18N.t('contact.successDefault'));
      form.reset();
    } catch (err) {
      if (err.errors) {
        err.errors.forEach((e2) => setFieldError(e2.field, e2.message));
      }
      Toast.error(err.message || I18N.t('contact.errorDefault'));
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span class="btn-text">${I18N.t('contact.submit')}</span>`;
    }
  });
})();
