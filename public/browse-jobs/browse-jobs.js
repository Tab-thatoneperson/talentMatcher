if (!getToken() || getRole() !== 'candidate') {
  window.location.href = '/login/login.html';
}

if (isMember() === 'true') {
  document.getElementById('member-link').style.display = 'none';
}

const searchInput    = document.querySelector('#search-input');
const locationInput  = document.querySelector('#location-input');
const searchBtn      = document.querySelector('#search-btn');
const recommendBtn   = document.querySelector('#recommend-btn');
const filterType     = document.querySelector('#filter-type');
const filterIndustry = document.querySelector('#filter-industry');
const filterSalary   = document.querySelector('#filter-salary');
const filterExp      = document.querySelector('#filter-experience');
const jobsList       = document.querySelector('#jobs-list');
const resultsCount   = document.querySelector('#results-count');
const clearBtn       = document.querySelector('#clear-filters');
const profileGate    = document.querySelector('#profile-gate');
const browseContent  = document.querySelector('#browse-content');

const FILTER_SELECTS = [filterType, filterIndustry, filterSalary, filterExp];

let allJobs = [];
let inRecommendMode = false;

// ── Resume gate ──────────────────────────────────────────────────────────────
async function checkProfile() {
  try {
    const profile = await api.get('/candidates/me');
    if (!profile.skills || profile.skills.length === 0) {
      profileGate.style.display = 'block';
      browseContent.style.display = 'none';
      return false;
    }
  } catch {
    profileGate.style.display = 'block';
    browseContent.style.display = 'none';
    return false;
  }
  return true;
}

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
  renderJobs();
}

// ── Data loading ──────────────────────────────────────────────────────────────
function setRecommendMode(on) {
  inRecommendMode = on;
  recommendBtn.classList.toggle('active', on);
}

async function loadJobs() {
  setRecommendMode(false);
  const query = searchInput.value.trim();
  jobsList.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">Loading...</p>';
  resultsCount.textContent = '';
  try {
    allJobs = query
      ? await api.getQ('/jobs/search', { q: query })
      : await api.get('/jobs');
    allJobs = Array.isArray(allJobs) ? allJobs : [];
    renderJobs();
  } catch (err) {
    jobsList.innerHTML = `<p style="color:#721c24;text-align:center;padding:20px;">${escHtml(err.message)}</p>`;
  }
}

