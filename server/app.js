'use strict';

const { Router } = require('./lib/router');
const { enhanceRequest, enhanceResponse } = require('./lib/http-helpers');
const { serveStatic } = require('./lib/static');
const { cors, securityHeaders } = require('./middleware/security');
const { rateLimit } = require('./lib/rateLimit');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const apiRouter = require('./routes/index');
const pagesRouter = require('./pages');
const config = require('./config');

const app = new Router();

// Globalni rate limit (opšta zaštita od zloupotrebe API-ja).
const globalLimiter = rateLimit({ windowMs: 60 * 1000, max: 300 });

app.use(securityHeaders);
app.use(cors);
app.use(globalLimiter);

app.use('/api', apiRouter);
app.use(pagesRouter);

app.use(serveStatic(config.publicDir));
app.use('/admin', serveStatic(config.adminDir));

/**
 * Glavni "listener" koji Node.js http server poziva za svaki zahtjev.
 * Priprema request/response objekte, provlači ih kroz router, i na
 * kraju obrađuje 404 / neuhvaćene greške.
 */
async function handleRequest(req, res) {
  try {
    await enhanceRequest(req);
    enhanceResponse(res);
  } catch (err) {
    res.statusCode = err.statusCode || 400;
    res.end(JSON.stringify({ error: err.message || 'Neispravan zahtjev.' }));
    return;
  }

  app.handle(req, res, (err) => {
    if (err) return errorHandler(err, req, res);
    if (!res.writableEnded) return notFoundHandler(req, res);
  });
}

module.exports = { handleRequest };
