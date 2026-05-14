# TalentMatcher — Implementation Plan

## Data Models (Elasticsearch Indices)

### `candidates`
| Field | Type | Notes |
|---|---|---|
| id | keyword | UUID |
| email | keyword | unique |
| passwordHash | keyword | bcrypt |
| firstName, lastName | text/keyword | |
| location | object | city, country |
| summary | text | full-text searchable |
| skills | nested | name, proficiencyLevel (1–5), yearsOfExperience |
| experience | nested | title, company, description, startDate, endDate, current |
| education | nested | degree, institution, field, graduationYear |
| availability | keyword | `immediate` / `2weeks` / `1month` |
| preferredJobTypes | keyword[] | `fulltime`, `parttime`, `contract`, `remote` |
| salaryExpectation | object | min, max, currency |
| createdAt, updatedAt | date | |

### `employers`
| Field | Type | Notes |
|---|---|---|
| id | keyword | UUID |
| email | keyword | unique |
| passwordHash | keyword | bcrypt |
| firstName, lastName | text/keyword | |
| companyId | keyword | ref to companies |
| isAdmin | boolean | true for the employer who registered the company |
| createdAt, updatedAt | date | |

### `companies`
| Field | Type | Notes |
|---|---|---|
| id | keyword | UUID |
| organizationName | text/keyword | |
| createdAt | date | |

### `jobs`
| Field | Type | Notes |
|---|---|---|
| id | keyword | UUID |
| title | text/keyword | |
| description | text | full-text searchable |
| companyId | keyword | ref to companies |
| companyName | keyword | denormalized for perf |
| location | object | city, country, remote (bool) |
| requiredSkills | nested | name, required (bool), minYears |
| salaryRange | object | min, max, currency |
| employmentType | keyword | `fulltime`, `parttime`, `contract` |
| experienceLevel | keyword | `junior`, `mid`, `senior`, `lead` |
| status | keyword | `active`, `closed`, `draft` |
| postedAt, expiresAt, createdAt | date | |

> No `matches` index — recommendations are computed fresh from Elasticsearch on every request.
> No `applications` index — out of scope.

---

## Endpoints

### Auth `/auth`
| Method | Path | Description | FR |
|---|---|---|---|
| `POST` | `/auth/register/candidate` | Register candidate with email + password | FR01 |
| `POST` | `/auth/register/employer` | Single flow — creates company + admin employer | FR09 |
| `POST` | `/auth/login` | Login for both roles, returns JWT `{ role, id, companyId?, isAdmin? }` | FR02 |

### Candidates `/candidates`
| Method | Path | Description | FR |
|---|---|---|---|
| `GET` | `/candidates/me` | View own profile | FR03 |
| `PATCH` | `/candidates/me` | Update profile fields manually | FR05 |
| `DELETE` | `/candidates/me` | Delete account and all associated data | FR05 |
| `POST` | `/candidates/me/resume` | Upload PDF/DOCX → extract via LLM → index into ES | FR04 |
| `PATCH` | `/candidates/me/resume` | Re-upload resume, overwrites extracted fields | FR04, FR05 |
| `GET` | `/candidates` | Employer — list all candidates, `?skills=&education=&experience=` | FR12, FR13 |
| `GET` | `/candidates/search` | Employer — keyword search `?q=` | FR14 |
| `GET` | `/candidates/:id` | Employer — view single candidate profile | FR12 |

### Employers `/employers`
| Method | Path | Description | FR |
|---|---|---|---|
| `GET` | `/employers/me` | View own profile | — |
| `PATCH` | `/employers/me` | Update own profile | FR10 |
| `DELETE` | `/employers/me` | Delete own account | FR10 |
| `GET` | `/employers` | Admin — list all employers in own company | — |
| `POST` | `/employers` | Admin — add new employer to company | FR09 |
| `PATCH` | `/employers/:id` | Admin — update another employer | — |
| `DELETE` | `/employers/:id` | Admin — remove employer from company | — |

### Jobs `/jobs`
| Method | Path | Description | FR |
|---|---|---|---|
| `GET` | `/jobs` | Candidate — all active listings | FR06 |
| `GET` | `/jobs/mine` | Employer — own company's listings | FR11 |
| `GET` | `/jobs/search` | Candidate — keyword search `?q=` on description | FR07 |
| `GET` | `/jobs/recommendations` | Candidate — top 10 jobs matched to their profile, computed fresh | FR08 |
| `GET` | `/jobs/:id` | Both — single job detail | — |
| `POST` | `/jobs` | Employer — create listing | FR11 |
| `PATCH` | `/jobs/:id` | Employer — update listing | FR11 |
| `DELETE` | `/jobs/:id` | Employer — delete listing | FR11 |
| `GET` | `/jobs/:id/recommendations` | Employer — top 10 candidates for a job, computed fresh | FR15 |

### Companies `/companies`
| Method | Path | Description | FR |
|---|---|---|---|
| `GET` | `/companies/:id` | Both — view company | — |
| `PATCH` | `/companies/:id` | Admin employer only — update company | FR10 |
| `DELETE` | `/companies/:id` | Admin employer only — delete company | FR10 |

**Total: 26 endpoints**

---

## Resume Upload Pipeline

### Flow