async function loadRecommendations() {
  setRecommendMode(true);
  jobsList.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">Loading recommendations...</p>';
  resultsCount.textContent = '';
  try {
    allJobs = await api.get('/jobs/recommendations');
    allJobs = Array.isArray(allJobs) ? allJobs : [];
    renderJobs();
  } catch (err) {
    jobsList.innerHTML = `<p style="color:#721c24;text-align:center;padding:20px;">${escHtml(err.message)}</p>`;
  }
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderJobs() {
  const type     = filterType.value;
  const exp      = filterExp.value;
  const industry = filterIndustry.value;
  const locQuery = locationInput.value.trim().toLowerCase();
  const [salaryMin, salaryMax] = filterSalary.value
    ? filterSalary.value.split('-').map(Number)
    : [null, null];

  let filtered = allJobs.filter(j => {
    if (type     && j.employmentType  !== type)    return false;
    if (exp      && j.experienceLevel !== exp)      return false;
    if (industry && j.industry        !== industry) return false;
    if (salaryMin !== null && (j.salaryRange?.min ?? 0) < salaryMin) return false;
    if (salaryMax !== null && (j.salaryRange?.min ?? 0) > salaryMax) return false;
    if (locQuery) {
      const city    = (j.location?.city    || '').toLowerCase();
      const country = (j.location?.country || '').toLowerCase();
      if (!city.includes(locQuery) && !country.includes(locQuery)) return false;
    }
    return true;
  });

  updateClearBtn();

  const modeLabel = inRecommendMode ? 'top match' : 'result';

  if (filtered.length === 0) {
    jobsList.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">No jobs found.</p>';
    resultsCount.textContent = '0 results';
    return;
  }

  // if not membership then max 10
  if (isMember() === 'false'){
    filtered = filtered.slice(0, 10);
  }
  

  resultsCount.textContent = inRecommendMode
    ? `Your top ${filtered.length} job match${filtered.length !== 1 ? 'es' : ''}`
    : `Showing ${filtered.length} ${modeLabel}${filtered.length !== 1 ? 's' : ''}`;

  jobsList.innerHTML = filtered.map((job, i) => {
    const city     = job.location?.city    ? escHtml(job.location.city)    : '';
    const country  = job.location?.country ? escHtml(job.location.country) : '';
    const location = [city, country].filter(Boolean).join(', ');
    const typeTag  = job.employmentType  ? `<span class="tag tag-green">${escHtml(job.employmentType)}</span>`  : '';
    const expTag   = job.experienceLevel ? `<span class="tag tag-green">${escHtml(job.experienceLevel)}</span>` : '';
    const indTag   = job.industry        ? `<span class="tag tag-grey">${escHtml(job.industry)}</span>`         : '';
    const salary   = job.salaryRange?.min
      ? `<span class="tag tag-grey">$${job.salaryRange.min.toLocaleString()} – $${(job.salaryRange.max || '?').toLocaleString()}</span>`
      : '';
    const rankBadge = inRecommendMode
      ? `<span class="rank-badge">#${i + 1} match</span>`
      : '';

    return `
      <div class="card" style="padding-bottom:50px">
        <div id="${job.id}card" class="details">
          <h2>${escHtml(job.title)}${rankBadge}</h2>
          <p class="meta-text">${escHtml(job.companyName || '')}${location ? ' &bull; ' + location : ''}</p>
          <div class="tag-group">${typeTag}${expTag}${indTag}${salary}</div>
        </div>
        <div class="actions-row">
          <button id='${job.id}' onclick="moreDetails()" class="viewDetails btn btn-primary btn-sm">View details</button>
        </div>
      </div>
    `;
  }).join('');
}

async function moreDetails() {
  var btn = document.activeElement;
  console.log('button pressed', btn.id);
  try {
      job = await api.get(`/jobs/${btn.id}`);
      console.log(job);

      // const jobCards = document.querySelectorAll(`.details`);
      // console.log(jobCards)
      console.log('just before get job card')
      const jobCard = document.getElementById(`${job.id}card`);
      console.log(jobCard)

      const remote = job.location.remote ? `<span class="tag tag-grey">Remote</span>` : `<span class="tag tag-grey">On-site</span>`;

      jobCard.innerHTML +=
       `
        <div class="details">
          <h2>More Details</h2>
          <p class="meta-text" style="font-size:14px">${escHtml(job.description || '')}</p>
          <div class="tag-group">
            <span class="tag tag-grey">Expires at: ${escHtml(job.expiresAt)}</span>
            ${remote}                
          </div>
          <p class="meta-text" style="margin-top:20px">Required skills: </p>
          <div class="tag-group" style="margin-top:-10px">
        
      `;

      job.requiredSkills.forEach(element => {
        jobCard.innerHTML +=
          `
            <span class="tag tag-green">${escHtml(element.name)}</span>              
          `;
      });

      jobCard.innerHTML += 
      `
          </div>
        </div>
      `;

      btn.parentNode.removeChild(btn);  


    } catch (err) {
      console.log(err.message);
    }

}

// ── Events ────────────────────────────────────────────────────────────────────
searchBtn.addEventListener('click', loadJobs);
searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') loadJobs(); });
recommendBtn.addEventListener('click', () => {
  if (inRecommendMode) {
    loadJobs();
  } else {
    loadRecommendations();
  }
});
locationInput.addEventListener('input', renderJobs);
filterType.addEventListener('change', renderJobs);
filterIndustry.addEventListener('change', renderJobs);
filterSalary.addEventListener('change', renderJobs);
filterExp.addEventListener('change', renderJobs);
clearBtn.addEventListener('click', clearFilters);

// ── Boot ──────────────────────────────────────────────────────────────────────
checkProfile().then(ok => { if (ok) loadJobs(); });
