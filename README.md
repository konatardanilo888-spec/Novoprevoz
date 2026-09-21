# NOVOPREVOZ

Kompletan full-stack informacioni sistem za autobusku kompaniju: javni sajt sa
pretragom vožnji i voznim redom, REST API, SQLite baza podataka i
administratorski panel sa punim CRUD upravljanjem.

```
FRONTEND + BACKEND + DATABASE + API + AUTENTIFIKACIJA + ADMIN PANEL
```

Kada administrator doda, izmijeni ili otkaže vožnju, promjena ide
`Baza → Backend → API → Javni sajt` i odmah je vidljiva svim posjetiocima.

---

## 1. Napomena o tehnologiji (VAŽNO - pročitati prije svega ostalog)

Ovaj projekat je izgrađen u okruženju **bez pristupa internetu / npm
registru**. Zbog toga nije bilo moguće instalirati pakete poput `express`,
`bcrypt`, `jsonwebtoken`, `better-sqlite3`, `cors`, `helmet` itd. - svaki
pokušaj `npm install` vraća `403 host_not_allowed`.

Da bi projekat i dalje bio **pravi, funkcionalan full-stack sistem** (a ne
mockup), cijeli backend je napisan isključivo pomoću **Node.js ugrađenih
(built-in) modula**, bez ijedne eksterne zavisnosti (`package.json` →
`"dependencies": {}`):

| Umjesto paketa...      | Korišćeno je...                          | Gdje u kodu                     |
|-------------------------|-------------------------------------------|----------------------------------|
| `express`                | Sopstveni minimalni HTTP ruter/framework nad `node:http`, sa istim API-jem (`app.get/post/use`, `req.params`, `res.status().json()`) | `server/lib/router.js`, `server/app.js` |
| `better-sqlite3`         | Ugrađeni `node:sqlite` modul (Node 22.5+, sinhroni `DatabaseSync` API) | `server/database.js` |
| `bcrypt` / `bcryptjs`    | Ugrađeni `crypto.scrypt` (memory-hard, "salted" heš funkcija - preporučena od strane same Node.js dokumentacije za heširanje lozinki; sigurnosno ekvivalentna bcrypt-u) | `server/lib/password.js` |
| `jsonwebtoken`           | Ručna HS256 JWT implementacija preko `crypto.createHmac` (potpuno standardan JWT format) | `server/lib/jwt.js` |
| `cookie-parser`          | Ručni parser `Cookie` zaglavlja | `server/lib/http-helpers.js` |
| `cors`                   | Ručno postavljanje CORS zaglavlja | `server/middleware/security.js` |
| `helmet`                 | Ručno postavljanje sigurnosnih HTTP zaglavlja (CSP, X-Frame-Options, itd.) | `server/middleware/security.js` |
| `express-rate-limit`     | Sopstveni in-memory rate limiter | `server/lib/rateLimit.js` |
| `express-validator`      | Sopstvena biblioteka za validaciju | `server/lib/validate.js` |
| `dotenv`                 | Ručni `.env` parser | `server/config.js` |

**Ovo ne mijenja arhitekturu ni ponašanje sistema** - API rute, JSON odgovori,
kolačići, autentifikacija, CRUD, itd. rade identično kao da su korišćeni
pomenuti paketi. Kod je pisan tako da API svakog modula (npr. `jwt.sign/verify`,
`Router.get/post/use`) vjerno oponaša API pravih paketa, pa je **lako naknadno
zamijeniti** ove module pravim npm paketima ako se projekat pokrene u okruženju
sa pristupom internetu - dovoljno je zamijeniti `require('./lib/jwt')` sa
`require('jsonwebtoken')` i slično, uz sitne prilagodbe poziva.

Sve ostalo (frontend, HTML/CSS/JS) je 100% standardno i ne zahtijeva nikakve
build alate (nema webpack/vite/babel) - radi direktno u browseru.

---

## 2. Potrebni programi

- **Node.js verzija 22.5.0 ili novija** (obavezno, zbog `node:sqlite` modula).
  Provjerite verziju: `node -v`
