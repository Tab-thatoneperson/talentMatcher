const _KEYS = {
  TOKEN:      'tm_token',
  ROLE:       'tm_role',
  USER_ID:    'tm_userId',
  IS_MEMBER:  'tm_isMember',
  COMPANY_ID: 'tm_companyId',
  IS_ADMIN:   'tm_isAdmin',
};

function saveSession(data) {
  console.log('savemembershiop', data.isMember)
  localStorage.setItem(_KEYS.TOKEN, data.accessToken);
  localStorage.setItem(_KEYS.ROLE, data.role);
  localStorage.setItem(_KEYS.USER_ID, data.id);
  localStorage.setItem(_KEYS.IS_MEMBER, data.isMember);
  if (data.companyId) localStorage.setItem(_KEYS.COMPANY_ID, data.companyId);
  if (data.isAdmin !== undefined) localStorage.setItem(_KEYS.IS_ADMIN, String(data.isAdmin));
}

function saveMember(data) {
  console.log('savemembershiop')
  localStorage.setItem(_KEYS.IS_MEMBER, data.isMember);
}

function getToken() { return localStorage.getItem(_KEYS.TOKEN); }
function getRole() { return localStorage.getItem(_KEYS.ROLE); }
function isMember() { return localStorage.getItem(_KEYS.IS_MEMBER); }
function getUserId() { return localStorage.getItem(_KEYS.USER_ID); }
function getCompanyId() { return localStorage.getItem(_KEYS.COMPANY_ID); }
function isAdmin() { return localStorage.getItem(_KEYS.IS_ADMIN) === 'true'; }

function clearSession() {
  Object.values(_KEYS).forEach(k => localStorage.removeItem(k));
}
