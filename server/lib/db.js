'use strict';
/*
 * Sloj baze podataka. Koristi ugrađeni node:sqlite (Node 22+), bez spoljašnjih paketa.
 * Fajl baze: data/orub.sqlite
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, 'orub.sqlite');

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  admin_user_id INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  icon TEXT,
  title_me TEXT, title_en TEXT,
  desc_me TEXT, desc_en TEXT,
  sort_order INTEGER DEFAULT 0,
  visible INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS advantages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  icon TEXT,
  title_me TEXT, title_en TEXT,
  desc_me TEXT, desc_en TEXT,
  sort_order INTEGER DEFAULT 0,
  visible INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS process_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title_me TEXT, title_en TEXT,
  desc_me TEXT, desc_en TEXT,
  sort_order INTEGER DEFAULT 0,
  visible INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS portfolio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  image TEXT,
  link TEXT,
  desc_me TEXT, desc_en TEXT,
  sort_order INTEGER DEFAULT 0,
  visible INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name_me TEXT, name_en TEXT,
  price_me TEXT, price_en TEXT,
  price_note_me TEXT, price_note_en TEXT,
  features_me TEXT, features_en TEXT,
  highlighted INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  visible INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS testimonials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  role TEXT,
  avatar TEXT,
  text_me TEXT, text_en TEXT,
  sort_order INTEGER DEFAULT 0,
  visible INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS faq (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_me TEXT, question_en TEXT,
  answer_me TEXT, answer_en TEXT,
  sort_order INTEGER DEFAULT 0,
  visible INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT, email TEXT, phone TEXT,
  site_type TEXT, budget TEXT, message TEXT,
  created_at TEXT NOT NULL,
  is_read INTEGER DEFAULT 0
);
`;

db.exec(SCHEMA);

// ---------------------------------------------------------------------------
// Migracija: stariji instalacioni fajlovi baze imaju kolonu "price" (jedan
// jezik) umjesto "price_me"/"price_en". Ako se otkrije stara šema, dodajemo
// nove kolone i prekopiramo postojeće vrijednosti (sa osnovnim prevodom
// najčešćih fraza), tako da se postojeći paketi ne izgube.
// ---------------------------------------------------------------------------
function migratePackagePriceColumn() {
  const cols = db.prepare("PRAGMA table_info(packages)").all().map(c => c.name);
  if (cols.includes('price_me')) return; // već migrirano
  if (!cols.includes('price')) return; // svježa baza, nema šta da se migrira

  db.exec('ALTER TABLE packages ADD COLUMN price_me TEXT');
  db.exec('ALTER TABLE packages ADD COLUMN price_en TEXT');

  const translateEn = (val) => {
    if (!val) return val;
    const v = val.trim();
    if (/^po dogovoru$/i.test(v)) return 'By arrangement';
    const odMatch = /^od\s+(.+)$/i.exec(v);
    if (odMatch) return `from ${odMatch[1]}`;
    return v; // nepoznat format — kopiraj isto, admin može ručno prevesti
  };

  const rows = db.prepare('SELECT id, price FROM packages').all();
  const update = db.prepare('UPDATE packages SET price_me = ?, price_en = ? WHERE id = ?');
  rows.forEach(r => {
    update.run(r.price, translateEn(r.price), r.id);
  });
}
migratePackagePriceColumn();

function hashPassword(password, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const check = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
}

const DEFAULT_SETTINGS = {
  site_name: 'ORUB DIGITAL',
  default_lang: 'me',
  hero_title_me: 'Sajt koji vam donosi klijente, ne samo izgled.',
  hero_title_en: 'A website that brings you clients, not just looks.',
  hero_subtitle_me: 'Izrađujemo brze, moderne i responzivne sajtove za mala i srednja preduzeća, ugostitelje, turističke objekte i frilensere.',
  hero_subtitle_en: 'We build fast, modern and responsive websites for small and medium businesses, hospitality venues, tourist properties and freelancers.',
  hero_cta_me: 'Zatraži ponudu',
  hero_cta_en: 'Request a quote',
  services_intro_me: 'Sve što vam je potrebno da vaš biznis izgleda profesionalno na internetu.',
  services_intro_en: 'Everything you need to make your business look professional online.',
  why_intro_me: 'Zašto klijenti biraju ORUB DIGITAL.',
  why_intro_en: 'Why clients choose ORUB DIGITAL.',
  process_intro_me: 'Jasan proces od prve ideje do lansiranja sajta.',
  process_intro_en: 'A clear process from the first idea to launch.',
  portfolio_intro_me: 'Izbor naših posljednjih radova.',
  portfolio_intro_en: 'A selection of our recent work.',
  packages_intro_me: 'Transparentne cijene, bez skrivenih troškova.',
  packages_intro_en: 'Transparent pricing, no hidden costs.',
  testimonials_intro_me: 'Šta kažu naši klijenti.',
  testimonials_intro_en: 'What our clients say.',
  faq_intro_me: 'Odgovori na najčešća pitanja.',
  faq_intro_en: 'Answers to the most common questions.',
  contact_intro_me: 'Popunite formu i javljamo se u najkraćem roku.',
  contact_intro_en: 'Fill in the form and we will get back to you shortly.',
  email: 'info@orubdigital.com',
  phone: '+382 67 000 000',
  whatsapp: '38267000000',
  viber: '38267000000',
  city: 'Podgorica',
  country: 'Crna Gora',
  address_extra: '',
  social_instagram: '',
  social_facebook: '',
  social_linkedin: '',
  meta_description_me: 'ORUB DIGITAL — izrada sajtova, web prodavnica i redizajn za mala i srednja preduzeća, ugostitelje i frilensere. Zatražite ponudu danas.',
  meta_description_en: 'ORUB DIGITAL — website design, online stores, and redesign for small businesses, hospitality and freelancers. Request a quote today.',
  footer_note_me: 'Izrada sajtova koji rade za vaš biznis.',
  footer_note_en: 'Websites that work for your business.'
};

function seedIfEmpty() {
  const existing = db.prepare('SELECT COUNT(*) AS c FROM settings').get();
  if (existing.c === 0) {
    const stmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
      stmt.run(k, v);
    }
  }

  const adminCount = db.prepare('SELECT COUNT(*) AS c FROM admin_users').get();
  if (adminCount.c === 0) {
    const email = 'admin@orubdigital.com';
    const password = 'OrubDigital2026!';
    db.prepare('INSERT INTO admin_users (email, password_hash, created_at) VALUES (?, ?, ?)')
      .run(email, hashPassword(password), new Date().toISOString());
    console.log('----------------------------------------------------');
    console.log('Kreiran je podrazumijevani admin nalog:');
    console.log('  Email:    ' + email);
    console.log('  Lozinka:  ' + password);
    console.log('  Promijenite lozinku odmah nakon prve prijave!');
    console.log('----------------------------------------------------');
  }

  const svcCount = db.prepare('SELECT COUNT(*) AS c FROM services').get();
  if (svcCount.c === 0) {
    const services = [
      ['🖥️', 'Izrada sajtova za firme', 'Business Websites', 'Profesionalni sajtovi koji predstavljaju vaš biznis na najbolji način.', 'Professional websites that present your business in the best way.'],
      ['🛒', 'Web prodavnice', 'Online Stores', 'Online prodavnice sa jednostavnim upravljanjem proizvodima i porudžbinama.', 'Online stores with simple product and order management.'],
      ['🎨', 'Portfolio sajtovi', 'Portfolio Websites', 'Elegantni sajtovi za predstavljanje vašeg rada i usluga.', 'Elegant websites to showcase your work and services.'],
      ['🔄', 'Redizajn postojećih sajtova', 'Website Redesign', 'Osvježavamo stari sajt u moderno, brzo i responzivno rješenje.', 'We refresh your old website into a modern, fast, responsive solution.'],
      ['📈', 'SEO optimizacija', 'SEO Optimization', 'Bolja vidljivost na Google pretrazi i više organskih posjeta.', 'Better visibility on Google search and more organic visits.'],
      ['🛠️', 'Održavanje sajtova', 'Website Maintenance', 'Redovno ažuriranje, sigurnosne provjere i tehnička podrška.', 'Regular updates, security checks and technical support.']
    ];
    const stmt = db.prepare('INSERT INTO services (icon, title_me, title_en, desc_me, desc_en, sort_order, visible) VALUES (?,?,?,?,?,?,1)');
    services.forEach((s, i) => stmt.run(s[0], s[1], s[2], s[3], s[4], i));
  }

  const advCount = db.prepare('SELECT COUNT(*) AS c FROM advantages').get();
  if (advCount.c === 0) {
    const items = [
      ['⚡', 'Brza isporuka', 'Fast Delivery', 'Vaš sajt je spreman u kratkom roku, bez nepotrebnog čekanja.', 'Your website is ready quickly, without unnecessary waiting.'],
      ['📱', 'Responzivan dizajn', 'Responsive Design', 'Savršeno izgleda na telefonu, tabletu i računaru.', 'Looks perfect on phone, tablet and desktop.'],
      ['🔍', 'SEO od starta', 'SEO From Day One', 'Sajt se gradi tako da ga Google lakše pronalazi.', 'Built so Google can find it more easily from day one.'],
      ['🤝', 'Podrška poslije isporuke', 'Support After Launch', 'Tu smo i nakon lansiranja, za sve izmjene i pitanja.', 'We are here after launch too, for changes and questions.'],
      ['💶', 'Pristupačne cijene', 'Affordable Pricing', 'Kvalitetan sajt bez nepotrebno visoke cijene.', 'A quality website without an unnecessarily high price.']
    ];
    const stmt = db.prepare('INSERT INTO advantages (icon, title_me, title_en, desc_me, desc_en, sort_order, visible) VALUES (?,?,?,?,?,?,1)');
    items.forEach((s, i) => stmt.run(s[0], s[1], s[2], s[3], s[4], i));
  }

  const procCount = db.prepare('SELECT COUNT(*) AS c FROM process_steps').get();
  if (procCount.c === 0) {
    const items = [
      ['Razgovor i dogovor', 'Consultation', 'Upoznajemo se sa vašim biznisom, ciljevima i idejama za sajt.', 'We learn about your business, goals and ideas for the website.'],
      ['Plan i ponuda', 'Plan & Proposal', 'Predlažemo strukturu sajta, paket usluga i konačnu cijenu.', 'We propose the site structure, service package and final price.'],
      ['Dizajn i izrada', 'Design & Development', 'Kreiramo dizajn i razvijamo sajt prema dogovorenom planu.', 'We create the design and build the website per the agreed plan.'],
      ['Pregled i izmjene', 'Review & Revisions', 'Šaljemo vam sajt na pregled i unosimo željene izmjene.', 'We send the site for review and make the requested changes.'],
      ['Lansiranje', 'Launch', 'Sajt postaje dostupan javnosti i spreman za nove klijente.', 'The website goes live and is ready for new clients.']
    ];
    const stmt = db.prepare('INSERT INTO process_steps (title_me, title_en, desc_me, desc_en, sort_order, visible) VALUES (?,?,?,?,?,1)');
    items.forEach((s, i) => stmt.run(s[0], s[1], s[2], s[3], i));
  }

  const pkgCount = db.prepare('SELECT COUNT(*) AS c FROM packages').get();
  if (pkgCount.c === 0) {
    const items = [
      ['Osnovni', 'Basic', 'od 150€', 'from €150', 'jednokratno', 'one-time',
        'Jednostranični sajt\nOsnovni kontakt podaci\nResponzivan dizajn\nOsnovna SEO podešavanja',
        'One-page website\nBasic contact details\nResponsive design\nBasic SEO setup', 0],
      ['Standardni', 'Standard', 'od 350€', 'from €350', 'jednokratno', 'one-time',
        'Do 5 podstranica\nGalerija / portfolio\nKontakt forma\nSEO optimizacija\nPovezivanje društvenih mreža',
        'Up to 5 subpages\nGallery / portfolio\nContact form\nSEO optimization\nSocial media integration', 1],
      ['Premium', 'Premium', 'Po dogovoru', 'By arrangement', 'zavisno od obima', 'depends on scope',
        'Neograničen broj stranica\nWeb prodavnica / rezervacije\nNapredna SEO strategija\nPrioritetna podrška\nMjesečno održavanje',
        'Unlimited pages\nOnline store / booking\nAdvanced SEO strategy\nPriority support\nMonthly maintenance', 0]
    ];
    const stmt = db.prepare('INSERT INTO packages (name_me, name_en, price_me, price_en, price_note_me, price_note_en, features_me, features_en, highlighted, sort_order, visible) VALUES (?,?,?,?,?,?,?,?,?,?,1)');
    items.forEach((s, i) => stmt.run(s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], s[8], i));
  }

  const testCount = db.prepare('SELECT COUNT(*) AS c FROM testimonials').get();
  if (testCount.c === 0) {
    const items = [
      ['Marko Vujović', 'Vlasnik, Restoran Panorama', 'Sajt je gotov brzo, izgleda odlično i već imamo nove rezervacije preko forme.', 'The website was done fast, looks great, and we already get new reservations through the form.'],
      ['Ivana Radulović', 'Frilenser dizajnerka', 'Konačno imam portfolio koji zaista predstavlja moj rad. Preporučujem!', 'I finally have a portfolio that truly represents my work. Highly recommend!'],
      ['Petar Backović', 'Apartmani Sunce', 'Profesionalan pristup od prve poruke do lansiranja sajta.', 'Professional approach from the first message to the website launch.']
    ];
    const stmt = db.prepare('INSERT INTO testimonials (name, role, text_me, text_en, sort_order, visible) VALUES (?,?,?,?,?,1)');
    items.forEach((s, i) => stmt.run(s[0], s[1], s[2], s[3], i));
  }

  const faqCount = db.prepare('SELECT COUNT(*) AS c FROM faq').get();
  if (faqCount.c === 0) {
    const items = [
      ['Koliko traje izrada sajta?', 'How long does it take to build a website?', 'U zavisnosti od paketa, izrada traje od 5 do 20 radnih dana.', 'Depending on the package, it takes 5 to 20 business days.'],
      ['Da li mogu sam da mijenjam sadržaj sajta?', 'Can I edit the website content myself?', 'Da, svaki sajt dolazi sa admin panelom preko kojeg sami uređujete sadržaj, bez znanja programiranja.', 'Yes, every website comes with an admin panel where you edit content yourself, no coding knowledge required.'],
      ['Da li je cijena fiksna?', 'Is the price fixed?', 'Osnovni i Standardni paket imaju fiksnu cijenu, dok se Premium dogovara prema obimu posla.', 'Basic and Standard packages have a fixed price, while Premium is agreed based on project scope.'],
      ['Da li nudite održavanje poslije lansiranja?', 'Do you offer maintenance after launch?', 'Da, nudimo mjesečne pakete održavanja koji uključuju ažuriranja i tehničku podršku.', 'Yes, we offer monthly maintenance packages including updates and technical support.']
    ];
    const stmt = db.prepare('INSERT INTO faq (question_me, question_en, answer_me, answer_en, sort_order, visible) VALUES (?,?,?,?,?,1)');
    items.forEach((s, i) => stmt.run(s[0], s[1], s[2], s[3], i));
  }

  const portCount = db.prepare('SELECT COUNT(*) AS c FROM portfolio').get();
  if (portCount.c === 0) {
    const items = [
      ['Restoran Panorama', '', '', 'Sajt za restoran sa meniom i online rezervacijama.', 'Restaurant website with menu and online reservations.'],
      ['Apartmani Sunce', '', '', 'Turistički sajt sa galerijom i formom za upit.', 'Tourist website with gallery and inquiry form.'],
      ['Ivana Radulović — Portfolio', '', '', 'Portfolio sajt za frilenser dizajnerku.', 'Portfolio website for a freelance designer.']
    ];
    const stmt = db.prepare('INSERT INTO portfolio (title, image, link, desc_me, desc_en, sort_order, visible) VALUES (?,?,?,?,?,?,1)');
    items.forEach((s, i) => stmt.run(s[0], s[1], s[2], s[3], s[4], i));
  }
}

seedIfEmpty();

module.exports = { db, hashPassword, verifyPassword };
