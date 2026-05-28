const inputList   = document.querySelectorAll('input');
const buttonClick = document.querySelector('#button-click');
const errorBanner = document.querySelector('#login-error');

async function doLogin() {
  let hasError = false;

  for (let i = 0; i < inputList.length; i++) {
    if (inputList[i].type === 'checkbox') continue;
    const el      = inputList[i];
    const wrapper = el.parentElement;
    const msg     = wrapper.querySelector('.invalid-message');

    if (el.value === '') {
      el.style.border = '1px solid red';
      if (msg) msg.style.visibility = 'visible';
      hasError = true;
    } else {
      el.style.border = '1px solid #a8a8a8';
      if (msg) msg.style.visibility = 'hidden';
    }
  }

  if (hasError) return;

  const email    = document.querySelector('#email-input').value.trim();
  const password = document.querySelector('#password-field').value;

  errorBanner.style.display = 'none';
  buttonClick.style.opacity       = '0.6';
  buttonClick.style.pointerEvents = 'none';

  try {
    const data = await api.post('/auth/login', { email, password });
    saveSession(data);
    window.location.href = data.role === 'candidate'
      ? '../browse-jobs/browse-jobs.html'
      : '../browse-candidates/browse-candidates.html';
  } catch (err) {
    errorBanner.textContent    = err.message || 'Login failed. Please try again.';
    errorBanner.style.display  = 'block';
    buttonClick.style.opacity       = '';
    buttonClick.style.pointerEvents = '';
  }
}

buttonClick.addEventListener('click', doLogin);
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') doLogin();
});
