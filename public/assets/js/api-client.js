// Empty string = same-origin — works in dev (NestJS on :3000) and on EC2
const API_BASE = '';

class ApiError extends Error {
  constructor(status, message, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function _request(method, path, body, isFormData) {
  const role = getRole();
  const token = getToken();

  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData && body) headers['Content-Type'] = 'application/json';

  const tokenPreview = token ? token.slice(0, 20) + '...' : '(none)';
  console.log(`[api-client] ${method} ${path} — token: ${tokenPreview}, role: ${role}`);

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });
  } catch (_) {
    console.error(`[api-client] Network error on ${method} ${path}`);
    throw new ApiError(0, 'Network error. Please check your connection.');
  }

  console.log(`[api-client] ${method} ${path} → status ${response.status}`);

  if (response.status === 401) {
    console.warn(`[api-client] 401 received on ${method} ${path} — clearing session and redirecting`);
    console.warn(`[api-client] Token that was sent: ${tokenPreview}`);
    clearSession();
    window.location.href = role === 'employer'
      ? '/login/login-employer.html'
      : '/login/login-candidate.html';
    return;
  }

  let responseBody = null;
  if ((response.headers.get('content-type') || '').includes('application/json')) {
    responseBody = await response.json();
  }

  if (!response.ok) {
    const msg = responseBody?.message;
    console.error(`[api-client] ${method} ${path} → error ${response.status}:`, msg);
    throw new ApiError(
      response.status,
      Array.isArray(msg) ? msg.join(', ') : (msg || `Request failed (${response.status})`),
      responseBody,
    );
  }

  return responseBody;
}

const api = {
  get:         (path)       => _request('GET',    path),
  getQ:        (path, p)    => _request('GET',    `${path}?${new URLSearchParams(p)}`),
  post:        (path, data) => _request('POST',   path, data),
  patch:       (path, data) => _request('PATCH',  path, data),
  del:         (path)       => _request('DELETE', path),
  upload:      (path, form) => _request('POST',   path, form, true),
  uploadPatch: (path, form) => _request('PATCH',  path, form, true),
};

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
