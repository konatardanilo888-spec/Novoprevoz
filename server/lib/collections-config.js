'use strict';

// Konfiguracija svih "kolekcija" (ponavljajućih sekcija) za admin CRUD.
// field.type: 'text' | 'textarea' | 'image' | 'checkbox'
// field.bilingual: ako je true, polje ima _me i _en varijantu

const COLLECTIONS_CONFIG = {
  services: {
    label: 'Usluge',
    singular: 'uslugu',
    fields: [
      { name: 'icon', label: 'Ikonica (emoji ili kratak simbol)', type: 'text' },
      { name: 'title', label: 'Naziv usluge', type: 'text', bilingual: true },
      { name: 'desc', label: 'Opis', type: 'textarea', bilingual: true }
    ],
    listTitle: row => row.title_me
  },
  advantages: {
    label: 'Zašto ORUB DIGITAL',
    singular: 'prednost',
    fields: [
      { name: 'icon', label: 'Ikonica (emoji ili kratak simbol)', type: 'text' },
      { name: 'title', label: 'Naziv prednosti', type: 'text', bilingual: true },
      { name: 'desc', label: 'Opis', type: 'textarea', bilingual: true }
    ],
    listTitle: row => row.title_me
  },
  process_steps: {
    label: 'Kako radimo',
    singular: 'korak',
    fields: [
      { name: 'title', label: 'Naziv koraka', type: 'text', bilingual: true },
      { name: 'desc', label: 'Opis koraka', type: 'textarea', bilingual: true }
    ],
    listTitle: row => row.title_me
  },
  portfolio: {
    label: 'Portfolio',
    singular: 'projekat',
    fields: [
      { name: 'title', label: 'Naziv projekta', type: 'text' },
      { name: 'image', label: 'Slika projekta', type: 'image' },
      { name: 'link', label: 'Link ka sajtu (opciono)', type: 'text' },
      { name: 'desc', label: 'Kratak opis', type: 'textarea', bilingual: true }
    ],
    listTitle: row => row.title,
    hasImage: true
  },
  packages: {
    label: 'Paketi i cijene',
    singular: 'paket',
    fields: [
      { name: 'name', label: 'Naziv paketa', type: 'text', bilingual: true },
      { name: 'price', label: 'Cijena (npr. "od 150€" ili "Po dogovoru")', type: 'text', bilingual: true },
      { name: 'price_note', label: 'Napomena uz cijenu (npr. "jednokratno")', type: 'text', bilingual: true },
      { name: 'features', label: 'Stavke paketa (svaka u novom redu)', type: 'textarea', bilingual: true },
      { name: 'highlighted', label: 'Istaknut paket (prikazuje se sa oznakom "Najtraženiji")', type: 'checkbox' }
    ],
    listTitle: row => row.name_me
  },
  testimonials: {
    label: 'Utisci klijenata',
    singular: 'utisak',
    fields: [
      { name: 'name', label: 'Ime klijenta', type: 'text' },
      { name: 'role', label: 'Funkcija / firma', type: 'text' },
      { name: 'avatar', label: 'Fotografija (opciono)', type: 'image' },
      { name: 'text', label: 'Tekst utiska', type: 'textarea', bilingual: true }
    ],
    listTitle: row => row.name,
    hasImage: true
  },
  faq: {
    label: 'Česta pitanja',
    singular: 'pitanje',
    fields: [
      { name: 'question', label: 'Pitanje', type: 'text', bilingual: true },
      { name: 'answer', label: 'Odgovor', type: 'textarea', bilingual: true }
    ],
    listTitle: row => row.question_me
  }
};

module.exports = { COLLECTIONS_CONFIG };
