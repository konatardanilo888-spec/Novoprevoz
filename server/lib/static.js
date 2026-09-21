'use strict';

/** Servira statičke fajlove (CSS, JS, slike) iz zadatog foldera. */

const fs = require('node:fs');
const path = require('node:path');

function serveStatic(rootDir) {
  return async function staticMiddleware(req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();

    const urlPath = req.path.split('?')[0];
    const safeSuffix = path
      .normalize(decodeURIComponent(urlPath))
      .replace(/^(\.\.[/\\])+/, '');
    const filePath = path.join(rootDir, safeSuffix);

    // Sigurnosna provjera: fajl mora ostati unutar rootDir (spriječava path traversal).
    if (!filePath.startsWith(rootDir)) {
      return next();
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        return next();
      }
      res.sendFile(filePath).catch(next);
    });
  };
}

module.exports = { serveStatic };