- npm (dolazi uz Node.js) - koristi se samo za pokretanje skripti iz
  `package.json`, projekat nema eksternih zavisnosti za instalaciju.

## 3. Instalacija

```bash
cd novoprevoz
npm install
```

Pošto `dependencies` lista prazna, `npm install` neće preuzimati ništa sa
interneta - samo priprema `package-lock.json`. Ako je i to nedostupno, projekat
i dalje radi bez ijednog `npm install` koraka.

## 4. Podešavanje `.env` fajla

```bash
cp .env.example .env
```

Otvorite `.env` i po potrebi izmijenite vrijednosti. Najvažnije:

- `JWT_SECRET` - **obavezno promijeniti** prije bilo kakvog ozbiljnijeg
  korišćenja (dugačak, nasumičan string). Generisati npr.:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- `PORT` - port na kojem server sluša (podrazumijevano `3000`).
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` - podaci početnog admin naloga
  koji kreira seed skripta (vidi ispod).

Ako `.env` fajl uopšte ne postoji, aplikacija će raditi u razvojnom režimu sa
privremenim JWT ključem (generisanim pri svakom pokretanju) i podrazumijevanim
vrijednostima - dovoljno za brzo isprobavanje, ali **ne i za produkciju**.

## 5. Kreiranje baze i demo podataka (seed)

Baza (`database/database.sqlite`) i sve tabele se **automatski kreiraju** pri
prvom pokretanju servera (iz `database/schema.sql`). Da biste dobili početni
admin nalog i demo podatke (stanice, vožnje, obavještenja), pokrenite:

```bash
npm run seed
```

Seed skripta je idempotentna - može se pokretati više puta bez dupliranja
admin naloga i stanica (vožnje se dodaju samo ako je tabela `trips` prazna).

Nakon seed-a, u terminalu ćete vidjeti demo admin kredencijale.

## 6. Pokretanje servera

```bash
npm start
```

Za razvoj (automatski restart pri izmjeni fajlova, koristi ugrađeni Node.js
`--watch`):

```bash
npm run dev
```

Server ispisuje:

```
   Javni sajt:     http://localhost:3000
   Admin panel:    http://localhost:3000/admin/login
   REST API:       http://localhost:3000/api
