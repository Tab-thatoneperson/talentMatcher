if (!getToken() || getRole() !== 'employer') {
  window.location.href = '/login/login-employer.html';
}

const form        = document.querySelector('#post-job-form');
const errorBanner = document.querySelector('#form-error');
const successBanner = document.querySelector('#form-success');
const skillsInput = document.querySelector('#skills-input');
const skillsTags  = document.querySelector('#skills-tags');
const saveDraft   = document.querySelector('#save-draft');
const submitBtn   = form.querySelector('button[type="submit"]');

const skills = [];

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

function buildPayload(status) {
  const title          = document.querySelector('#job-title').value.trim();
  const description    = document.querySelector('#job-description').value.trim();
  const locationRaw    = document.querySelector('#job-location').value.trim();
  const jobType        = document.querySelector('#job-type').value;
  const experienceLevel = document.querySelector('#experience-level').value;
  const salaryMin      = document.querySelector('#salary-min').value;
  const salaryMax      = document.querySelector('#salary-max').value;
  const period         = document.querySelector('#salary-period').value;
  const deadline       = document.querySelector('#application-deadline').value;

  if (!title || !description) {
    errorBanner.textContent = 'Job title and description are required.';
    errorBanner.style.display = 'block';
    return null;
  }

  const [city, ...rest] = locationRaw.split(',').map(s => s.trim());

  return {
    title,
    description,
    location: {
      city: city || locationRaw || undefined,
      country: rest.join(', ').trim() || undefined,
    },
    requiredSkills: skills.map(name => ({ name })),
    employmentType:  jobType        || undefined,
    experienceLevel: experienceLevel || undefined,
    salaryRange: (salaryMin || salaryMax) ? {
      min:      salaryMin ? Number(salaryMin) : undefined,
      max:      salaryMax ? Number(salaryMax) : undefined,
      currency: 'AUD',
      period:   period   || 'year',
    } : undefined,
    expiresAt: deadline || undefined,
    status,
  };
}

async function submitJob(status) {
  errorBanner.style.display = 'none';
  successBanner.style.display = 'none';

  const payload = buildPayload(status);
  if (!payload) return;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Posting...';

  try {
    await api.post('/jobs', payload);
    successBanner.style.display = 'block';
    form.reset();
    skills.length = 0;
    skillsTags.innerHTML = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    errorBanner.textContent = err.message || 'Failed to post job. Please try again.';
    errorBanner.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Post Job';
  }
}

form.addEventListener('submit', e => {
  e.preventDefault();
  submitJob('active');
});

saveDraft.addEventListener('click', e => {
  e.preventDefault();
  submitJob('draft');
});
