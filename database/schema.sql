-- ============================================================
-- NOVOPREVOZ - Šema relacione baze podataka (SQLite)
-- Struktura je pisana standardnim SQL-om i namjerno izbjegava
-- SQLite-specifične ekstenzije koje ne postoje u PostgreSQL-u,
-- kako bi kasniji prelazak na PostgreSQL bio jednostavan
-- (AUTOINCREMENT -> SERIAL/IDENTITY, datumi kao TEXT (ISO-8601)
-- ostaju kompatibilni, CHECK constraints rade identično).
-- ============================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------
-- Tabela: users
-- Administratorski i superadmin korisnici sistema.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin', 'editor')),
    is_active     INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ------------------------------------------------------------
-- Tabela: stations
-- Autobuske stanice koje se koriste kao polazišta/odredišta.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stations (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    city        TEXT NOT NULL,
    address     TEXT,
    phone       TEXT,
    description TEXT,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_stations_city ON stations(city);

-- ------------------------------------------------------------
-- Tabela: trips
-- Pojedinačne vožnje (polasci) na voznom redu.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trips (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    route_number    TEXT NOT NULL,
    from_station_id INTEGER NOT NULL,
    to_station_id   INTEGER NOT NULL,
    departure_date  TEXT NOT NULL,              -- YYYY-MM-DD
    departure_time  TEXT NOT NULL,              -- HH:MM
    arrival_time    TEXT NOT NULL,              -- HH:MM
    price           REAL NOT NULL CHECK (price >= 0),
    bus_type        TEXT NOT NULL DEFAULT 'Standardni',
    status          TEXT NOT NULL DEFAULT 'AKTIVNA' CHECK (status IN ('AKTIVNA', 'OTKAZANA', 'ZAVRSENA')),
    notes           TEXT,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (from_station_id) REFERENCES stations(id) ON DELETE RESTRICT,
    FOREIGN KEY (to_station_id)   REFERENCES stations(id) ON DELETE RESTRICT,
    CHECK (from_station_id <> to_station_id)
);

CREATE INDEX IF NOT EXISTS idx_trips_date        ON trips(departure_date);
CREATE INDEX IF NOT EXISTS idx_trips_from_to      ON trips(from_station_id, to_station_id);
CREATE INDEX IF NOT EXISTS idx_trips_status       ON trips(status);

-- ------------------------------------------------------------
-- Tabela: notifications
-- Obavještenja koja se prikazuju na javnom sajtu.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT NOT NULL,
    content    TEXT NOT NULL,
    type       TEXT NOT NULL DEFAULT 'INFO' CHECK (type IN ('INFO', 'UPOZORENJE', 'VAZNO')),
    is_active  INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_active ON notifications(is_active);

-- ------------------------------------------------------------
-- Tabela: settings
-- Generička key/value podešavanja sajta (npr. kontakt podaci).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ------------------------------------------------------------
-- Tabela: contact_messages
-- Poruke poslate preko kontakt forme na javnom sajtu.
-- Email slanje nije povezano (vidi README) - poruke se
-- čuvaju u bazi i admin ih vidi u panelu.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    phone      TEXT,
    message    TEXT NOT NULL,
    is_read    INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
