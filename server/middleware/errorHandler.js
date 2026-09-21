'use strict';

/**
 * Centralizovano rukovanje greškama. Nikada ne izlaže interne detalje
 * (stack trace, SQL upite i sl.) klijentu - samo u server-side logu.
 */

const config = require('../config');

function notFoundHandler(req, res) {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Traženi resurs nije pronađen.' });
  }
  res.status(404);
  res.sendFile(require('node:path').join(config.publicDir, '404.html')).catch(() => {
    res.status(404).send('<h1>404 - Stranica nije pronađena</h1>');
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;

  // eslint-disable-next-line no-console
  console.error(`[GREŠKA] ${req.method} ${req.path} ->`, err.message);
  if (!config.isProduction && err.stack) {
    // eslint-disable-next-line no-console
    console.error(err.stack);
  }

  if (req.path.startsWith('/api/')) {
    return res.status(statusCode).json({
      error: statusCode === 500 ? 'Došlo je do greške na serveru. Pokušajte ponovo kasnije.' : err.message,
    });
  }

  res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500);
  const path = require('node:path');
  const filePath = statusCode === 404 ? path.join(config.publicDir, '404.html') : path.join(config.publicDir, '500.html');
  res.sendFile(filePath).catch(() => {
    res.send('<h1>Greška na serveru</h1><p>Pokušajte ponovo kasnije.</p>');
  });
}

module.exports = { notFoundHandler, errorHandler };
