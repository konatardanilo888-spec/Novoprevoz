'use strict';

/**
 * Integracioni testovi za NOVOPREVOZ REST API.
 * Pokreće se stvarna instanca servera na izolovanoj test bazi podataka
 * (posebna .sqlite datoteka, obrisana prije i poslije testova) i testovi
 * gađaju API preko pravog HTTP-a (fetch), baš kao što bi to radio
 * frontend ili spoljni klijent.
 *
 * Pokretanje: npm test  (ili: node --test tests/)
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const TEST_DB_PATH = path.join(__dirname, '..', 'database', 'test.sqlite');
const TEST_PORT = 4123;

// Očisti eventualnu staru test bazu prije podešavanja okruženja.
for (const suffix of ['', '-wal', '-shm']) {
  const p = TEST_DB_PATH + suffix;
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

process.env.NODE_ENV = 'test';
process.env.PORT = String(TEST_PORT);
process.env.DATABASE_PATH = path.relative(path.join(__dirname, '..'), TEST_DB_PATH);
process.env.JWT_SECRET = 'test-secret-key-not-for-production-use-only-testing';
process.env.SEED_ADMIN_EMAIL = 'admin@test.me';
process.env.SEED_ADMIN_PASSWORD = 'TestLozinka123!';

const BASE_URL = `http://localhost:${TEST_PORT}`;

const server = require('../server/server');
const userModel = require('../server/models/userModel');
const { hashPassword } = require('../server/lib/password');

// Kreiraj test admin nalog direktno preko modela (bez pokretanja cijele seed skripte).
userModel.create({
  name: 'Test Admin',
  email: 'admin@test.me',
  passwordHash: hashPassword('TestLozinka123!'),
  role: 'superadmin',
});

/** Mali fetch wrapper koji čuva kolačiće između poziva (kao browser). */
function makeClient() {
  let cookie = '';
  async function request(pathName, options = {}) {
    const res = await fetch(BASE_URL + pathName, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      redirect: 'manual',
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    let data = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json().catch(() => null);
    } else {
      data = await res.text().catch(() => null);
    }
    return { status: res.status, data, headers: res.headers };
  }
  return {
    get: (p) => request(p, { method: 'GET' }),
    post: (p, body) => request(p, { method: 'POST', body }),
    put: (p, body) => request(p, { method: 'PUT', body }),
    delete: (p) => request(p, { method: 'DELETE' }),
  };
}

