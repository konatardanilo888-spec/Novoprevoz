'use strict';

/**
 * Jednostavan sistem za dva jezika (crnogorski/srpski - podrazumijevano,
 * i engleski) za javni dio sajta.
 *
 * Kako radi:
 * 1. Prevod statičkog teksta: elementi u HTML-u sa atributom
 *    data-i18n="kljuc" dobijaju textContent = I18N.t('kljuc').
 *    Elementi sa data-i18n-placeholder="kljuc" dobijaju placeholder atribut.
 * 2. Prevod dinamičkog teksta (generisanog JavaScript-om, npr. kartice
 *    vožnji): stranice pozivaju I18N.t('kljuc') direktno u svom kodu.
 * 3. Izabrani jezik se pamti u localStorage, a promjena jezika ponovo
 *    učitava stranicu (najjednostavniji i najpouzdaniji način da se i
 *    statički i dinamički - iz API-ja učitani - sadržaj ispravno prevede).
 */
window.I18N = (() => {
  const STORAGE_KEY = 'novoprevoz_lang';
  const DEFAULT_LANG = 'sr';

  const DICT = {
    sr: {
      // ---------- Zajedničko: header/footer ----------
      'skip.content': 'Preskoči na sadržaj',
      'nav.home': 'Početna',
      'nav.timetable': 'Vozni red',
      'nav.departures': 'Polasci',
      'nav.about': 'O nama',
      'nav.contact': 'Kontakt',
      'nav.findTrip': 'Pronađi vožnju',
      'nav.openMenu': 'Otvori meni',
      'footer.tagline': 'Pouzdan i moderan autobuski prevoz širom Crne Gore. Putujte jednostavno, putujte sa nama.',
      'footer.taglineShort': 'Pouzdan i moderan autobuski prevoz širom Crne Gore.',
      'footer.navTitle': 'Navigacija',
      'footer.supportTitle': 'Podrška',
      'footer.contactTitle': 'Kontakt',
      'footer.contactUs': 'Kontaktirajte nas',
      'footer.aboutCompany': 'O kompaniji',
      'footer.adminLogin': 'Admin prijava',
      'footer.rights': 'Sva prava zadržana.',
      'footer.designedFor': 'Dizajnirano za putnike širom Crne Gore.',

      // ---------- Naslovi taba u pregledaču ----------
      'page.title.home': 'NOVOPREVOZ - Putujte jednostavno širom Crne Gore',
      'page.title.timetable': 'Vozni red - NOVOPREVOZ',
      'page.title.departures': 'Polasci - Pretraga vožnji - NOVOPREVOZ',
      'page.title.tripDetail': 'Detalji vožnje - NOVOPREVOZ',
      'page.title.about': 'O nama - NOVOPREVOZ',
      'page.title.contact': 'Kontakt - NOVOPREVOZ',

      // ---------- Početna ----------
      'hero.title': 'Putujte jednostavno. Putujte sa NOVOPREVOZOM.',
      'hero.subtitle': 'Pronađite svoj polazak brzo i jednostavno.',
      'hero.labelFrom': 'Odakle',
      'hero.labelTo': 'Dokle',
      'hero.labelDate': 'Datum',
      'hero.searchBtn': 'PRETRAŽI VOŽNJE',
      'hero.loadingStations': 'Učitavanje stanica...',
      'stations.select': 'Izaberi stanicu',
      'stations.selectAll': 'Svi gradovi',
      'stations.loadError': 'Greška pri učitavanju stanica',
      'search.errorFill': 'Molimo popunite polazište, odredište i datum.',
      'search.errorSame': 'Polazište i odredište moraju biti različiti.',
      'toast.stationsError': 'Nije moguće učitati listu stanica. Provjerite konekciju.',
      'destinations.eyebrow': 'Najtraženije relacije',
      'destinations.title': 'Popularne destinacije',
      'destinations.subtitle': 'Izaberite jednu od najčešće traženih relacija i odmah pogledajte dostupne polaske.',
      'destinations.priceFrom': 'Cijena od',
      'destinations.viewTrips': 'Pogledaj polaske',
      'destinations.empty': 'Trenutno nema dostupnih popularnih relacija.',
      'destinations.error': 'Nije moguće učitati popularne destinacije.',
      'why.eyebrow': 'Naša prednost',
      'why.title': 'Zašto NOVOPREVOZ',
      'why.subtitle': 'Iza svake vožnje stoji pouzdan sistem i tim posvećen udobnosti naših putnika.',
      'why.card1.title': 'Pouzdani polasci',
      'why.card1.text': 'Redovni i tačni polasci na svim linijama, svaki dan u godini.',
      'why.card2.title': 'Jednostavna pretraga',
      'why.card2.text': 'Pronađite polazak za nekoliko sekundi - bez komplikovanih koraka.',
      'why.card3.title': 'Moderan vozni red',
      'why.card3.text': 'Vozni red se ažurira u realnom vremenu - uvijek vidite tačne podatke.',
      'why.card4.title': 'Podrška putnicima',
      'why.card4.text': 'Naš tim je tu za sva vaša pitanja - prije, tokom i nakon putovanja.',

      // ---------- Vozni red ----------
      'timetable.eyebrow': 'Kompletan pregled',
      'timetable.title': 'Vozni red',
      'timetable.subtitle': 'Pregledajte sve vožnje i filtrirajte po polazištu, odredištu, datumu, vremenu ili statusu.',
      'filters.from': 'Od',
      'filters.to': 'Do',
      'filters.date': 'Datum',
      'filters.time': 'Vrijeme (od)',
      'filters.status': 'Status',
      'filters.allStatuses': 'Svi statusi',
      'filters.submit': 'Filtriraj',
      'loading.timetable': 'Učitavanje voznog reda...',
      'timetable.empty': 'Za odabrane filtere nema dostupnih vožnji.',
      'timetable.loadError': 'Nije moguće učitati vozni red.',
      'table.line': 'Linija',
      'table.departure': 'Polazak',
      'table.arrival': 'Dolazak',
      'table.duration': 'Trajanje',
      'table.price': 'Cijena',
      'table.status': 'Status',
      'card.relation': 'Relacija',

      // ---------- Statusi vožnje (zajedničko) ----------
      'status.AKTIVNA': 'Aktivna',
      'status.OTKAZANA': 'Otkazano',
      'status.ZAVRSENA': 'Završena',
      'trip.line': 'Linija',
      'trip.details': 'Detalji',
      'trip.duration': 'Trajanje',

      // ---------- Polasci ----------
      'search.eyebrow': 'Pretraga vožnji',
      'search.title': 'Polasci',
      'search.subtitle': 'Izaberite relaciju i datum da pronađete dostupne polaske.',
      'search.submit': 'PRETRAŽI VOŽNJE',
      'search.loading': 'Pretraga vožnji...',
      'search.errorPrefix': 'Greška pri pretrazi:',
      'search.emptyResult': 'Za odabranu relaciju i datum nema dostupnih vožnji.',
      'search.initialPrompt': 'Izaberite polazište, odredište i datum da pronađete dostupne polaske.',
      'search.foundOne': 'Pronađena 1 vožnja za relaciju',
      'search.foundMany': 'Pronađeno {n} vožnje za relaciju',

      // ---------- Detalji vožnje ----------
      'back.toSearch': '← Nazad na pretragu',
      'loading.tripDetails': 'Učitavanje detalja vožnje...',
      'trip.notSelectedPrefix': 'Vožnja nije odabrana. Vratite se na',
      'trip.searchLink': 'pretragu',
      'trip.notFound': 'Vožnja nije pronađena.',
      'trip.cancelledBanner': 'OTKAZANO - ova vožnja neće biti realizovana.',
      'detail.fromStation': 'Polazna stanica',
      'detail.toStation': 'Odredišna stanica',
      'detail.date': 'Datum',
      'detail.departureTime': 'Vrijeme polaska',
      'detail.arrivalTime': 'Vrijeme dolaska',
      'detail.duration': 'Trajanje',
      'detail.price': 'Cijena',
      'detail.busType': 'Tip autobusa',
      'detail.status': 'Status',
      'detail.notes': 'Napomena',

      // ---------- O nama ----------
      'about.eyebrow': 'Naša priča',
      'about.title': 'O NOVOPREVOZU',
      'about.p1': 'NOVOPREVOZ je moderna autobuska kompanija koja povezuje gradove širom Crne Gore, iz godine u godinu gradeći povjerenje hiljada putnika koji nam vjeruju svoje svakodnevno putovanje.',
      'about.p2': 'Naša mreža linija pokriva najvažnije relacije - od Podgorice, preko primorskih gradova poput Budve, Bara, Kotora i Herceg Novog, do sjevera zemlje sa Nikšićem. Trudimo se da svaki polazak bude tačan, svaka vožnja udobna, a svaka informacija o voznom redu dostupna u realnom vremenu.',
      'about.mission.title': 'Naša misija',
      'about.mission.text': 'Da svakom putniku obezbijedimo jednostavan, siguran i predvidiv način putovanja - bez stresa i nepotrebnog čekanja.',
      'about.reliability.title': 'Pouzdanost',
      'about.reliability.text': 'Redovno održavan vozni park, provjereni vozači i tačni polasci - svaki dan, na svakoj liniji.',
      'about.values.title': 'Naše vrijednosti',
      'about.values.text': 'Poštovanje prema putniku, transparentnost cijena i vremena, i stalno unaprjeđenje usluge kroz modernu tehnologiju.',
      'about.cta.title': 'Spremni za sljedeće putovanje?',
      'about.cta.text': 'Pretražite dostupne polaske i pronađite savršenu vožnju za vas.',

      // ---------- Kontakt ----------
      'contact.eyebrow': 'Tu smo za vas',
      'contact.title': 'Kontaktirajte NOVOPREVOZ',
      'contact.subtitle': 'Imate pitanje o vožnji, karti ili saradnji? Javite nam se - odgovaramo u najkraćem roku.',
      'contact.phone': 'Telefon',
      'contact.email': 'Email',
      'contact.address': 'Adresa',
      'contact.hours': 'Radno vrijeme',
      'contact.formTitle': 'Pošaljite poruku',
      'contact.name': 'Ime i prezime',
      'contact.emailLabel': 'Email',
      'contact.phoneOptional': 'Telefon (opciono)',
      'contact.message': 'Poruka',
      'contact.submit': 'POŠALJI',
      'contact.sending': 'Slanje...',
      'contact.note': 'Napomena: automatsko slanje odgovora na email trenutno nije povezano sa email servisom - vaša poruka se čuva i pregledaće je naš tim u administratorskom panelu.',
      'contact.errorName': 'Unesite ime i prezime (bar 2 karaktera).',
      'contact.errorEmail': 'Unesite ispravnu email adresu.',
      'contact.errorMessage': 'Poruka mora imati bar 5 karaktera.',
      'contact.successDefault': 'Poruka je uspješno poslata.',
      'contact.errorDefault': 'Neispravni podaci.',
    },
    en: {
      'skip.content': 'Skip to content',
      'nav.home': 'Home',
      'nav.timetable': 'Timetable',
      'nav.departures': 'Departures',
      'nav.about': 'About',
      'nav.contact': 'Contact',
      'nav.findTrip': 'Find a trip',
      'nav.openMenu': 'Open menu',
      'footer.tagline': 'Reliable, modern bus transport across Montenegro. Travel simply, travel with us.',
      'footer.taglineShort': 'Reliable, modern bus transport across Montenegro.',
      'footer.navTitle': 'Navigation',
      'footer.supportTitle': 'Support',
      'footer.contactTitle': 'Contact',
      'footer.contactUs': 'Contact us',
      'footer.aboutCompany': 'About the company',
      'footer.adminLogin': 'Admin login',
      'footer.rights': 'All rights reserved.',
      'footer.designedFor': 'Designed for passengers across Montenegro.',

      'page.title.home': 'NOVOPREVOZ - Travel simply across Montenegro',
      'page.title.timetable': 'Timetable - NOVOPREVOZ',
      'page.title.departures': 'Departures - Trip search - NOVOPREVOZ',
      'page.title.tripDetail': 'Trip details - NOVOPREVOZ',
      'page.title.about': 'About us - NOVOPREVOZ',
      'page.title.contact': 'Contact - NOVOPREVOZ',

      'hero.title': 'Travel simply. Travel with NOVOPREVOZ.',
      'hero.subtitle': 'Find your departure quickly and easily.',
      'hero.labelFrom': 'From',
      'hero.labelTo': 'To',
      'hero.labelDate': 'Date',
      'hero.searchBtn': 'SEARCH TRIPS',
      'hero.loadingStations': 'Loading stations...',
      'stations.select': 'Select a station',
      'stations.selectAll': 'All cities',
      'stations.loadError': 'Error loading stations',
      'search.errorFill': 'Please fill in the origin, destination and date.',
      'search.errorSame': 'Origin and destination must be different.',
      'toast.stationsError': 'Unable to load the list of stations. Check your connection.',
      'destinations.eyebrow': 'Most popular routes',
      'destinations.title': 'Popular destinations',
      'destinations.subtitle': 'Pick one of the most popular routes and see available departures right away.',
      'destinations.priceFrom': 'Price from',
      'destinations.viewTrips': 'View departures',
      'destinations.empty': 'No popular routes available right now.',
      'destinations.error': 'Unable to load popular destinations.',
      'why.eyebrow': 'Our advantage',
      'why.title': 'Why NOVOPREVOZ',
      'why.subtitle': 'Behind every trip is a reliable system and a team dedicated to passenger comfort.',
      'why.card1.title': 'Reliable departures',
      'why.card1.text': 'Regular, on-time departures on every route, every day of the year.',
      'why.card2.title': 'Simple search',
      'why.card2.text': 'Find a departure in seconds - no complicated steps.',
      'why.card3.title': 'Modern timetable',
      'why.card3.text': 'The timetable updates in real time - you always see accurate data.',
      'why.card4.title': 'Passenger support',
      'why.card4.text': 'Our team is here for all your questions - before, during and after your trip.',

      'timetable.eyebrow': 'Full overview',
      'timetable.title': 'Timetable',
      'timetable.subtitle': 'Browse all trips and filter by origin, destination, date, time or status.',
      'filters.from': 'From',
      'filters.to': 'To',
      'filters.date': 'Date',
      'filters.time': 'Time (from)',
      'filters.status': 'Status',
      'filters.allStatuses': 'All statuses',
      'filters.submit': 'Filter',
      'loading.timetable': 'Loading timetable...',
      'timetable.empty': 'No trips available for the selected filters.',
      'timetable.loadError': 'Unable to load the timetable.',
      'table.line': 'Line',
      'table.departure': 'Departure',
      'table.arrival': 'Arrival',
      'table.duration': 'Duration',
      'table.price': 'Price',
      'table.status': 'Status',
      'card.relation': 'Route',

      'status.AKTIVNA': 'Active',
      'status.OTKAZANA': 'Cancelled',
      'status.ZAVRSENA': 'Finished',
      'trip.line': 'Line',
      'trip.details': 'Details',
      'trip.duration': 'Duration',

      'search.eyebrow': 'Trip search',
      'search.title': 'Departures',
      'search.subtitle': 'Choose a route and date to find available departures.',
      'search.submit': 'SEARCH TRIPS',
      'search.loading': 'Searching trips...',
      'search.errorPrefix': 'Search error:',
      'search.emptyResult': 'No trips available for the selected route and date.',
      'search.initialPrompt': 'Choose an origin, destination and date to find available departures.',
      'search.foundOne': 'Found 1 trip for the route',
      'search.foundMany': 'Found {n} trips for the route',

      'back.toSearch': '← Back to search',
      'loading.tripDetails': 'Loading trip details...',
      'trip.notSelectedPrefix': 'No trip selected. Go back to',
      'trip.searchLink': 'search',
      'trip.notFound': 'Trip not found.',
      'trip.cancelledBanner': 'CANCELLED - this trip will not run.',
      'detail.fromStation': 'Departure station',
      'detail.toStation': 'Arrival station',
      'detail.date': 'Date',
      'detail.departureTime': 'Departure time',
      'detail.arrivalTime': 'Arrival time',
      'detail.duration': 'Duration',
      'detail.price': 'Price',
      'detail.busType': 'Bus type',
      'detail.status': 'Status',
      'detail.notes': 'Note',

      'about.eyebrow': 'Our story',
      'about.title': 'ABOUT NOVOPREVOZ',
      'about.p1': 'NOVOPREVOZ is a modern bus company connecting cities across Montenegro, year after year building the trust of thousands of passengers who rely on us for their daily travel.',
      'about.p2': 'Our network covers the most important routes - from Podgorica, through coastal towns like Budva, Bar, Kotor and Herceg Novi, to the north of the country with Nikšić. We strive to make every departure on time, every ride comfortable, and every timetable update available in real time.',
      'about.mission.title': 'Our mission',
      'about.mission.text': 'To give every passenger a simple, safe and predictable way to travel - without stress or unnecessary waiting.',
      'about.reliability.title': 'Reliability',
      'about.reliability.text': 'A well-maintained fleet, experienced drivers and on-time departures - every day, on every route.',
      'about.values.title': 'Our values',
      'about.values.text': 'Respect for passengers, transparent prices and schedules, and continuous improvement of our service through modern technology.',
      'about.cta.title': 'Ready for your next trip?',
      'about.cta.text': 'Search available departures and find the perfect trip for you.',

      'contact.eyebrow': "We're here for you",
      'contact.title': 'Contact NOVOPREVOZ',
      'contact.subtitle': 'Have a question about a ride, a ticket or a partnership? Get in touch - we reply as soon as possible.',
      'contact.phone': 'Phone',
      'contact.email': 'Email',
      'contact.address': 'Address',
      'contact.hours': 'Working hours',
      'contact.formTitle': 'Send a message',
      'contact.name': 'Full name',
      'contact.emailLabel': 'Email',
      'contact.phoneOptional': 'Phone (optional)',
      'contact.message': 'Message',
      'contact.submit': 'SEND',
      'contact.sending': 'Sending...',
      'contact.note': "Note: automatic email replies aren't connected to an email service yet - your message is saved and will be reviewed by our team in the admin panel.",
      'contact.errorName': 'Enter your full name (at least 2 characters).',
      'contact.errorEmail': 'Enter a valid email address.',
      'contact.errorMessage': 'The message must be at least 5 characters long.',
      'contact.successDefault': 'Your message was sent successfully.',
      'contact.errorDefault': 'Invalid data.',
    },
  };

  function getLang() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && DICT[stored]) return stored;
    } catch {
      // localStorage može biti nedostupan (privatni mod) - koristi podrazumijevani jezik.
    }
    return DEFAULT_LANG;
  }

  let currentLang = getLang();

  function t(key, vars) {
    let str = (DICT[currentLang] && DICT[currentLang][key]) || DICT[DEFAULT_LANG][key] || key;
    if (vars) {
      Object.keys(vars).forEach((k) => {
        str = str.replace(`{${k}}`, vars[k]);
      });
    }
    return str;
  }

  function applyStaticTranslations() {
    document.documentElement.lang = currentLang === 'en' ? 'en' : 'sr-ME';
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria-label')));
    });
  }

  function setLang(lang) {
    if (!DICT[lang] || lang === currentLang) return;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Ignoriši ako localStorage nije dostupan.
    }
    // Ponovno učitavanje stranice je najjednostavniji i najpouzdaniji način
    // da se i statički i dinamički (iz API-ja učitani) sadržaj ispravno
    // prevede - izbjegava se dupliranje logike za ponovno renderovanje.
    window.location.reload();
  }

  function buildSwitcher() {
    const wrap = document.createElement('div');
    wrap.className = 'lang-switch';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Izbor jezika / Language');
    wrap.innerHTML = `
      <button type="button" class="lang-btn" data-lang="sr">ME</button>
      <button type="button" class="lang-btn" data-lang="en">EN</button>
    `;
    wrap.querySelectorAll('.lang-btn').forEach((btn) => {
      if (btn.getAttribute('data-lang') === currentLang) btn.classList.add('is-active');
      btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang')));
    });
    return wrap;
  }

  function mountSwitcher() {
    // Desktop header
    document.querySelectorAll('.header-actions').forEach((actions) => {
      if (actions.querySelector('.lang-switch')) return;
      const hamburger = actions.querySelector('.hamburger');
      const switcher = buildSwitcher();
      if (hamburger) actions.insertBefore(switcher, hamburger);
      else actions.appendChild(switcher);
    });
    // Mobilni meni - dodaj na dno, samo ako mobile-nav postoji.
    document.querySelectorAll('.mobile-nav').forEach((nav) => {
      if (nav.querySelector('.lang-switch')) return;
      const switcher = buildSwitcher();
      switcher.classList.add('lang-switch-mobile');
      nav.appendChild(switcher);
    });
  }

  function init() {
    applyStaticTranslations();
    mountSwitcher();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { t, setLang, applyStaticTranslations, get lang() { return currentLang; } };
})();