```

## 7. Pristup sajtu

- **Javni sajt:** [http://localhost:3000](http://localhost:3000)
- **Admin panel:** [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

### Testni admin nalog (DEVELOPMENT ONLY)

Kreira se pomoću `npm run seed`, na osnovu `.env` vrijednosti
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (podrazumijevano):

```
Email:    admin@novoprevoz.me
Lozinka:  NovoPrevoz2026!
```

**Obavezno promijenite ovu lozinku** (Admin panel → Podešavanja → Promjena
lozinke) prije bilo kakvog stvarnog korišćenja. Lozinka se nikada ne čuva kao
čist tekst - heširana je pomoću `crypto.scrypt` (vidi napomenu o tehnologiji).

---

## 8. Kako koristiti admin panel

### Dodavanje vožnje
1. Prijavite se na `/admin/login`.
2. U sidebaru kliknite **"Dodaj vožnju"** (ili dugme "+ Dodaj vožnju" na
   Dashboard-u / stranici Vozni red).
3. Popunite formu (broj linije, polazna/odredišna stanica, datum, vremena,
   cijena, tip autobusa, status, napomena) i kliknite **"SAČUVAJ VOŽNJU"**.
4. Vožnja se odmah upisuje u bazu i vidljiva je na javnom sajtu
   (`/vozni-red`, `/polasci`).

### Izmjena vožnje
1. Na stranici **"Vozni red"** u admin panelu kliknite ikonicu olovke pored
   željene vožnje.
2. Izmijenite podatke (npr. vrijeme polaska ili status) i sačuvajte.
3. Javni sajt odmah prikazuje nove podatke - nema keširanja.

### Otkazivanje vožnje
- Otkazivanje je **izmjena statusa**, ne brisanje: otvorite vožnju za
  izmjenu, postavite Status na **"Otkazana"** i sačuvajte. Javni sajt
  prikazuje crvenu oznaku **"OTKAZANO"**. Otkazane vožnje se **ne mogu**
  trajno obrisati iz baze (sistem to sprječava sa jasnom porukom) - ostaju
  vidljive radi transparentnosti prema putnicima.

### Brisanje vožnje
- Na stranici "Vozni red" kliknite ikonicu kante za smeće. Prikazuje se
  modal za potvrdu ("Da li ste sigurni..."). Moguće je obrisati samo vožnje
  koje NISU otkazane.

### Dodavanje stanice
1. Idite na **"Stanice"** u sidebaru → **"+ Dodaj stanicu"**.
2. Unesite naziv, grad, adresu, telefon i opis → **"SAČUVAJ"**.
3. Nova stanica se odmah pojavljuje u svim padajućim listama (pretraga na
   početnoj, filteri voznog reda, forma za dodavanje vožnje).

### Dodavanje obavještenja
1. Idite na **"Obavještenja"** → **"+ Dodaj obavještenje"**.
2. Unesite naslov, tekst i tip (Info / Upozorenje / Važno), označite da li je
   aktivno → **"SAČUVAJ"**.
3. Aktivna obavještenja se odmah prikazuju na javnoj početnoj stranici.

### Poruke sa kontakt forme
- Kontakt forma na javnom sajtu (`/kontakt`) **stvarno** upisuje poruke u
  bazu (tabela `contact_messages`). Automatsko slanje na email **nije**
  povezano sa spoljnim email servisom (SMTP), pa se poruke pregledaju u
  Admin panelu → **"Poruke"**. Ovo je jasno naznačeno i korisniku na samom
  sajtu - sistem nikada ne tvrdi da je email "poslat" kada nije.

### Korisnici (samo superadmin)
- Admin panel → **"Korisnici"** je dostupan samo nalozima sa rolom
  `superadmin`. Tu se mogu dodavati novi admin nalozi (role: `admin`,
  `superadmin`, `editor` - struktura je spremna za dalje širenje dozvola po
  roli `editor`), aktivirati/deaktivirati naloge i brisati ih.

---

## 9. Struktura projekta

```
novoprevoz/
├── server/                    # Backend (Node.js, bez eksternih zavisnosti)
│   ├── server.js               # Ulazna tačka - pokreće HTTP server
│   ├── app.js                  # Sastavlja middleware lanac i rute
│   ├── config.js                # Učitavanje .env i konfiguracija
│   ├── database.js             # node:sqlite konekcija + inicijalizacija šeme
│   ├── pages.js                 # Serviranje HTML stranica (pretty URLs)
│   ├── lib/                     # Sopstveni "mikro-framework" (router, jwt, password, validate, rateLimit, http-helpers, static)
│   ├── middleware/               # auth (JWT), security (CORS/CSP), errorHandler
│   ├── models/                   # Pristup bazi (users, stations, trips, notifications, settings, messages)
│   ├── controllers/               # Poslovna logika + validacija po resursu
│   └── routes/                    # REST API rute
├── database/
│   ├── schema.sql                # SQL šema (users, stations, trips, notifications, settings, contact_messages)
│   └── database.sqlite           # Generiše se automatski (nije u git-u)
├── scripts/
│   └── seed.js                   # Kreira admin nalog i demo podatke
├── public/                     # Javni sajt (HTML/CSS/JS, bez build alata)
│   ├── index.html, vozni-red.html, polasci.html, voznja.html, o-nama.html, kontakt.html, 404.html, 500.html
│   ├── css/style.css
│   ├── js/                      # api.js, toast.js, main.js, stranicom-specifični skriptovi
│   ├── images/                   # favicon.svg, og-cover.svg
│   ├── robots.txt, sitemap.xml
├── admin/                       # Admin panel (HTML/CSS/JS)
│   ├── login.html, dashboard.html, trips.html, trip-form.html, stations.html, notifications.html, users.html, messages.html, settings.html
│   ├── css/admin.css
│   └── js/
├── tests/
│   └── api.test.js               # Automatski integracioni testovi (node:test)
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## 10. REST API - pregled

