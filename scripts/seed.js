'use strict';

/**
 * Seed skripta - kreira šemu (ako ne postoji), početni admin nalog i
 * demo podatke (stanice, vožnje, obavještenja) za razvoj i testiranje.
 *
 * Pokretanje: npm run seed
 *
 * Skripta je idempotentna za admin nalog i stanice (provjerava da li već
 * postoje po email-u / nazivu+gradu) tako da se može pokretati više puta
 * bez dupliranja. Demo vožnje se ubacuju samo ako tabela trips prazna,
 * da bi se izbjeglo gomilanje istih redova pri ponovnom pokretanju.
 */

const db = require('../server/database');
const config = require('../server/config');
const userModel = require('../server/models/userModel');
const stationModel = require('../server/models/stationModel');
const tripModel = require('../server/models/tripModel');
const notificationModel = require('../server/models/notificationModel');
const settingsModel = require('../server/models/settingsModel');
const { hashPassword } = require('../server/lib/password');

function seedAdmin() {
    const email = config.seedAdmin.email.toLowerCase();
    const existing = userModel.findByEmail(email);
    if (existing) {
          console.log(`[seed] Admin nalog "${email}" već postoji - preskačem.`);
          return existing;
    }
    const user = userModel.create({
          name: config.seedAdmin.name,
          email,
          passwordHash: hashPassword(config.seedAdmin.password),
          role: 'superadmin',
    });
    console.log(`[seed] Kreiran superadmin nalog: ${email}`);
    return user;
}

function findStationByNameCity(name, city) {
    return db.prepare('SELECT * FROM stations WHERE name = ? AND city = ?').get(name, city);
}

function seedStations() {
    const demoStations = [
      { name: 'Glavna autobuska stanica Podgorica', city: 'Podgorica', address: 'Trg golootočkih žrtava bb', phone: '+382 20 620 430', description: 'Centralna autobuska stanica u Podgorici.' },
      { name: 'Autobuska stanica Budva', city: 'Budva', address: 'Popa Jola Zeca bb', phone: '+382 33 456 000', description: 'Autobuska stanica u centru Budve, blizu Starog grada.' },
      { name: 'Autobuska stanica Bar', city: 'Bar', address: 'Bulevar Revolucije bb', phone: '+382 30 311 220', description: 'Glavna stanica u Baru, blizu luke.' },
      { name: 'Autobuska stanica Nikšić', city: 'Nikšić', address: 'Njegoševa bb', phone: '+382 40 213 060', description: 'Autobuska stanica u Nikšiću.' },
      { name: 'Autobuska stanica Herceg Novi', city: 'Herceg Novi', address: 'Jadranski put bb', phone: '+382 31 321 225', description: 'Stanica u Herceg Novom, na Jadranskom putu.' },
      { name: 'Autobuska stanica Kotor', city: 'Kotor', address: 'Škaljari bb', phone: '+382 32 325 809', description: 'Stanica u blizini Starog grada Kotor.' },
        ];

  const created = {};
    for (const s of demoStations) {
          let station = findStationByNameCity(s.name, s.city);
          if (!station) {
                  station = stationModel.create(s);
                  console.log(`[seed] Dodata stanica: ${s.name}`);
          }
          created[s.city] = station;
    }
    return created;
}

