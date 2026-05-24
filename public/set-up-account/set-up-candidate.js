// ── Drag-and-drop file picker ──────────────────────────────────────────────
const fileInput       = document.querySelector('#file-input');
const fileName        = document.querySelector('#file-name');
const dropArea        = document.querySelector('#drop-area');
const uploadImg       = document.querySelector('#upload-img');
const uploadText      = document.querySelector('#upload-text');
const clickCross      = document.querySelector('.cross-img');
const outputContainer = document.querySelector('.output-container');
const originalText    = uploadText.innerHTML;

fileInput.addEventListener('change', function () {
  if (fileInput.files.length > 0) {
    fileName.textContent = fileInput.files[0].name;
    outputContainer.classList.add('show');
    uploadImg.src = '../assets/check-ring.png';
    uploadText.textContent = 'File uploaded successfully!';
  } else {
    fileName.textContent = 'No File Chosen';
    outputContainer.classList.remove('show');
  }
});

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(ev => {
  dropArea.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); });
});

['dragenter', 'dragover'].forEach(ev => {
  dropArea.addEventListener(ev, () => dropArea.classList.add('dragover'));
});
['dragleave', 'drop'].forEach(ev => {
  dropArea.addEventListener(ev, () => dropArea.classList.remove('dragover'));
});

dropArea.addEventListener('drop', e => {
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    fileInput.files = files;
    fileName.textContent = files[0].name;
    uploadImg.src = '../assets/check-ring.png';
    uploadText.textContent = 'File uploaded successfully!';
    outputContainer.classList.add('show');
  }
});

clickCross.addEventListener('click', function () {
  fileInput.value = '';
  fileName.textContent = 'File';
  outputContainer.classList.remove('show');
  uploadImg.src = '../assets/upload.png';
  uploadText.innerHTML = originalText;
});

/**
 * REFERENCE: ELA TECH, 2024,
 * 'How to Create a Drag & Drop with Custom File Upload Input in HTML, CSS, and Javascript',
 * Youtube [video], Accessed 9 May 2026, <https://www.youtube.com/watch?v=857gnp0XCaw>
 */

// ── Skip / Continue ────────────────────────────────────────────────────────
const skipButton     = document.querySelector('.skip-button');
const continueButton = document.querySelector('#button-click');
const errorBanner    = document.querySelector('#upload-error');

const NEXT_PAGE = '../browse-jobs/browse-jobs.html';

skipButton.addEventListener('click', e => {
  e.preventDefault();
  window.location.href = NEXT_PAGE;
});

continueButton.addEventListener('click', async e => {
  e.preventDefault();

  if (!fileInput.files || fileInput.files.length === 0) {
    errorBanner.textContent   = 'Please select a resume file or click Skip.';
    errorBanner.style.display = 'block';
    return;
  }

  errorBanner.style.display       = 'none';
  continueButton.style.opacity    = '0.6';
  continueButton.style.pointerEvents = 'none';

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);

  try {
    await api.upload('/candidates/me/resume', formData);
    window.location.href = NEXT_PAGE;
  } catch (err) {
    errorBanner.textContent        = err.message || 'Upload failed. Please try again.';
    errorBanner.style.display      = 'block';
    continueButton.style.opacity   = '';
    continueButton.style.pointerEvents = '';
  }
});