test.after(() => {
  server.close();
  for (const suffix of ['', '-wal', '-shm']) {
    const p = TEST_DB_PATH + suffix;
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
});

// ------------------------------------------------------------
// Javne stranice
// ------------------------------------------------------------
test('GET / vraća 200 i HTML početnu stranicu', async () => {
  const client = makeClient();
  const res = await client.get('/');
  assert.equal(res.status, 200);
  assert.match(res.data, /NOVOPREVOZ/);
});

test('GET /nepostojeca-stranica vraća 404', async () => {
  const client = makeClient();
  const res = await client.get('/ova-stranica-ne-postoji');
  assert.equal(res.status, 404);
});

// ------------------------------------------------------------
// Autentifikacija
// ------------------------------------------------------------
test('Login sa pogrešnom lozinkom vraća 401', async () => {
  const client = makeClient();
  const res = await client.post('/api/auth/login', { email: 'admin@test.me', password: 'pogresno' });
  assert.equal(res.status, 401);
});

test('Login sa nepostojećim emailom vraća istu poruku kao pogrešna lozinka (bez otkrivanja da nalog ne postoji)', async () => {
  const client = makeClient();
  const res1 = await client.post('/api/auth/login', { email: 'nepostoji@test.me', password: 'bilokoja' });
  const res2 = await client.post('/api/auth/login', { email: 'admin@test.me', password: 'pogresno' });
  assert.equal(res1.data.error, res2.data.error);
});

test('Login sa ispravnim podacima vraća 200 i postavlja httpOnly kolačić', async () => {
  const client = makeClient();
  const res = await client.post('/api/auth/login', { email: 'admin@test.me', password: 'TestLozinka123!' });
  assert.equal(res.status, 200);
  assert.equal(res.data.user.email, 'admin@test.me');
});

test('Pristup zaštićenoj ruti bez prijave vraća 401', async () => {
  const client = makeClient();
  const res = await client.get('/api/trips/dashboard-stats');
  assert.equal(res.status, 401);
});

test('Pristup zaštićenoj admin HTML stranici bez prijave preusmjerava (302) na /admin/login', async () => {
  const client = makeClient();
  const res = await client.get('/admin/dashboard');
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/admin/login');
});

test('/api/auth/me nakon prijave vraća podatke o korisniku', async () => {
  const client = makeClient();
  await client.post('/api/auth/login', { email: 'admin@test.me', password: 'TestLozinka123!' });
  const res = await client.get('/api/auth/me');
  assert.equal(res.status, 200);
  assert.equal(res.data.user.role, 'superadmin');
});

test('Logout briše sesiju - naredni zahtjev na zaštićenu rutu vraća 401', async () => {
  const client = makeClient();
  await client.post('/api/auth/login', { email: 'admin@test.me', password: 'TestLozinka123!' });
  await client.post('/api/auth/logout');
  const res = await client.get('/api/trips/dashboard-stats');
  assert.equal(res.status, 401);
});

// ------------------------------------------------------------
// Stanice (CRUD)
// ------------------------------------------------------------
let stationA, stationB;

test('Kreiranje stanice bez prijave vraća 401', async () => {
  const client = makeClient();
  const res = await client.post('/api/stations', { name: 'X', city: 'Y' });
  assert.equal(res.status, 401);
});

test('Superadmin može kreirati stanice', async () => {
  const client = makeClient();
  await client.post('/api/auth/login', { email: 'admin@test.me', password: 'TestLozinka123!' });

  const resA = await client.post('/api/stations', { name: 'Stanica A', city: 'Podgorica', address: 'Adresa A', phone: '123' });
  assert.equal(resA.status, 201);
  stationA = resA.data.station;

  const resB = await client.post('/api/stations', { name: 'Stanica B', city: 'Budva', address: 'Adresa B', phone: '456' });
  assert.equal(resB.status, 201);
  stationB = resB.data.station;

  assert.ok(stationA.id && stationB.id);
});

test('Kreiranje stanice sa nedostajućim poljima vraća 400 sa listom grešaka', async () => {
  const client = makeClient();
  await client.post('/api/auth/login', { email: 'admin@test.me', password: 'TestLozinka123!' });
  const res = await client.post('/api/stations', { name: '' });
  assert.equal(res.status, 400);
  assert.ok(Array.isArray(res.data.errors) && res.data.errors.length > 0);
});

test('GET /api/stations je javno dostupan (bez prijave)', async () => {
  const client = makeClient();
  const res = await client.get('/api/stations');
  assert.equal(res.status, 200);
  assert.ok(res.data.stations.length >= 2);
});

// ------------------------------------------------------------
// Vožnje (CRUD + poslovna pravila)
// ------------------------------------------------------------
let createdTripId;

test('Kreiranje vožnje sa nepostojećom stanicom vraća 400', async () => {
  const client = makeClient();
  await client.post('/api/auth/login', { email: 'admin@test.me', password: 'TestLozinka123!' });
  const res = await client.post('/api/trips', {
    route_number: 'T-1',
    from_station_id: 99999,
    to_station_id: stationB.id,
    departure_date: '2026-12-01',
    departure_time: '10:00',
    arrival_time: '11:00',
    price: 5,
  });
  assert.equal(res.status, 400);
});

test('Kreiranje validne vožnje vraća 201 i podatak je stvarno upisan u bazu', async () => {
  const client = makeClient();
  await client.post('/api/auth/login', { email: 'admin@test.me', password: 'TestLozinka123!' });
  const res = await client.post('/api/trips', {
    route_number: 'PG-BD-TEST',
    from_station_id: stationA.id,
    to_station_id: stationB.id,
    departure_date: '2026-12-01',
    departure_time: '10:00',
    arrival_time: '11:00',
    price: 5.5,
    bus_type: 'Standardni',
  });
  assert.equal(res.status, 201);
  createdTripId = res.data.trip.id;

  // Provjeri da je zaista u bazi - novi (neautentifikovani) klijent je vidi.
  const publicClient = makeClient();
  const check = await publicClient.get(`/api/trips/${createdTripId}`);
  assert.equal(check.status, 200);
  assert.equal(check.data.trip.route_number, 'PG-BD-TEST');
  assert.equal(check.data.trip.duration_minutes, 60);
});

test('Pretraga vožnji po from/to/date pronalazi kreiranu vožnju', async () => {
  const client = makeClient();
  const res = await client.get(`/api/trips?from=Podgorica&to=Budva&date=2026-12-01`);
  assert.equal(res.status, 200);
  assert.ok(res.data.trips.some((t) => t.id === createdTripId));
});

test('Pretraga za nepostojeću relaciju vraća praznu listu (ne grešku)', async () => {
  const client = makeClient();
  const res = await client.get(`/api/trips?from=NepostojeciGrad&to=DrugiGrad&date=2026-12-01`);
  assert.equal(res.status, 200);
  assert.deepEqual(res.data.trips, []);
});

test('Izmjena vožnje (npr. vrijeme polaska) se odmah odražava na GET', async () => {
  const client = makeClient();
  await client.post('/api/auth/login', { email: 'admin@test.me', password: 'TestLozinka123!' });
  const res = await client.put(`/api/trips/${createdTripId}`, { departure_time: '15:45' });
  assert.equal(res.status, 200);
  assert.equal(res.data.trip.departure_time, '15:45');

  const publicClient = makeClient();
  const check = await publicClient.get(`/api/trips/${createdTripId}`);
  assert.equal(check.data.trip.departure_time, '15:45');
});

test('Otkazivanje vožnje mijenja status na OTKAZANA i vožnja ostaje vidljiva', async () => {
  const client = makeClient();
  await client.post('/api/auth/login', { email: 'admin@test.me', password: 'TestLozinka123!' });
  const res = await client.put(`/api/trips/${createdTripId}`, { status: 'OTKAZANA' });
  assert.equal(res.status, 200);
  assert.equal(res.data.trip.status, 'OTKAZANA');
});

test('Otkazana vožnja se NE MOŽE trajno obrisati iz baze (409)', async () => {
  const client = makeClient();
  await client.post('/api/auth/login', { email: 'admin@test.me', password: 'TestLozinka123!' });
  const res = await client.delete(`/api/trips/${createdTripId}`);
  assert.equal(res.status, 409);

  const check = await client.get(`/api/trips/${createdTripId}`);
  assert.equal(check.status, 200); // i dalje postoji
});

test('Aktivna (nije otkazana) vožnja se može obrisati', async () => {
  const client = makeClient();
  await client.post('/api/auth/login', { email: 'admin@test.me', password: 'TestLozinka123!' });
  const createRes = await client.post('/api/trips', {
    route_number: 'DELETE-ME',
    from_station_id: stationA.id,
    to_station_id: stationB.id,
    departure_date: '2026-12-02',
    departure_time: '09:00',
    arrival_time: '10:00',
    price: 3,
  });
  const id = createRes.data.trip.id;
  const delRes = await client.delete(`/api/trips/${id}`);
  assert.equal(delRes.status, 200);
  const check = await client.get(`/api/trips/${id}`);
  assert.equal(check.status, 404);
});

// ------------------------------------------------------------
// Stanica se ne može obrisati ako se koristi u vožnji
// ------------------------------------------------------------
test('Brisanje stanice koja se koristi u vožnji vraća 409', async () => {
  const client = makeClient();
  await client.post('/api/auth/login', { email: 'admin@test.me', password: 'TestLozinka123!' });
  const res = await client.delete(`/api/stations/${stationA.id}`);
  assert.equal(res.status, 409);
});

// ------------------------------------------------------------
// Obavještenja
// ------------------------------------------------------------
test('Kreiranje i filtriranje aktivnih obavještenja', async () => {
  const client = makeClient();
  await client.post('/api/auth/login', { email: 'admin@test.me', password: 'TestLozinka123!' });

  const n1 = await client.post('/api/notifications', { title: 'Test 1', content: 'Sadržaj 1', type: 'INFO', is_active: true });
  assert.equal(n1.status, 201);
  const n2 = await client.post('/api/notifications', { title: 'Test 2', content: 'Sadržaj 2', type: 'VAZNO', is_active: false });
  assert.equal(n2.status, 201);

  const publicClient = makeClient();
  const activeOnly = await publicClient.get('/api/notifications?active=true');
  assert.ok(activeOnly.data.notifications.some((n) => n.title === 'Test 1'));
  assert.ok(!activeOnly.data.notifications.some((n) => n.title === 'Test 2'));

  const all = await publicClient.get('/api/notifications');
  assert.ok(all.data.notifications.some((n) => n.title === 'Test 2'));
});

// ------------------------------------------------------------
// Kontakt forma
// ------------------------------------------------------------
test('Slanje kontakt forme sa validnim podacima vraća 201 i poruka se čuva', async () => {
  const client = makeClient();
  const res = await client.post('/api/contact', {
    name: 'Marko Marković',
    email: 'marko@example.com',
    phone: '069123456',
    message: 'Ovo je test poruka sa kontakt forme.',
  });
  assert.equal(res.status, 201);
  assert.match(res.data.message, /zaprimljena/);
});

test('Slanje kontakt forme sa neispravnim emailom vraća 400', async () => {
  const client = makeClient();
  const res = await client.post('/api/contact', {
    name: 'Test',
    email: 'nije-email',
    message: 'Poruka dovoljno duga za validaciju.',
  });
  assert.equal(res.status, 400);
});

test('Admin može vidjeti poslate kontakt poruke, javan korisnik ne može', async () => {
  const publicClient = makeClient();
  const forbidden = await publicClient.get('/api/contact');
  assert.equal(forbidden.status, 401);

  const adminClient = makeClient();
  await adminClient.post('/api/auth/login', { email: 'admin@test.me', password: 'TestLozinka123!' });
  const allowed = await adminClient.get('/api/contact');
  assert.equal(allowed.status, 200);
  assert.ok(allowed.data.messages.length >= 1);
});

// ------------------------------------------------------------
// Korisnici (samo superadmin)
// ------------------------------------------------------------
test('Kreiranje admin korisnika (ne-superadmin rola) i provjera da ta rola ne može upravljati korisnicima', async () => {
  const superClient = makeClient();
  await superClient.post('/api/auth/login', { email: 'admin@test.me', password: 'TestLozinka123!' });
  const createRes = await superClient.post('/api/users', {
    name: 'Obican Admin',
    email: 'obican@test.me',
    password: 'ObicnaLozinka123',
    role: 'admin',
  });
  assert.equal(createRes.status, 201);

  const regularClient = makeClient();
  await regularClient.post('/api/auth/login', { email: 'obican@test.me', password: 'ObicnaLozinka123' });
  const usersRes = await regularClient.get('/api/users');
  assert.equal(usersRes.status, 403); // Nemate dozvolu za ovu akciju
});

test('Duplikat email adrese pri kreiranju korisnika vraća 409', async () => {
  const client = makeClient();
  await client.post('/api/auth/login', { email: 'admin@test.me', password: 'TestLozinka123!' });
  const res = await client.post('/api/users', {
    name: 'Duplikat',
    email: 'obican@test.me',
    password: 'NekaLozinka123',
    role: 'admin',
  });
  assert.equal(res.status, 409);
});

// ------------------------------------------------------------
// Podešavanja
// ------------------------------------------------------------
test('Podešavanja se mogu izmijeniti i odmah se vide javno', async () => {
  const client = makeClient();
  await client.post('/api/auth/login', { email: 'admin@test.me', password: 'TestLozinka123!' });
  const res = await client.put('/api/settings', { contact_phone: '+382 99 999 999' });
  assert.equal(res.status, 200);

  const publicClient = makeClient();
  const check = await publicClient.get('/api/settings');
  assert.equal(check.data.settings.contact_phone, '+382 99 999 999');
});

// ------------------------------------------------------------
// Rate limiting (login brute-force zaštita)
// ------------------------------------------------------------
test('Rate limiting na login: previše pokušaja vraća 429', async () => {
  const client = makeClient();
  let last;
  for (let i = 0; i < 60; i++) {
    last = await client.post('/api/auth/login', { email: 'admin@test.me', password: 'pogresno' });
    if (last.status === 429) break;
  }
  assert.equal(last.status, 429);
});
