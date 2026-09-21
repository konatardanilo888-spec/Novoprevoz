'use strict';

/**
 * Učitava javna podešavanja sajta (GET /api/settings) i popunjava sve
 * elemente sa atributom data-setting="kljuc" njihovim tekstualnim
 * sadržajem. Koristi se u footeru i na kontakt stranici, tako da
 * promjena podešavanja u admin panelu odmah utiče na cijeli javni sajt.
 */
(function () {
  async function loadSettings() {
    const targets = document.querySelectorAll('[data-setting]');
    if (!targets.length) return;
    try {
      const data = await Api.get('/settings');
      targets.forEach((el) => {
        const key = el.getAttribute('data-setting');
        if (data.settings[key] !== undefined) {
          el.textContent = data.settings[key];
        }
      });
    } catch {
      // Podešavanja se učitavaju "best effort" - ako API nije dostupan,
      // ostaju podrazumijevane vrijednosti već upisane u HTML.
    }
  }
  document.addEventListener('DOMContentLoaded', loadSettings);
})();