Svi endpointi su prefiksovani sa `/api`. Admin rute (POST/PUT/DELETE nad
resursima, sem javne kontakt forme) zahtijevaju validan JWT u `httpOnly`
kolačiću (automatski se šalje iz browsera nakon logina).

| Metoda | Ruta                         | Opis                                       | Zaštićeno |
|--------|-------------------------------|---------------------------------------------|-----------|
| POST   | `/api/auth/login`               | Prijava (email + lozinka)                    | -         |
| POST   | `/api/auth/logout`              | Odjava                                        | Da        |
| GET    | `/api/auth/me`                   | Podaci o prijavljenom korisniku               | Da        |
| POST   | `/api/auth/change-password`      | Promjena lozinke                              | Da        |
| GET    | `/api/trips`                      | Pretraga/lista vožnji (filteri: from, to, date, time, status) | -   |
| GET    | `/api/trips/:id`                   | Detalji jedne vožnje                          | -         |
| POST   | `/api/trips`                        | Dodavanje vožnje                              | Da        |
| PUT    | `/api/trips/:id`                     | Izmjena vožnje                                | Da        |
| DELETE | `/api/trips/:id`                      | Brisanje vožnje (otkazane su zaštićene)       | Da        |
| GET    | `/api/trips/dashboard-stats`           | Statistika za admin dashboard                 | Da        |
| GET    | `/api/stations`                          | Lista stanica                                 | -         |
| POST/PUT/DELETE `/api/stations[/:id]`     | Upravljanje stanicama                        | Da        |
| GET    | `/api/notifications`                       | Lista obavještenja (`?active=true` za aktivna)| -         |
| POST/PUT/DELETE `/api/notifications[/:id]` | Upravljanje obavještenjima                   | Da        |
| POST   | `/api/contact`                               | Slanje poruke sa kontakt forme               | -         |
| GET/PUT/DELETE `/api/contact[/:id]`           | Pregled/brisanje poruka                     | Da        |
| GET    | `/api/settings`                                | Javna podešavanja sajta                     | -         |
| PUT    | `/api/settings`                                 | Izmjena podešavanja                         | Da        |
| GET/POST/PUT/DELETE `/api/users[/:id]`           | Upravljanje admin nalozima                   | Da (superadmin) |

## 11. Baza podataka

SQLite (`database/schema.sql`), tabele: `users`, `stations`, `trips`,
`notifications`, `settings`, `contact_messages` (dodatna tabela za kontakt
poruke). Koristi standardan SQL (foreign keys, CHECK constraints, indeksi) bez
SQLite-specifičnih ekstenzija, pa je struktura direktno prenosiva na
PostgreSQL - potrebno je zamijeniti `AUTOINCREMENT` sa `SERIAL`/`IDENTITY`,
`node:sqlite` sloj (`server/database.js`) sa `pg` klijentom, a upiti (čist
parametrizovan SQL) ostaju gotovo nepromijenjeni.

## 12. Sigurnost - implementirano

- Heširanje lozinki (`crypto.scrypt`, salted, memory-hard) - lozinke se
  nikada ne čuvaju kao čist tekst.
- JWT autentifikacija u `httpOnly` kolačiću (nedostupan JS-u u browseru →
  otporno na XSS krađu tokena), `SameSite=Lax`, `Secure` u produkciji.
- Zaštićene admin rute i stranice (server-side provjera i za API i za HTML).
- Role-based pristup (`admin`, `superadmin`, `editor`) - npr. upravljanje
  korisnicima je rezervisano za `superadmin`.
- Server-side i client-side validacija na svim formama.
- Zaštita od SQL injekcije - isključivo parametrizovani upiti (`?` placeholderi),
  nikad string-konkatenacija u SQL-u.
- Zaštita od XSS - sav dinamički sadržaj na frontend-u se ubacuje u DOM preko
  `textContent`/eksplicitnog escape-ovanja (`escapeHtml`), nikad direktnim
  ubacivanjem korisničkog unosa u HTML.
