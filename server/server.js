'use strict';

const http = require('node:http');
const config = require('./config');
const { handleRequest } = require('./app');

// Osiguraj da je baza inicijalizovana prije nego server počne da prima zahtjeve.
require('./database');

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[FATALNA GREŠKA]', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Došlo je do greške na serveru.' }));
    }
  });
});

server.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log('');
  console.log('========================================');
  console.log('   NOVOPREVOZ - server je pokrenut');
  console.log('========================================');
  console.log(`   Okruženje:      ${config.env}`);
  console.log(`   Javni sajt:     http://localhost:${config.port}`);
  console.log(`   Admin panel:    http://localhost:${config.port}/admin/login`);
  console.log(`   REST API:       http://localhost:${config.port}/api`);
  console.log('========================================');
  console.log('');
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));

module.exports = server;
