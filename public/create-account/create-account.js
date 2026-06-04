const container  = document.querySelector('.container');
const isEmployer = container.dataset.pageType === 'employer';

async function wait(ms) {
  return new Promise((resolve) => {
    console.log(ms);
    setTimeout(resolve, ms);
  });
}

// ── Password conditions display ────────────────────────────────────────────
const passwordField = document.querySelector('#password-field');

passwordField.addEventListener('focus', () => {
  document.querySelector('.condition-container').style.display = 'block';
});
passwordField.addEventListener('blur', () => {
  document.querySelector('.condition-container').style.display = 'none';
});

const conditionImgs = document.querySelectorAll('.condition-container img');

passwordField.addEventListener('input', function () {
  const v = this.value;
  const checks = [
    v.length >= 10 && v.length <= 15,
    /[0-9]/.test(v),
    /[^a-zA-Z0-9]/.test(v),
    /[A-Z]/.test(v),
    /[a-z]/.test(v),
  ];
  conditionImgs.forEach((img, i) => {
    img.src = checks[i] ? '../assets/check.png' : '../assets/cross.png';
  });
});

// ── Form submission ────────────────────────────────────────────────────────
const inputList    = document.querySelectorAll('input');
const buttonClick  = document.querySelector('#button-click');
const errorBanner  = document.querySelector('#register-error');

buttonClick.addEventListener('click', async function (e) {
  e.preventDefault();
  let hasError = false;

  for (const el of inputList) {
    if (el.type === 'checkbox') continue;
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

  // T&C checkbox must be checked
  const checkbox = document.querySelector('input[type="checkbox"]');
  if (!checkbox.checked) {
    hasError = true;
  }

  // Passwords must match
  const confirmEl = document.querySelector('#confirm-password-input');
  if (passwordField.value !== confirmEl.value) {
    confirmEl.style.border = '1px solid red';
    const msg = confirmEl.parentElement.querySelector('.invalid-message');
    if (msg) {
      msg.style.visibility = 'visible';
      const p = msg.querySelector('p');
      if (p) p.textContent = 'Passwords do not match';
    }
    hasError = true;
  }

  if (hasError) return;

  const email     = document.querySelector('#email-input').value.trim();
  const password  = passwordField.value;
  const firstName = document.querySelector('#first-name-input').value.trim();
  const lastName  = document.querySelector('#last-name-input').value.trim();

  errorBanner.style.display  = 'none';
  buttonClick.style.opacity  = '0.6';
  buttonClick.style.pointerEvents = 'none';

  try {
    if (isEmployer) {
      const organizationName = document.querySelector('#company-name-input').value.trim();
      await api.post('/auth/register/employer', { firstName, lastName, email, password, organizationName });
    } else {
      const loginData = await api.post('/auth/register/candidate', { firstName, lastName, email, password });
    }

    // Auto-login after registration
    await wait(2000);
    const loginData = await api.post('/auth/login', { email, password });

    saveSession(loginData);

    window.location.href = isEmployer
      ? '../browse-candidates/browse-candidates.html'
      : '../set-up-account/set-up-account-candidate.html';

  } catch (err) {
    errorBanner.textContent        = err.message || 'Registration failed. Please try again.';
    errorBanner.style.display      = 'block';
    buttonClick.style.opacity      = '';
    buttonClick.style.pointerEvents = '';
  }
});