- CORS ograničen na definisani origin (`CORS_ORIGIN` u `.env`).
- Content-Security-Policy, X-Frame-Options, X-Content-Type-Options i ostala
  sigurnosna zaglavlja (ručna implementacija ekvivalentna `helmet`-u).
- Rate limiting (globalni + strožiji na login i kontakt formu) - zaštita od
  brute-force i zloupotrebe.
- `.env` / environment varijable za sve tajne (JWT_SECRET, itd.) - ništa
  osjetljivo nije hardkodovano niti izloženo u frontend kodu.
- Centralizovano rukovanje greškama - interni detalji (stack trace, SQL) se
  nikad ne vraćaju klijentu, samo se loguju na serveru.

## 13. Testiranje

Automatski integracioni testovi (Node.js ugrađeni `node:test`, bez
eksternih test biblioteka) pokreću pravu instancu servera nad izolovanom test
bazom i testiraju kompletne tokove preko HTTP-a:

```bash
npm test
```

Pokriveno: javne stranice, 404, login (uspješan/neuspješan/rate-limit),
zaštita ruta (401/302), CRUD za vožnje/stanice/obavještenja/korisnike,
poslovno pravilo "otkazana vožnja se ne briše", zaštita brisanja stanice u
upotrebi, kontakt forma i validacija, role-based pristup korisnicima,
podešavanja sajta.

Dodatno, tokom razvoja je urađeno i ručno end-to-end testiranje kroz headless
browser (Chromium/Playwright): prijava, dodavanje/izmjena/otkazivanje vožnje u
admin panelu i provjera da se promjena odmah vidi na javnom sajtu, zaštita
ruta nakon odjave, i provjera da nema horizontalnog overflow-a niti JS grešaka
na mobilnim rezolucijama (375px) za sve javne i admin stranice.

## 14. Responsive dizajn i animacije

Sajt je testiran na mobilnom (375px), tabletu i desktopu - header postaje
hamburger meni, tabela voznog reda postaje kartice, admin sidebar se sakriva
van ekrana i otvara na dodir. Animacije (fade-in, slide-up, hover, tranzicije)
su suptilne, kratke (150-600ms) i poštuju `prefers-reduced-motion`.

## 15. Postavljanje online (produkcija)

1. Postavite kod na server sa Node.js 22.5+ (npr. VPS, Render, Railway,
   Fly.io - bilo koja platforma koja podržava dugotrajan Node.js proces jer
   se koristi SQLite fajl, a ne serverless funkcije).
2. Podesite `.env` sa produkcijskim vrijednostima: jak `JWT_SECRET`,
   `NODE_ENV=production`, `CORS_ORIGIN` na pravi domen.
3. `npm install && npm run seed && npm start` (ili koristite process manager
   poput `pm2` za automatski restart).
4. Postavite reverse proxy (npr. Nginx) ispred Node servera radi HTTPS-a
   (TLS terminacija) i servirajte sajt na standardnom portu 443.
5. Redovno pravite backup fajla `database/database.sqlite`.
6. Za veće opterećenje, sloj baze (`server/database.js` + `server/models/`)
   je pisan tako da je prelazak na PostgreSQL izolovana promjena (vidi
   sekciju 11).

## 16. Poznata ograničenja

- `node:sqlite` je i dalje eksperimentalna Node.js funkcionalnost (od verzije
  22.5) - stabilna je za ovu namjenu, ali Node.js je označava kao
  "experimental" (ispisuje upozorenje pri pokretanju, što je normalno).
- Slanje email potvrda sa kontakt forme nije povezano sa spoljnim SMTP
  servisom (namjerno, po specifikaciji projekta) - poruke se čuvaju u bazi i
  vidljive su administratoru.
- Rate limiter i JWT verifikacija rade u memoriji jedne Node.js instance;
  za horizontalno skaliranje (više instanci servera) bilo bi potrebno
  premjestiti ih na dijeljeni store (npr. Redis).