function seedTrips(stations) {
    const existingCount = tripModel.findAll().length;
    if (existingCount > 0) {
          console.log(`[seed] Već postoji ${existingCount} vožnji u bazi - preskačem demo vožnje.`);
          return;
    }

  const today = new Date();
    const dateStr = (offsetDays) => {
          const d = new Date(today);
          d.setDate(d.getDate() + offsetDays);
          return d.toISOString().slice(0, 10);
    };

  const demoTrips = [
    { route_number: 'PG-BD-101', from: 'Podgorica', to: 'Budva', departure_time: '06:30', arrival_time: '07:25', price: 5.0, bus_type: 'Standardni', offsetDays: 0 },
    { route_number: 'PG-BD-102', from: 'Podgorica', to: 'Budva', departure_time: '08:00', arrival_time: '08:55', price: 5.0, bus_type: 'Standardni', offsetDays: 0 },
    { route_number: 'PG-BD-103', from: 'Podgorica', to: 'Budva', departure_time: '15:30', arrival_time: '16:25', price: 5.0, bus_type: 'Premium', offsetDays: 1 },
    { route_number: 'PG-BAR-201', from: 'Podgorica', to: 'Bar', departure_time: '07:00', arrival_time: '08:15', price: 6.0, bus_type: 'Standardni', offsetDays: 0 },
    { route_number: 'PG-BAR-202', from: 'Podgorica', to: 'Bar', departure_time: '13:00', arrival_time: '14:15', price: 6.0, bus_type: 'Standardni', offsetDays: 1 },
    { route_number: 'PG-NK-301', from: 'Podgorica', to: 'Nikšić', departure_time: '09:00', arrival_time: '10:00', price: 6.0, bus_type: 'Standardni', offsetDays: 0 },
    { route_number: 'PG-NK-302', from: 'Podgorica', to: 'Nikšić', departure_time: '18:00', arrival_time: '19:00', price: 6.0, bus_type: 'Standardni', offsetDays: 2 },
    { route_number: 'BD-PG-104', from: 'Budva', to: 'Podgorica', departure_time: '09:30', arrival_time: '10:25', price: 5.0, bus_type: 'Standardni', offsetDays: 0 },
    { route_number: 'BAR-PG-203', from: 'Bar', to: 'Podgorica', departure_time: '16:00', arrival_time: '17:15', price: 6.0, bus_type: 'Standardni', offsetDays: 0 },
    { route_number: 'PG-HN-401', from: 'Podgorica', to: 'Herceg Novi', departure_time: '10:00', arrival_time: '11:45', price: 8.0, bus_type: 'Premium', offsetDays: 1 },
    { route_number: 'PG-KO-501', from: 'Podgorica', to: 'Kotor', departure_time: '11:00', arrival_time: '12:20', price: 7.0, bus_type: 'Standardni', offsetDays: 0 },
    { route_number: 'PG-BD-105', from: 'Podgorica', to: 'Budva', departure_time: '20:00', arrival_time: '20:55', price: 5.0, bus_type: 'Standardni', offsetDays: -1, status: 'ZAVRSENA' },
    { route_number: 'PG-BAR-204', from: 'Podgorica', to: 'Bar', departure_time: '17:30', arrival_time: '18:45', price: 6.0, bus_type: 'Standardni', offsetDays: 1, status: 'OTKAZANA', notes: 'Vožnja otkazana zbog tehničkih razloga.' },
      ];

  for (const t of demoTrips) {
        const fromStation = stations[t.from];
        const toStation = stations[t.to];
        if (!fromStation || !toStation) continue;
        tripModel.create({
                route_number: t.route_number,
                from_station_id: fromStation.id,
                to_station_id: toStation.id,
                departure_date: dateStr(t.offsetDays),
                departure_time: t.departure_time,
                arrival_time: t.arrival_time,
                price: t.price,
                bus_type: t.bus_type,
                status: t.status || 'AKTIVNA',
                notes: t.notes || null,
        });
  }
    console.log(`[seed] Dodato ${demoTrips.length} demo vožnji.`);
}

function seedNotifications() {
    const existing = notificationModel.findAll();
    if (existing.length > 0) {
          console.log('[seed] Obavještenja već postoje - preskačem.');
          return;
    }
    const demoNotifications = [
      {
              title: 'Promjena voznog reda',
              content: 'Od 1. oktobra 2026. na snazi je novi ljetnji vozni red za relaciju Podgorica - Budva.',
              title_en: 'Timetable change',
              content_en: 'Starting October 1, 2026, a new summer timetable is in effect for the Podgorica - Budva route.',
              type: 'INFO',
      },
      {
              title: 'Privremena izmjena polazaka',
              content: 'Zbog radova na putu, polasci ka Kotoru u periodu 20-25.9 kasne do 15 minuta.',
              title_en: 'Temporary departure change',
              content_en: 'Due to roadworks, departures to Kotor may be delayed by up to 15 minutes between Sep 20-25.',
              type: 'UPOZORENJE',
      },
      {
              title: 'Važno obavještenje za putnike',
              content: 'Molimo putnike da na autobusku stanicu dođu najmanje 15 minuta prije polaska radi preuzimanja karata.',
              title_en: 'Important notice for passengers',
              content_en: 'Please arrive at the bus station at least 15 minutes before departure to collect your tickets.',
              type: 'VAZNO',
      },
        ];
    for (const n of demoNotifications) {
          notificationModel.create({ ...n, is_active: true });
    }
    console.log(`[seed] Dodato ${demoNotifications.length} demo obavještenja.`);
}

function seedSettings() {
    settingsModel.setMany({
          site_name: 'NOVOPREVOZ',
          contact_phone: '+382 20 123 456',
          contact_email: 'info@novoprevoz.me',
          contact_address: 'Bulevar Svetog Petra Cetinjskog bb, 81000 Podgorica, Crna Gora',
          working_hours: 'Ponedjeljak - Nedjelja: 06:00 - 22:00',
    });
    console.log('[seed] Podešavanja postavljena na podrazumijevane vrijednosti (ako nisu već izmijenjena).');
}

function run() {
    console.log('=== NOVOPREVOZ - Seed baze podataka ===\n');
    seedAdmin();
    const stations = seedStations();
    seedTrips(stations);
    seedNotifications();
    seedSettings();
    console.log('\n=== Seed završen uspješno. ===');
    console.log(`\nDEMO ADMIN NALOG (samo za razvoj):`);
    console.log(`  Email:    ${config.seedAdmin.email}`);
    console.log(`  Lozinka:  ${config.seedAdmin.password}`);
    console.log('\nOBAVEZNO promijenite ovu lozinku prije bilo kakvog produkcijskog korišćenja.\n');
}

run();
