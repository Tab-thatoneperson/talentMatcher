const inputList   = document.querySelectorAll('input');
const buttonClick = document.querySelector('#button-click');
const cancelButton = document.querySelector('#cancel-button');

async function doMembership() {
  console.log('button pressed')
  let hasError = false;

  // for (let i = 0; i < inputList.length; i++) {
  //   if (inputList[i].type === 'checkbox') continue;
  //   const el      = inputList[i];
  //   const wrapper = el.parentElement;
  //   const msg     = wrapper.querySelector('.invalid-message');

  //   if (el.value === '') {
  //     el.style.border = '1px solid red';
  //     if (msg) msg.style.visibility = 'visible';
  //     hasError = true;
  //   } else {
  //     el.style.border = '1px solid #a8a8a8';
  //     if (msg) msg.style.visibility = 'hidden';
  //   }
  // }

  if (hasError) return;

  const cardName = document.querySelector('#cardName').value.trim();
  const cardNumber = document.querySelector('#cardNumber').value;
  const expiryDate = document.querySelector('#expiryDate').value;
  const CVC = document.querySelector('#CVC').value;
  const billingAddress = document.querySelector('#billingAddress').value.trim();

  // errorBanner.style.display = 'none';
  buttonClick.style.opacity = '0.6';
  buttonClick.style.pointerEvents = 'none';

  const payload = {
    isMember:  true,
    cardName:   cardName  || undefined,
    cardNumber:   cardNumber  || undefined,
    expiryDate:   expiryDate  || undefined,
    CVC:   CVC  || undefined,
    billingAddress:   billingAddress  || undefined,
  };

  try {
    // saveMember(true);
    // console.log('try')
    const data = await api.patch('/candidates/me', payload);
    // console.log('no await api')
    saveMember(data);
    window.location.href = getRole() === 'candidate'
      ? '../browse-jobs/browse-jobs.html'
      : '../browse-candidates/browse-candidates.html';
  } catch (err) {
    // errorBanner.textContent = err.message || 'Membership registration failed. Please try again.';
    // errorBanner.style.display = 'block';
    console.log('error caught', err.message)
    buttonClick.style.opacity = '';
    buttonClick.style.pointerEvents = '';
  }
}

function cancel() {
  window.location.href = getRole() === 'candidate'
  ? '../browse-jobs/browse-jobs.html'
  : '../browse-candidates/browse-candidates.html';

}

cancelButton.addEventListener('click', cancel);

buttonClick.addEventListener('click', doMembership);
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') doMembership();
});
