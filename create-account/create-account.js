// shows the password conditions
const getField = document.querySelector("#password-field");

getField.addEventListener("focus", function () {
  const getConditions = document.querySelector(".condition-container");
  getConditions.style.display = "block";
});

getField.addEventListener("blur", function () {
  const getConditions = document.querySelector(".condition-container");
  getConditions.style.display = "none";
});

// check for empty fields
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
      move = true;
    } else {
      eachInput.style.border = "1px solid #a8a8a8";
      invalidMessage.style.visibility = "hidden";
    }
  }

  if (move) {
    event.preventDefault();
  }
});

// make sure pw is not empty
const passwordField = document.querySelector("#password-field");
const validImg = document.querySelectorAll(".condition-container img");

passwordField.addEventListener("input", function () {
  // if not empty
  if (passwordField.value !== "") {
    for (let i = 0; i < validImg.length; i++) {
      validImg[i].src = "../assets/check.png";
    }

    // if still empty
  } else {
    for (let i = 0; i < validImg.length; i++) {
      validImg[i].src = "../assets/cross.png";
    }
  }
});
