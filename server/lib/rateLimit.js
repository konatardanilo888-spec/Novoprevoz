'use strict';

/**
 * Jednostavan "fixed window" rate limiter u memoriji, po IP adresi.
 * Zamjena za "express-rate-limit" paket (nema pristupa npm registru).
 * Za produkciju sa više instanci servera preporučuje se spoljni store
 * (npr. Redis) - ovdje je dovoljan in-memory jer je aplikacija
 * jednoinstancna.
 */

function rateLimit({ windowMs = 60_000, max = 60, message = 'Previše zahtjeva. Pokušajte kasnije.' } = {}) {
  const hits = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits.entries()) {
      if (now - entry.start > windowMs) hits.delete(key);
    }
  }, windowMs).unref();

  return function rateLimitMiddleware(req, res, next) {
    const key = req.ip || 'unknown';
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || now - entry.start > windowMs) {
      entry = { start: now, count: 0 };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      res.status(429).json({ error: message });
      return;
    }
    next();
  };
}

module.exports = { rateLimit };