```
Frontend                  Backend                            External
   │                         │                                  │
   │  POST /candidates/       │                                  │
   │  me/resume              │                                  │
   │  (multipart PDF/DOCX)   │                                  │
   │────────────────────────▶│                                  │
   │                         │  1. Validate MIME type + size    │
   │                         │     allowed: pdf, docx           │
   │                         │     max: 5MB                     │
   │                         │                                  │
   │                         │  2. Save file temporarily        │
   │                         │     to /tmp on server            │
   │                         │                                  │
   │                         │  3. Extract raw text             │
   │                         │     PDF  → pdf-parse             │
   │                         │     DOCX → mammoth               │
   │                         │                                  │
   │                         │  4. Send raw text ──────────────▶│ Claude API
   │                         │     + extraction prompt          │
   │                         │                                  │
   │                         │◀── structured JSON ──────────────│
   │                         │                                  │
   │                         │  5. Delete temp file from /tmp   │
   │                         │                                  │
   │                         │  6. Merge extracted fields into  │
   │                         │     candidate document           │
   │                         │     (only present fields merged, │
   │                         │      existing fields untouched)  │
   │                         │                                  │
   │                         │  7. Upsert into Elasticsearch    │
   │                         │     candidates index             │
   │                         │                                  │
   │◀────────────────────────│                                  │
   │  200 { candidate }      │                                  │
```

> **File storage policy:** the uploaded file is written to a temporary path on the server (`/tmp`), used only for text extraction, then deleted immediately after extraction completes — regardless of whether extraction succeeds or fails. No file is persisted.

### Validation Rules
| Rule | Detail |
|---|---|
| Allowed MIME types | `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| Max file size | 5 MB |
| Temp storage | `/tmp` — deleted immediately after text extraction |
| Partial extraction | If LLM returns incomplete JSON, only present fields are merged; existing candidate fields are untouched |
| Re-upload | `PATCH /candidates/me/resume` runs the same pipeline and overwrites previously extracted fields |

### New Packages Required
| Package | Purpose |
|---|---|
| `@anthropic-ai/sdk` | Claude API client for LLM extraction |
| `pdf-parse` | Extract raw text from PDF files |
| `mammoth` | Extract raw text from DOCX files |
| `multer` | Multipart file upload handling (ships with NestJS) |
| `@types/multer` | TypeScript types for multer |

### Claude Extraction Prompt
```
Extract structured candidate information from the resume text below.
Return ONLY valid JSON matching this exact shape — no prose, no markdown:

{
  "firstName": "",
  "lastName": "",
  "email": "",
  "location": { "city": "", "country": "" },
  "summary": "",
  "skills": [
    { "name": "", "proficiencyLevel": 1–5, "yearsOfExperience": 0 }
  ],
  "experience": [
    {
      "title": "", "company": "", "description": "",
      "startDate": "YYYY-MM", "endDate": "YYYY-MM or null", "current": false
    }
  ],
  "education": [
    { "degree": "", "institution": "", "field": "", "graduationYear": 0 }
  ],
  "availability": "immediate | 2weeks | 1month",
  "preferredJobTypes": ["fulltime | parttime | contract | remote"]
}

Resume:
{rawText}
```

### New Module Structure
```
src/
  common/
    llm/
      llm.module.ts            ← global module, exports LlmService
      llm.service.ts           ← wraps Claude API, exposes extractResumeData()
  modules/
    candidates/
      candidates.module.ts
      candidates.controller.ts
      candidates.service.ts    ← orchestrates parse → extract → delete file → index
      candidate.repository.ts
      resume/
        resume-parser.service.ts  ← extracts raw text from PDF/DOCX, deletes temp file
```

---

## Frontend Route ↔ Endpoint Map

```
Candidate
├── /register           → POST /auth/register/candidate
│                          POST /candidates/me/resume  (optional at registration)
├── /login              → POST /auth/login
├── /jobs               → GET /jobs
│                          GET /jobs/recommendations   (top 10 panel)
├── /jobs/search        → GET /jobs/search?q=
├── /jobs/:id           → GET /jobs/:id
└── /profile            → GET /candidates/me
                           PATCH /candidates/me
                           PATCH /candidates/me/resume
                           DELETE /candidates/me

Employer
├── /register           → POST /auth/register/employer  (company + admin in one flow)
├── /login              → POST /auth/login
├── /candidates         → GET /candidates?skills=&education=&experience=
│                          GET /candidates/search?q=
├── /candidates/:id     → GET /candidates/:id
├── /jobs               → GET /jobs/mine
├── /jobs/new           → POST /jobs
├── /jobs/:id/edit      → PATCH /jobs/:id
│                          DELETE /jobs/:id
├── /jobs/:id           → GET /jobs/:id
│                          GET /jobs/:id/recommendations  (top 10 panel)
├── /profile            → GET /employers/me
│                          PATCH /employers/me
│                          DELETE /employers/me
├── /company            → GET /companies/:id
│                          PATCH /companies/:id
│                          DELETE /companies/:id
└── /team               → GET /employers              (admin only)
                           POST /employers             (admin only)
                           PATCH /employers/:id        (admin only)
                           DELETE /employers/:id       (admin only)
```

---

## Use Case Coverage

| Use Case | Endpoints | Status |
|---|---|---|
| US1 — Candidate registers account | `POST /auth/register/candidate`, `POST /candidates/me/resume` | ✓ |
| US2 — Candidate browses for jobs | `GET /jobs`, `GET /jobs/search`, `GET /jobs/recommendations`, `GET /jobs/:id` | ✓ |
| US3 — Employer uploads jobs | `POST /jobs`, `PATCH /jobs/:id`, `DELETE /jobs/:id`, `GET /jobs/mine` | ✓ |
| US4 — Manage profile | `GET|PATCH|DELETE /candidates/me`, `PATCH /candidates/me/resume`, `GET|PATCH|DELETE /employers/me`, `PATCH|DELETE /companies/:id` | ✓ |
| US5 — Employer views and searches candidates | `GET /candidates`, `GET /candidates/search`, `GET /candidates/:id`, `GET /jobs/:id/recommendations` | ✓ |
| US6 — Employer registers as organisation | `POST /auth/register/employer`, `POST /employers`, `GET /employers` | ✓ |
