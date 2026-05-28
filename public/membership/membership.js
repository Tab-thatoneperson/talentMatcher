const inputList   = document.querySelectorAll('input');
const buttonClick = document.querySelector('#button-click');

buttonClick.addEventListener('click', function () {
  let hasError = false;

  for (const el of inputList) {
    if (el.type === 'checkbox') continue;
    const wrapper      = el.parentElement;
    const invalidMsg   = wrapper.querySelector('.invalid-message');

    if (el.value === '') {
      el.style.border = '1px solid red';
      if (invalidMsg) invalidMsg.style.visibility = 'visible';
      hasError = true;
    } else {
      el.style.border = '1px solid #a8a8a8';
      if (invalidMsg) invalidMsg.style.visibility = 'hidden';
    }
  }

  if (hasError) return;

  // TODO: call membership/payment API here
});
