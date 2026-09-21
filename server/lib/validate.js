'use strict';

/**
 * Sitna biblioteka za server-side validaciju (zamjena za
 * "express-validator", koji nije dostupan bez npm registra).
 *
 * Upotreba:
 *   const errors = validate(req.body, {
 *     email: [required(), isEmail()],
 *     price: [required(), isNumber({ min: 0 })],
 *   });
 *   if (errors.length) return res.status(400).json({ errors });
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function required(message = 'Ovo polje je obavezno.') {
  return (value) => {
    if (value === undefined || value === null) return message;
    if (typeof value === 'string' && value.trim() === '') return message;
    return null;
  };
}

function isEmail(message = 'Email adresa nije validna.') {
  return (value) => {
    if (value == null || value === '') return null; // required() hvata prazno
    return EMAIL_REGEX.test(String(value)) ? null : message;
  };
}

function isString({ min, max } = {}, message) {
  return (value) => {
    if (value == null || value === '') return null;
    if (typeof value !== 'string') return message || 'Vrijednost mora biti tekst.';
    if (min != null && value.length < min) {
      return message || `Tekst mora imati bar ${min} karaktera.`;
    }
    if (max != null && value.length > max) {
      return message || `Tekst može imati najviše ${max} karaktera.`;
    }
    return null;
  };
}

function isNumber({ min, max } = {}, message) {
  return (value) => {
    if (value == null || value === '') return null;
    const num = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(num)) return message || 'Vrijednost mora biti broj.';
    if (min != null && num < min) return message || `Vrijednost mora biti bar ${min}.`;
    if (max != null && num > max) return message || `Vrijednost mora biti najviše ${max}.`;
    return null;
  };
}

function isInteger(options, message) {
  const numberCheck = isNumber(options, message);
  return (value) => {
    if (value == null || value === '') return null;
    const numMsg = numberCheck(value);
    if (numMsg) return numMsg;
    if (!Number.isInteger(Number(value))) return message || 'Vrijednost mora biti cio broj.';
    return null;
  };
}

function isIn(allowedValues, message) {
  return (value) => {
    if (value == null || value === '') return null;
    return allowedValues.includes(value)
      ? null
      : message || `Dozvoljene vrijednosti: ${allowedValues.join(', ')}.`;
  };
}

function isDate(message = 'Datum mora biti u formatu GGGG-MM-DD.') {
  return (value) => {
    if (value == null || value === '') return null;
    if (!DATE_REGEX.test(value)) return message;
    const d = new Date(value + 'T00:00:00Z');
    return Number.isNaN(d.getTime()) ? message : null;
  };
}

function isTime(message = 'Vrijeme mora biti u formatu HH:MM.') {
  return (value) => {
    if (value == null || value === '') return null;
    return TIME_REGEX.test(value) ? null : message;
  };
}

/**
 * Pokreće sve validatore nad datim objektom i vraća listu grešaka
 * u obliku [{ field, message }].
 */
function validate(data, schema) {
  const errors = [];
  for (const [field, validators] of Object.entries(schema)) {
    const value = data ? data[field] : undefined;
    for (const validator of validators) {
      const message = validator(value);
      if (message) {
        errors.push({ field, message });
        break; // prva greška po polju je dovoljna
      }
    }
  }
  return errors;
}

/** Uklanja HTML-specijalne karaktere da bi se spriječio XSS pri prikazu. */
function escapeHtml(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = {
  validate,
  required,
  isEmail,
  isString,
  isNumber,
  isInteger,
  isIn,
  isDate,
  isTime,
  escapeHtml,
};
