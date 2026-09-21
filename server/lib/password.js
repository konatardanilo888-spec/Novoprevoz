'use strict';

/**
 * Heširanje lozinki pomoću Node.js ugrađenog "crypto.scrypt".
 *
 * Zašto scrypt umjesto bcrypt-a: bcrypt (bcryptjs/bcrypt paketi) nije
 * dostupan jer ovo okruženje nema pristup npm registru (vidi README).
 * crypto.scrypt je memory-hard, "salted" funkcija za izvođenje ključa
 * koja je ugrađena u Node.js i preporučena od strane same Node.js
 * dokumentacije upravo za heširanje lozinki - sigurnosno je ekvivalentna
 * (a po memory-hardness osobini i otpornija na napade GPU/ASIC brute-force
 * pretragom) u odnosu na bcrypt. Lozinka se NIKADA ne čuva kao čist tekst.
 *
 * Format izlaza: "scrypt:N:r:p:saltHex:hashHex"
 * (parametri su sačuvani uz heš da bi se mogli mijenjati u budućnosti
 * bez "kvarenja" već sačuvanih hash-eva).
 */

const crypto = require('node:crypto');

const SCRYPT_N = 16384; // CPU/memorijska "cost" cijena (2^14)
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

function hashPassword(plainPassword) {
  if (typeof plainPassword !== 'string' || plainPassword.length === 0) {
    throw new Error('Lozinka mora biti neprazan tekst.');
  }
  const salt = crypto.randomBytes(SALT_LENGTH);
  const derivedKey = crypto.scryptSync(plainPassword, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return `scrypt:${SCRYPT_N}:${SCRYPT_R}:${SCRYPT_P}:${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

function verifyPassword(plainPassword, storedHash) {
  if (typeof plainPassword !== 'string' || typeof storedHash !== 'string') {
    return false;
  }
  const parts = storedHash.split(':');
  if (parts.length !== 6 || parts[0] !== 'scrypt') {
    return false;
  }
  const [, nStr, rStr, pStr, saltHex, hashHex] = parts;
  try {
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const derivedKey = crypto.scryptSync(plainPassword, salt, expected.length, {
      N: parseInt(nStr, 10),
      r: parseInt(rStr, 10),
      p: parseInt(pStr, 10),
    });
    return crypto.timingSafeEqual(derivedKey, expected);
  } catch {
    return false;
  }
}

module.exports = { hashPassword, verifyPassword };
