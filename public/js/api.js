'use strict';

/**
 * Mali wrapper oko fetch() za komunikaciju sa NOVOPREVOZ REST API-jem.
 * Automatski šalje kolačiće (credentials: 'include'), parsira JSON i
 * baca grešku sa čitljivom porukom kada API vrati status >= 400.
 */
const Api = (() => {
  const BASE_URL = '/api';

  async function request(path, options = {}) {
    const { method = 'GET', body, headers = {} } = options;
    const finalHeaders = { ...headers };
    let finalBody = body;

    if (body !== undefined && !(body instanceof FormData)) {
      finalHeaders['Content-Type'] = 'application/json';
      finalBody = JSON.stringify(body);
    }

    let response;
    try {
      response = await fetch(BASE_URL + path, {
        method,
        headers: finalHeaders,
        body: finalBody,
        credentials: 'include',
      });
    } catch (networkError) {
      const err = new Error('Server nije dostupan. Provjerite internet konekciju i pokušajte ponovo.');
      err.isNetworkError = true;
      throw err;
    }

    let data = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json().catch(() => null);
    }

    if (!response.ok) {
      const message = (data && data.error) || `Greška (${response.status}).`;
      const err = new Error(message);
      err.status = response.status;
      err.errors = data && data.errors;
      throw err;
    }

    return data;
  }

  return {
    get: (path) => request(path, { method: 'GET' }),
    post: (path, body) => request(path, { method: 'POST', body }),
    put: (path, body) => request(path, { method: 'PUT', body }),
    delete: (path) => request(path, { method: 'DELETE' }),
  };
})();
