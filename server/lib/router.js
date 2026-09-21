'use strict';

/**
 * Minimalni HTTP mikro-framework (Router + App), napisan isključivo sa
 * Node.js ugrađenim modulima ("node:http"), kao zamjena za Express.
 *
 * Razlog: okruženje u kojem je projekat generisan nema pristup npm
 * registru, pa "express" paket nije moguće instalirati (vidi README.md,
 * sekcija "Napomena o tehnologiji"). Ovaj router svjesno oponaša
 * Express-ov API (app.get/post/put/delete, app.use, middleware sa
 * (req, res, next), Router() za grupisanje ruta, req.params/query/body,
 * res.status().json()) kako bi ostatak koda ostao čitljiv, organizovan
 * i lako prenosiv na pravi Express ako se projekat kasnije pokrene u
 * okruženju sa pristupom internetu.
 */

const { STATUS_CODES } = require('node:http');

/** Pretvara putanju tipa "/api/trips/:id" u regex sa imenovanim grupama. */
function pathToRegex(routePath) {
  const keys = [];
  if (routePath === '*') {
    return { regexp: /^.*$/, keys };
  }
  const pattern = routePath
    .replace(/\/+$/, '')
    .split('/')
    .map((segment) => {
      if (segment.startsWith(':')) {
        keys.push(segment.slice(1));
        return '([^/]+)';
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');
  const finalPattern = `^${pattern || ''}/?$`;
  return { regexp: new RegExp(finalPattern), keys };
}

class Router {
  constructor() {
    this.stack = [];
  }

  _register(method, routePath, handlers) {
    if (routePath instanceof Router) {
      throw new Error('Nevažeća registracija rute.');
    }
    const { regexp, keys } = pathToRegex(routePath);
    this.stack.push({ method, regexp, keys, handlers, isMount: false });
  }

  get(routePath, ...handlers) {
    this._register('GET', routePath, handlers);
    return this;
  }
  post(routePath, ...handlers) {
    this._register('POST', routePath, handlers);
    return this;
  }
  put(routePath, ...handlers) {
    this._register('PUT', routePath, handlers);
    return this;
  }
  patch(routePath, ...handlers) {
    this._register('PATCH', routePath, handlers);
    return this;
  }
  delete(routePath, ...handlers) {
    this._register('DELETE', routePath, handlers);
    return this;
  }

  /**
   * app.use(middleware) - primjenjuje se na sve putanje.
   * app.use(prefix, middleware) - primjenjuje se samo na putanje koje počinju prefiksom.
   * app.use(prefix, subRouter) - montira pod-ruter na prefiks.
   */
  use(pathOrMiddleware, maybeHandler) {
    let mountPath = '/';
    let handler = pathOrMiddleware;
    if (typeof pathOrMiddleware === 'string') {
      mountPath = pathOrMiddleware;
      handler = maybeHandler;
    }
    const isRouter = handler instanceof Router;
    this.stack.push({
      method: '*',
      mountPath: mountPath.replace(/\/+$/, ''),
      isMount: true,
      isRouter,
      handler,
    });
    return this;
  }

  /**
   * Obrađuje zahtjev kroz sopstveni stek slojeva. Poziva se rekurzivno
   * i za pod-rutere. `basePath` je dio putanje koji je već "potrošen"
   * montiranjem (koristi se samo interno).
   */
  handle(req, res, done) {
    const fullPath = req.path;
    let index = 0;

    const next = (err) => {
      if (err) {
        return done(err);
      }
      if (index >= this.stack.length) {
        return done();
      }
      const layer = this.stack[index++];

      if (layer.isMount) {
        const mountPath = layer.mountPath;
        if (mountPath === '' || mountPath === '/') {
          if (layer.isRouter) {
            return layer.handler.handle(req, res, next);
          }
          return runMiddleware(layer.handler, req, res, next);
        }
        if (fullPath === mountPath || fullPath.startsWith(mountPath + '/')) {
          const previousPath = req.path;
          req.path = fullPath.slice(mountPath.length) || '/';
          const restore = (err2) => {
            req.path = previousPath;
            next(err2);
          };
          if (layer.isRouter) {
            return layer.handler.handle(req, res, restore);
          }
          return runMiddleware(layer.handler, req, res, restore);
        }
        return next();
      }

      if (layer.method !== '*' && layer.method !== req.method) {
        return next();
      }
      const match = layer.regexp.exec(fullPath);
      if (!match) {
        return next();
      }
      const params = {};
      layer.keys.forEach((key, i) => {
        params[key] = decodeURIComponent(match[i + 1]);
      });
      req.params = params;

      runHandlerChain(layer.handlers, req, res, next);
    };

    next();
  }
}

function runMiddleware(fn, req, res, next) {
  try {
    const maybePromise = fn(req, res, next);
    if (maybePromise && typeof maybePromise.catch === 'function') {
      maybePromise.catch(next);
    }
  } catch (err) {
    next(err);
  }
}

function runHandlerChain(handlers, req, res, next) {
  let i = 0;
  const step = (err) => {
    if (err) return next(err);
    if (i >= handlers.length) return next();
    const fn = handlers[i++];
    runMiddleware(fn, req, res, step);
  };
  step();
}

module.exports = { Router, pathToRegex, STATUS_CODES };
