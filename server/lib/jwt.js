'use strict';

/**
 * Minimalna implementacija JWT (JSON Web Token) - HS256 algoritam,
 * pomoću ugrađenog "crypto.createHmac". Zamjenjuje "jsonwebtoken" paket
 * koji nije dostupan bez pristupa npm registru (vidi README.md).
 *
 * Format tokena je standardan JWT: base64url(header).base64url(payload).signature
 * i kompatibilan je sa strukturom koju bi generisao i pravi "jsonwebtoken" paket
 * za HS256 tokene, tako da se u budućnosti lako može zamijeniti.
 */

const crypto = require('node:crypto');

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlToBuffer(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4 !== 0) str += '=';
  return Buffer.from(str, 'base64');
}

/** Pretvara string trajanja tipa "8h", "30m", "7d" u sekunde. */
function parseExpiry(expiresIn) {
  if (typeof expiresIn === 'number') return expiresIn;
  const match = /^(\d+)([smhd])$/.exec(String(expiresIn).trim());
  if (!match) return 3600;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
  return value * multipliers[unit];
}

function sign(payload, secret, options = {}) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + parseExpiry(options.expiresIn || '1h'),
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(fullPayload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verifikuje i dekodira token. Vraća payload ili baca grešku ako je
 * token nevažeći, istekao ili je potpis neispravan.
 */
function verify(token, secret) {
  if (typeof token !== 'string') throw new Error('Nevažeći token.');
  const segments = token.split('.');
  if (segments.length !== 3) throw new Error('Nevažeći format tokena.');
  const [encodedHeader, encodedPayload, signature] = segments;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    throw new Error('Nevažeći potpis tokena.');
  }

  const payload = JSON.parse(base64urlToBuffer(encodedPayload).toString('utf8'));
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === 'number' && now >= payload.exp) {
    throw new Error('Token je istekao.');
  }
  return payload;
}

module.exports = { sign, verify };
