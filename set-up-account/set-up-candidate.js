// candidate drag/drop functionality - REMOVE IF NEEDED
const fileInput = document.querySelector("#file-input");
const fileName = document.querySelector("#file-name");
const dropArea = document.querySelector("#drop-area");
const uploadImg = document.querySelector("#upload-img");
const uploadText = document.querySelector("#upload-text");

const clickCross = document.querySelector(".cross-img");
const outputContainer = document.querySelector(".output-container");
const originalText = uploadText.innerHTML;

fileInput.addEventListener("change", function () {
  if (fileInput.files.length > 0) {
    fileName.textContent = fileInput.files[0].name;
    outputContainer.classList.add("show");
    uploadImg.src = "../assets/check-ring.png";
    uploadText.textContent = "File uploaded successfully!";
  } else {
    fileName.textContent = "No File Chosen";
    outputContainer.classList.remove("show");
  }
});

// Prevent default drag/drop behaviour
["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

["dragenter", "dragover"].forEach((eventName) => {
  dropArea.addEventListener(
    eventName,
    () => dropArea.classList.add("dragover"),
    false,
  );
});

["dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(
    eventName,
    () => dropArea.classList.remove("dragover"),
    false,
  );
});

dropArea.addEventListener("drop", handleDrop, false);
function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;

  if (files.length > 0) {
    fileInput.files = files;
    fileName.textContent = files[0].name;
    uploadImg.src = "../assets/check-ring.png";
    uploadText.textContent = "File uploaded successfully!";
    outputContainer.classList.add("show");
  }
}

/**
 * REFERENCE: ELA TECH, 2024,
 * 'How to Createa a Drag & Drop wth Custome File Upload Input in HTML, CSS, and Javascript',
 * Youtube [video], Accessed 9 May 2026, <https://www.youtube.com/watch?v=857gnp0XCaw>
 */

// "delete" file -- only deletes from view, doesn't delete the file itself

clickCross.addEventListener("click", function () {
  fileInput.value = "";
  fileName.textContent = "File";
  outputContainer.classList.remove("show");
  uploadImg.src = "../assets/upload.png";
  uploadText.innerHTML = originalText;

  // revert to the original image
});
