'use strict';

(async function () {
    const fromSelect = document.getElementById('from-select');
    const toSelect = document.getElementById('to-select');
    const dateInput = document.getElementById('date-input');
    const form = document.getElementById('hero-search-form');
    const errorEl = document.getElementById('search-error');

   // Datum ne može biti u prošlosti.
   const today = new Date().toISOString().slice(0, 10);
    dateInput.min = today;
    dateInput.value = today;

   // Ako su parametri već u URL-u (npr. korisnik se vratio nazad), popuni ih.
   const params = new URLSearchParams(window.location.search);

   try {
         await StationsSelect.populate([fromSelect, toSelect]);
         if (params.get('from')) fromSelect.value = params.get('from');
         if (params.get('to')) toSelect.value = params.get('to');
   } catch {
         Toast.error(I18N.t('toast.stationsError'));
   }

   form.addEventListener('submit', (e) => {
         e.preventDefault();
         const from = fromSelect.value;
         const to = toSelect.value;
         const date = dateInput.value;

                             if (!from || !to || !date) {
                                     errorEl.textContent = I18N.t('search.errorFill');
                                     errorEl.classList.add('is-visible');
                                     return;
                             }
         if (from === to) {
                 errorEl.textContent = I18N.t('search.errorSame');
                 errorEl.classList.add('is-visible');
                 return;
         }
         errorEl.classList.remove('is-visible');
         const query = new URLSearchParams({ from, to, date }).toString();
         window.location.href = `/polasci?${query}`;
   });

   // ---------- Obavještenja ----------
   (async function loadNotices() {
         const section = document.getElementById('notice-section');
         const list = document.getElementById('notice-list');
         try {
                 const data = await Api.get('/notifications?active=true');
                 if (!data.notifications.length) return;
                 section.hidden = false;
                 const isEn = window.I18N && I18N.lang === 'en';
                 list.innerHTML = data.notifications
                   .map((n) => {
                               const title = (isEn && n.title_en) ? n.title_en : n.title;
                               const content = (isEn && n.content_en) ? n.content_en : n.content;
                               return `
                                       <div class="notice-item type-${n.type}">
                                                 <strong>${TripRenderEscape(title)}:</strong>&nbsp;${TripRenderEscape(content)}
                                                         </div>`;
                   })
                   .join('');
         } catch {
                 // Ako obavještenja nisu dostupna, jednostavno ih ne prikazujemo.
         }
   })();

   function TripRenderEscape(value) {
         const div = document.createElement('div');
         div.textContent = value;
         return div.innerHTML;
   }

   // ---------- Popularne destinacije ----------
   const POPULAR_ROUTES = [
     { from: 'Podgorica', to: 'Budva' },
     { from: 'Podgorica', to: 'Bar' },
     { from: 'Podgorica', to: 'Nikšić' },
     { from: 'Budva', to: 'Podgorica' },
     { from: 'Bar', to: 'Podgorica' },
     { from: 'Podgorica', to: 'Kotor' },
       ];

   (async function loadDestinations() {
         const grid = document.getElementById('destinations-grid');
         grid.innerHTML = POPULAR_ROUTES.map(() => `<div class="card destination-card skeleton" style="height:120px;"></div>`).join('');

        try {
                const results = await Promise.all(
                          POPULAR_ROUTES.map((route) => Api.get(`/trips?from=${encodeURIComponent(route.from)}&to=${encodeURIComponent(route.to)}`))
                        );

           const cards = [];
                POPULAR_ROUTES.forEach((route, i) => {
                          const trips = results[i].trips.filter((t) => t.status !== 'OTKAZANA');
                          if (!trips.length) return;
                          const minPrice = Math.min(...trips.map((t) => t.price));
                          cards.push(`
                                    <a class="card destination-card reveal is-visible" href="/polasci?from=${encodeURIComponent(route.from)}&to=${encodeURIComponent(route.to)}&date=${today}">
                                                <div class="destination-route">${route.from} <span class="arrow">&rarr;</span> ${route.to}</div>
                                                            <div class="price-from">${I18N.t('destinations.priceFrom')} <strong>${minPrice.toFixed(2)} &euro;</strong></div>
                                                                        <span class="btn btn-outline btn-sm" style="width:fit-content;">${I18N.t('destinations.viewTrips')}</span>
                                                                                  </a>
                                                                                          `);
                });

           grid.innerHTML = cards.length
                  ? cards.join('')
                     : `<p class="text-muted">${I18N.t('destinations.empty')}</p>`;
        } catch {
                grid.innerHTML = `<p class="text-muted">${I18N.t('destinations.error')}</p>`;
        }
   })();
})();
