const inputList   = document.querySelectorAll('.fields');
const buttonClick = document.querySelector('#button-click');
const errorBanner = document.querySelector('#setup-error');

const NEXT_PAGE = '../browse-candidates/browse-candidates.html';

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

  if (hasError) return;

  errorBanner.style.display       = 'none';
  buttonClick.style.opacity       = '0.6';
  buttonClick.style.pointerEvents = 'none';

  // TODO: extend UpdateCompanyDto to support industry and description fields,
  // then send: PATCH /companies/:id with { industry, description }
  // For now, the backend only supports organizationName via PATCH /companies/:id,
  // so we navigate directly to the main dashboard after validation.
  window.location.href = NEXT_PAGE;
});
