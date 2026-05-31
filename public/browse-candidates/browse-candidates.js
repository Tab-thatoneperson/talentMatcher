if (!getToken() || getRole() !== 'employer') {
  window.location.href = '/login/login-employer.html';
}

const searchInput        = document.querySelector('#search-input');
const locationInput      = document.querySelector('#location-input');
const searchBtn          = document.querySelector('#search-btn');
const filterAvailability = document.querySelector('#filter-availability');
const filterExperience   = document.querySelector('#filter-experience');
const filterSkills       = document.querySelector('#filter-skills');
const filterIndustry     = document.querySelector('#filter-industry');
const candidatesList     = document.querySelector('#candidates-list');
const resultsCount       = document.querySelector('#results-count');
const clearBtn           = document.querySelector('#clear-filters');
const jobSelector        = document.querySelector('#job-selector');
const recommendBtn       = document.querySelector('#recommend-btn');

const FILTER_SELECTS = [filterAvailability, filterExperience, filterSkills, filterIndustry];

let allCandidates = [];
let inRecommendMode = false;

// ── Load employer's own jobs into the selector ────────────────────────────────
async function loadMyJobs() {
  try {
    const jobs = await api.get('/jobs/mine');
    if (!Array.isArray(jobs) || jobs.length === 0) return;
    jobs.forEach(j => {
      const opt = document.createElement('option');
      opt.value = j.id;
      opt.textContent = j.title;
      jobSelector.appendChild(opt);
    });
    jobSelector.disabled = false;
  } catch { /* employer may have no jobs yet */ }
}

jobSelector.addEventListener('change', () => {
  recommendBtn.disabled = !jobSelector.value;
  if (inRecommendMode && !jobSelector.value) {
    inRecommendMode = false;
    recommendBtn.classList.remove('active');
    loadCandidates();
  }
});

// ── Filter helpers ────────────────────────────────────────────────────────────
function updateClearBtn() {
  const active = FILTER_SELECTS.some(s => s.value) || locationInput.value.trim();
  clearBtn.style.display = active ? 'inline-block' : 'none';
  FILTER_SELECTS.forEach(s => s.classList.toggle('active', !!s.value));
}

function clearFilters() {
  FILTER_SELECTS.forEach(s => { s.value = ''; s.classList.remove('active'); });
  locationInput.value = '';
  clearBtn.style.display = 'none';
  renderCandidates();
}

// ── Data loading ──────────────────────────────────────────────────────────────
function setRecommendMode(on) {
  inRecommendMode = on;
  recommendBtn.classList.toggle('active', on);
}

async function loadCandidates() {
  setRecommendMode(false);
  const query = searchInput.value.trim();
  candidatesList.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">Loading...</p>';
  resultsCount.textContent = '';
  try {
    allCandidates = query
      ? await api.getQ('/candidates/search', { q: query })
      : await api.get('/candidates');
    allCandidates = Array.isArray(allCandidates) ? allCandidates : [];
    renderCandidates();
  } catch (err) {
    candidatesList.innerHTML = `<p style="color:#721c24;text-align:center;padding:20px;">${escHtml(err.message)}</p>`;
  }
}

async function loadRecommendations() {
  const jobId = jobSelector.value;
  if (!jobId) return;
  setRecommendMode(true);
  candidatesList.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">Finding best candidates…</p>';
  resultsCount.textContent = '';
  try {
    allCandidates = await api.get(`/jobs/${jobId}/recommendations`);
    allCandidates = Array.isArray(allCandidates) ? allCandidates : [];
    renderCandidates();
  } catch (err) {
    candidatesList.innerHTML = `<p style="color:#721c24;text-align:center;padding:20px;">${escHtml(err.message)}</p>`;
  }
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderCandidates() {
  const avail    = filterAvailability.value;
  const expLevel = filterExperience.value;
  const skill    = filterSkills.value;
  const industry = filterIndustry.value;
  const locQuery = locationInput.value.trim().toLowerCase();

  const filtered = allCandidates.filter(c => {
    if (avail    && c.availability       !== avail)    return false;
    if (expLevel && c.experienceLevel    !== expLevel) return false;
    if (industry && c.industryPreference !== industry) return false;
    if (skill) {
      const hasSkill = (c.skills || []).some(s => (s.name || s) === skill);
      if (!hasSkill) return false;
    }
    if (locQuery) {
      const city    = (c.location?.city    || '').toLowerCase();
      const country = (c.location?.country || '').toLowerCase();
      if (!city.includes(locQuery) && !country.includes(locQuery)) return false;
    }
    return true;
  });

  updateClearBtn();

  if (filtered.length === 0) {
    candidatesList.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">No candidates found.</p>';
    resultsCount.textContent = '0 candidates';
    return;
  }

  resultsCount.textContent = inRecommendMode
    ? `Top ${filtered.length} match${filtered.length !== 1 ? 'es' : ''} for "${jobSelector.options[jobSelector.selectedIndex]?.text}"`
    : `Showing ${filtered.length} candidate${filtered.length !== 1 ? 's' : ''}`;

  candidatesList.innerHTML = filtered.map((c, i) => {
    const first    = c.firstName || '';
    const last     = c.lastName  || '';
    const initials = ((first[0] || '?') + (last[0] || '?')).toUpperCase();
    const city     = c.location?.city    ? escHtml(c.location.city)    : '';
    const country  = c.location?.country ? escHtml(c.location.country) : '';
    const location = [city, country].filter(Boolean).join(', ');
    const expTag   = c.experienceLevel    ? `<span class="tag tag-green">${escHtml(c.experienceLevel)}</span>`    : '';
    const indTag   = c.industryPreference ? `<span class="tag tag-grey">${escHtml(c.industryPreference)}</span>` : '';
    const skillTags = (c.skills || []).slice(0, 3)
      .map(s => `<span class="tag tag-grey">${escHtml(s.name || s)}</span>`)
      .join('');
    const rankBadge = inRecommendMode
      ? `<span class="rank-badge">#${i + 1} match</span>`
      : '';

    return `
      <div class="card">
        <div class="card-header">
          <div class="avatar">${escHtml(initials)}</div>
          <div class="details">
            <h2>${escHtml(first)} ${escHtml(last)}${rankBadge}</h2>
            <p class="meta-text">${location}</p>
            <div class="tag-group">${expTag}${indTag}${skillTags}</div>
          </div>
        </div>
        <div class="actions-row">
          <span class="text-link" style="cursor:pointer;">View profile</span>
          <button class="btn btn-primary btn-sm">Contact</button>
        </div>
      </div>
    `;
  }).join('');
}

// ── Events ────────────────────────────────────────────────────────────────────
searchBtn.addEventListener('click', loadCandidates);
searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') loadCandidates(); });
recommendBtn.addEventListener('click', () => {
  if (inRecommendMode) {
    loadCandidates();
  } else {
    loadRecommendations();
  }
});
locationInput.addEventListener('input', renderCandidates);
filterAvailability.addEventListener('change', renderCandidates);
filterExperience.addEventListener('change', renderCandidates);
filterSkills.addEventListener('change', renderCandidates);
filterIndustry.addEventListener('change', renderCandidates);
clearBtn.addEventListener('click', clearFilters);

// ── Boot ──────────────────────────────────────────────────────────────────────
loadMyJobs();
loadCandidates();
