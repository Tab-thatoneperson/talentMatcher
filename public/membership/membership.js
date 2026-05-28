
const getField = document.querySelector("#password-field");


const inputList = document.querySelectorAll("input");
const buttonClick = document.querySelector("#button-click");

buttonClick.addEventListener("click", function () {
  let move = false;
  for (let i = 0; i < inputList.length; i++) {
    if (inputList[i].type === "checkbox") {
      continue;
    }

    const eachInput = inputList[i];
    const getWrapper = eachInput.parentElement;
    const invalidMessage = getWrapper.querySelector(".invalid-message");

    if (eachInput.value === "") {
      eachInput.style.border = "1px solid red";
      invalidMessage.style.visibility = "visible";
    } else {
      eachInput.style.border = "1px solid #a8a8a8";
      invalidMessage.style.visibility = "hidden";
    }
  }

    if (move) {
    event.preventDefault();
  }
});
