'use strict';

/**
 * Pomoćne funkcije za rad sa "sirovim" Node.js http.IncomingMessage /
 * http.ServerResponse objektima - parsiranje kolačića (cookies), tijela
 * zahtjeva (body) i obogaćivanje response objekta Express-olikim
 * metodama (status/json/send/cookie/redirect).
 */

const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const MAX_BODY_SIZE = 1024 * 1024; // 1 MB - dovoljno za JSON forme ovog projekta

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

function getMimeType(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((pair) => {
    const eqIndex = pair.indexOf('=');
    if (eqIndex === -1) return;
    const key = pair.slice(0, eqIndex).trim();
    const value = pair.slice(eqIndex + 1).trim();
    if (!key) return;
    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }
  });
  return cookies;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let received = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      received += chunk.length;
      if (received > MAX_BODY_SIZE) {
        reject(Object.assign(new Error('Zahtjev je prevelik.'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function parseBody(req) {
  const method = req.method;
  if (method === 'GET' || method === 'HEAD' || method === 'DELETE') {
    // DELETE zahtjevi u ovom API-ju ne nose tijelo, ali dozvoljavamo da
    // po potrebi ipak imaju (npr. buduće proširenje).
    if (!req.headers['content-length'] || req.headers['content-length'] === '0') {
      return {};
    }
  }
  const raw = await readBody(req);
  if (raw.length === 0) return {};
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(raw.toString('utf8'));
    } catch {
      const err = new Error('Neispravan JSON u tijelu zahtjeva.');
      err.statusCode = 400;
      throw err;
    }
  }
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(raw.toString('utf8'));
    return Object.fromEntries(params.entries());
  }
  return {};
}

/** Kreira request objekat obogaćen sa path/query/params/cookies/body. */
async function enhanceRequest(req) {
  const host = req.headers.host || 'localhost';
  const fullUrl = new URL(req.url, `http://${host}`);
  req.path = decodeURIComponent(fullUrl.pathname);
  req.query = Object.fromEntries(fullUrl.searchParams.entries());
  req.cookies = parseCookies(req.headers.cookie);
  req.params = {};
  req.body = await parseBody(req);
  req.ip = req.socket.remoteAddress || '';
  return req;
}

function serializeCookie(name, value, options = {}) {
  let cookie = `${name}=${encodeURIComponent(value)}`;
  if (options.maxAge != null) cookie += `; Max-Age=${Math.floor(options.maxAge)}`;
  cookie += `; Path=${options.path || '/'}`;
  if (options.httpOnly !== false) cookie += '; HttpOnly';
  if (options.sameSite) cookie += `; SameSite=${options.sameSite}`;
  if (options.secure) cookie += '; Secure';
  if (options.expires) cookie += `; Expires=${options.expires.toUTCString()}`;
  return cookie;
}

/** Obogaćuje response objekat Express-olikim helper metodama. */
function enhanceResponse(res) {
  res._cookies = [];

  res.status = function status(code) {
    res.statusCode = code;
    return res;
  };

  res.set = function set(field, value) {
    res.setHeader(field, value);
    return res;
  };

  res.cookie = function cookie(name, value, options) {
    res._cookies.push(serializeCookie(name, value, options));
    res.setHeader('Set-Cookie', res._cookies);
    return res;
  };

  res.clearCookie = function clearCookie(name, options = {}) {
    res._cookies.push(
      serializeCookie(name, '', { ...options, maxAge: 0, expires: new Date(0) })
    );
    res.setHeader('Set-Cookie', res._cookies);
    return res;
  };

  res.json = function json(data) {
    const body = JSON.stringify(data);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Length', Buffer.byteLength(body));
    res.end(body);
    return res;
  };

  res.send = function send(data) {
    if (data == null) {
      res.end();
      return res;
    }
    if (Buffer.isBuffer(data)) {
      if (!res.getHeader('Content-Type')) {
        res.setHeader('Content-Type', 'application/octet-stream');
      }
      res.end(data);
      return res;
    }
    if (typeof data === 'object') {
      return res.json(data);
    }
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
    res.end(String(data));
    return res;
  };

  res.redirect = function redirect(codeOrUrl, maybeUrl) {
    let code = 302;
    let url = codeOrUrl;
    if (typeof codeOrUrl === 'number') {
      code = codeOrUrl;
      url = maybeUrl;
    }
    res.statusCode = code;
    res.setHeader('Location', url);
    res.end();
    return res;
  };

  res.sendFile = function sendFile(filePath) {
    return new Promise((resolve, reject) => {
      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          const notFound = new Error('Fajl nije pronađen.');
          notFound.statusCode = 404;
          reject(notFound);
          return;
        }
        res.setHeader('Content-Type', getMimeType(filePath));
        res.setHeader('Content-Length', stats.size);
        const stream = fs.createReadStream(filePath);
        stream.on('error', reject);
        stream.on('end', resolve);
        stream.pipe(res);
      });
    });
  };

  return res;
}

module.exports = {
  enhanceRequest,
  enhanceResponse,
  getMimeType,
  MIME_TYPES,
};
