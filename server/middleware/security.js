'use strict';

/**
 * Sigurnosni middleware-i: CORS i sigurnosna HTTP zaglavlja
 * (zamjena za "cors" i "helmet" pakete koji nisu dostupni bez npm
 * registra - vidi README.md).
 */

const config = require('../config');

function cors(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', config.corsOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  next();
}

/**
 * Postavlja sigurnosna zaglavlja slična onima koje postavlja "helmet":
 * - Content-Security-Policy: sprječava izvršavanje neautorizovanog JS-a (XSS)
 * - X-Content-Type-Options: sprječava MIME-sniffing
 * - X-Frame-Options: sprječava clickjacking (embedovanje sajta u iframe)
 * - Referrer-Policy, Permissions-Policy: dodatna zaštita privatnosti
 * - Strict-Transport-Security: (samo u produkciji, HTTPS)
 */
function securityHeaders(req, res, next) {
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'self'",
    ].join('; ')
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  if (config.isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  }
  res.removeHeader('X-Powered-By');
  next();
}

module.exports = { cors, securityHeaders };
