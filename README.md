# Intelligent Talent Matching Platform (ITMP)
CSIT314 Group Project — Django + PostgreSQL

---

## Team Setup (do this once each)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_TEAM/itmp.git
cd itmp
```

### 2. Create a virtual environment
```bash
python -m venv venv

# Mac/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Set up environment variables
```bash
cp .env.example .env
```
Then open `.env` and fill in your local PostgreSQL credentials.

### 5. Create the database
Open pgAdmin (or psql) and create a database called `itmp_db` (or whatever you put in `.env`).

### 6. Run migrations
```bash
python manage.py migrate
```

### 7. Create a superuser (optional, for admin panel)
```bash
python manage.py createsuperuser
```

### 8. Run the dev server
```bash
python manage.py runserver
```
Visit: http://127.0.0.1:8000

---

## Git Workflow

**Never commit directly to `main`.** Always work on your own branch.

```bash
# Start new work
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# Save your work
git add .
git commit -m "Add job listing page"
git push origin feature/your-feature-name
```

Then open a Pull Request on GitHub for a teammate to review before merging.

### Branch naming
| Type | Example |
|---|---|
| New page/feature | `feature/job-detail-page` |
| Bug fix | `fix/login-redirect-error` |
| Styling | `style/candidate-card-layout` |

---

## Project Structure

```
itmp/
├── manage.py
├── requirements.txt
├── .env                  ← YOUR local secrets (never commit)
├── .env.example          ← Template — commit this
├── .gitignore
├── itmp/                 ← Django config
│   ├── settings.py
│   └── urls.py
├── accounts/             ← Login, Register, User model
├── jobs/                 ← Job listings, Post job, Dashboards
├── candidates/           ← Candidate list, Profile
├── static/
│   └── css/main.css      ← Global styles — edit here
└── templates/
    ├── base.html          ← Shared layout + navbar
    ├── accounts/
    ├── jobs/
    ├── candidates/
    └── employer/
```

---

## Page → Template mapping

| Page | Template | Owner |
|---|---|---|
| Login | `accounts/login.html` | Teammate |
| Register Candidate | `accounts/register_candidate.html` | Teammate |
| Register Employer | `accounts/register_employer.html` | Teammate |
| Candidate Profile Setup | `accounts/candidate_setup.html` | Teammate |
| Browse Jobs | `jobs/job_list.html` | Lucas |
| Job Detail | `jobs/job_detail.html` | Lucas |
| Post a Job | `jobs/post_job.html` | Lucas |
| Browse Candidates | `candidates/candidate_list.html` | Lucas |
| Candidate Profile | `candidates/candidate_profile.html` | Lucas |
| Candidate Dashboard | `candidates/dashboard.html` | TBD |
| Employer Dashboard | `employer/dashboard.html` | TBD |

---

## CSS Variables (main.css)

All colours are set as CSS variables — change them in one place:

| Variable | Value | Used for |
|---|---|---|
| `--green` | `#3BB54A` | Brand colour, buttons, links |
| `--green-dark` | `#2e9e3b` | Button hover |
| `--green-light` | `#e8f7ea` | Tag backgrounds, highlights |
| `--text` | `#111111` | Body text |
| `--text-muted` | `#666666` | Subtitles, labels |
| `--border` | `#d0d0d0` | Card borders, inputs |
| `--bg` | `#f2f2f2` | Page background |

---

## URLs

| URL | View | Name |
|---|---|---|
| `/accounts/login/` | Login | `login` |
| `/accounts/logout/` | Logout | `logout` |
| `/accounts/register/candidate/` | Register Candidate | `register_candidate` |
| `/accounts/register/employer/` | Register Employer | `register_employer` |
| `/accounts/dashboard/` | Role-based redirect | `dashboard` |
| `/jobs/` | Browse Jobs | `job_list` |
| `/jobs/<pk>/` | Job Detail | `job_detail` |
| `/jobs/<pk>/apply/` | Apply | `apply_job` |
| `/jobs/post/` | Post a Job | `post_job` |
| `/jobs/dashboard/candidate/` | Candidate Dashboard | `candidate_dashboard` |
| `/jobs/dashboard/employer/` | Employer Dashboard | `employer_dashboard` |
| `/candidates/` | Browse Candidates | `candidate_list` |
| `/candidates/<pk>/` | Candidate Profile | `candidate_profile` |
