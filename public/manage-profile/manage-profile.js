if (!getToken() || getRole() !== 'candidate') {
  window.location.href = '/login/login-candidate.html';
}

const form          = document.querySelector('#manage-profile-form');
const errorBanner   = document.querySelector('#form-error');
const successBanner = document.querySelector('#form-success');
const avatarDisplay = document.querySelector('#avatar-display');
const skillsInput   = document.querySelector('#skills-input');
const skillsTags    = document.querySelector('#skills-tags');
const resumeDropArea   = document.querySelector('#resume-drop-area');
const resumeFileInput  = document.querySelector('#resume-file-input');
const resumeStatus     = document.querySelector('#resume-status');
const submitBtn        = form.querySelector('button[type="submit"]');

const skills = [];

// ── Load profile ───────────────────────────────────────────────────────────
async function loadProfile() {
  try {
    const p = await api.get('/candidates/me');

    if (p.firstName) document.querySelector('#first-name').value = p.firstName;
    if (p.lastName)  document.querySelector('#last-name').value  = p.lastName;
    if (p.email)     document.querySelector('#profile-email').value = p.email;

    if (p.location?.city || p.location?.country) {
      document.querySelector('#profile-location').value =
        [p.location.city, p.location.country].filter(Boolean).join(', ');
    }

    if (p.summary) document.querySelector('#bio').value = p.summary;

    const first = p.firstName || '';
    const last  = p.lastName  || '';
    avatarDisplay.textContent = ((first[0] || '?') + (last[0] || '?')).toUpperCase();

    if (Array.isArray(p.skills) && p.skills.length) {
      skills.length = 0;
      skillsTags.innerHTML = '';
      p.skills.forEach(s => {
        const name = typeof s === 'string' ? s : s.name;
        if (name) { skills.push(name); renderSkillTag(name); }
      });
    }
  } catch (err) {
    errorBanner.textContent = `Could not load profile: ${err.message}`;
    errorBanner.style.display = 'block';
  }
}

// ── Skills tag input ───────────────────────────────────────────────────────
skillsInput.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const skill = skillsInput.value.trim();
  if (skill && !skills.includes(skill)) {
    skills.push(skill);
    renderSkillTag(skill);
    skillsInput.value = '';
  }
});

function renderSkillTag(skill) {
  const tag = document.createElement('span');
  tag.className = 'tag tag-grey';
  tag.style.cursor = 'pointer';
  tag.textContent = `${skill} ×`;
  tag.addEventListener('click', () => {
    skills.splice(skills.indexOf(skill), 1);
    skillsTags.removeChild(tag);
  });
  skillsTags.appendChild(tag);
}

// ── Resume upload ──────────────────────────────────────────────────────────
resumeDropArea.addEventListener('click', () => resumeFileInput.click());

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(ev => {
  resumeDropArea.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); });
});

resumeDropArea.addEventListener('drop', e => {
  if (e.dataTransfer.files.length) {
    resumeFileInput.files = e.dataTransfer.files;
    resumeFileInput.dispatchEvent(new Event('change'));
  }
});

resumeFileInput.addEventListener('change', async () => {
  if (!resumeFileInput.files.length) return;
  const file = resumeFileInput.files[0];
  resumeStatus.textContent = `Uploading and parsing ${file.name}…`;
  resumeStatus.style.color = '#666';

  const formData = new FormData();
  formData.append('file', file);

  try {
    await api.uploadPatch('/candidates/me/resume', formData);
    resumeStatus.textContent = `✓ ${file.name} parsed — profile updated`;
    resumeStatus.style.color = '#155724';
    // Reload profile fields so new skills / experience level appear immediately
    skills.length = 0;
    skillsTags.innerHTML = '';
    await loadProfile();
  } catch (err) {
    resumeStatus.textContent = `Upload failed: ${err.message}`;
    resumeStatus.style.color = '#721c24';
  }
});

// ── Save profile ───────────────────────────────────────────────────────────
form.addEventListener('submit', async e => {
  e.preventDefault();
  errorBanner.style.display = 'none';
  successBanner.style.display = 'none';

  const firstName   = document.querySelector('#first-name').value.trim();
  const lastName    = document.querySelector('#last-name').value.trim();
  const locationRaw = document.querySelector('#profile-location').value.trim();
  const summary     = document.querySelector('#bio').value.trim();

  const [city, ...rest] = locationRaw.split(',').map(s => s.trim());

  const payload = {
    firstName:  firstName || undefined,
    lastName:   lastName  || undefined,
    location: {
      city:    city || locationRaw || undefined,
      country: rest.join(', ').trim() || undefined,
    },
    summary: summary || undefined,
    skills:  skills.map(name => ({ name })),
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving…';

  try {
    await api.patch('/candidates/me', payload);
    successBanner.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { successBanner.style.display = 'none'; }, 4000);
  } catch (err) {
    errorBanner.textContent = err.message || 'Failed to save profile. Please try again.';
    errorBanner.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Changes';
  }
});

loadProfile();
