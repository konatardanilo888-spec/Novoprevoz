'use strict';

/**
 * Omotač oko globalnog Api objekta (definisanog u /js/api.js) koji
 * automatski prebacuje korisnika na login stranicu kad server vrati
 * 401 (istekla sesija / nije prijavljen).
 */
const AdminApi = (() => {
  function handle401(err) {
    if (err.status === 401 && !window.location.pathname.endsWith('/admin/login')) {
      window.location.href = '/admin/login';
    }
    throw err;
  }

  return {
    get: (path) => Api.get(path).catch(handle401),
    post: (path, body) => Api.post(path, body).catch(handle401),
    put: (path, body) => Api.put(path, body).catch(handle401),
    delete: (path) => Api.delete(path).catch(handle401),
  };
})();
