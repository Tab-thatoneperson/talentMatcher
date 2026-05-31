const _KEYS = {
  TOKEN:      'tm_token',
  ROLE:       'tm_role',
  USER_ID:    'tm_userId',
  COMPANY_ID: 'tm_companyId',
  IS_ADMIN:   'tm_isAdmin',
};

function saveSession(data) {
  console.log('[auth-storage] saveSession called — data:', JSON.stringify({
    hasAccessToken: !!data?.accessToken,
    tokenPrefix: data?.accessToken ? data.accessToken.slice(0, 20) + '...' : '(none)',
    role: data?.role,
    id: data?.id,
    companyId: data?.companyId,
  }));
  localStorage.setItem(_KEYS.TOKEN, data.accessToken);
  localStorage.setItem(_KEYS.ROLE, data.role);
  localStorage.setItem(_KEYS.USER_ID, data.id);
  if (data.companyId) localStorage.setItem(_KEYS.COMPANY_ID, data.companyId);
  if (data.isAdmin !== undefined) localStorage.setItem(_KEYS.IS_ADMIN, String(data.isAdmin));
  console.log('[auth-storage] localStorage after save:', {
    tm_token: localStorage.getItem(_KEYS.TOKEN) ? localStorage.getItem(_KEYS.TOKEN).slice(0, 20) + '...' : null,
    tm_role: localStorage.getItem(_KEYS.ROLE),
    tm_userId: localStorage.getItem(_KEYS.USER_ID),
  });
}

function getToken()     { return localStorage.getItem(_KEYS.TOKEN); }
function getRole()      { return localStorage.getItem(_KEYS.ROLE); }
function getUserId()    { return localStorage.getItem(_KEYS.USER_ID); }
function getCompanyId() { return localStorage.getItem(_KEYS.COMPANY_ID); }
function isAdmin()      { return localStorage.getItem(_KEYS.IS_ADMIN) === 'true'; }

function clearSession() {
  console.warn('[auth-storage] clearSession called — stack:', new Error().stack);
  Object.values(_KEYS).forEach(k => localStorage.removeItem(k));
  console.warn('[auth-storage] localStorage cleared');
}
