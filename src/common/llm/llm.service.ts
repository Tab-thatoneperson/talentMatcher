import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

function buildExtractionPrompt(today: string): string {
  return `You are an expert resume parser. Extract ALL structured candidate information from the resume text with maximum detail and completeness.

Today's date is ${today}. Use this exact date for all duration and experience calculations, especially for current roles where endDate is null (meaning still employed as of today).

Return ONLY valid JSON matching this exact schema — no prose, no markdown fences, no extra keys:

{
  "firstName": "",
  "lastName": "",
  "location": { "city": "", "country": "" },
  "summary": "",
  "skills": [{ "name": "", "proficiencyLevel": 3, "yearsOfExperience": 0 }],
  "experience": [{ "title": "", "company": "", "description": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM", "current": false }],
  "education": [{ "degree": "", "institution": "", "field": "", "graduationYear": 0 }],
  "availability": "immediate",
  "preferredJobTypes": ["fulltime"],
  "experienceLevel": "mid",
  "industryPreference": ""
}

RULES — follow every rule strictly:

SUMMARY:
- Write exactly 3 to 5 full sentences.
- Cover: overall career trajectory, years of experience, core technical expertise, domain specialisations, seniority level, and any standout achievements or impact.
- A single sentence is never acceptable. Capture the candidate's full professional story.

EXPERIENCE — description field:
- Write exactly 2 to 4 full sentences per role.
- Cover: primary responsibilities, key achievements with concrete metrics or numbers where present (e.g. "reduced deployment time by 60%"), technologies actively used in that role, and business or team impact.
- A single sentence is never acceptable.
- startDate and endDate must be formatted as YYYY-MM. If only a year is given on the resume, use YYYY-01.
- endDate is null and current is true when the candidate is still in that role. Use today (${today}) when calculating duration for such roles.

SKILLS — extraction:
- Extract EVERY skill mentioned anywhere in the resume: job description bullets, project descriptions, education courses, certifications, tools sections — not only a dedicated "Skills" section.
- Include programming languages, frameworks, libraries, databases, cloud platforms, DevOps tools, methodologies, and relevant soft skills.

SKILLS — yearsOfExperience:
- For each skill, identify every role and project on the resume where that skill was used.
- Sum the month-counts of those roles. For current roles, count months from startDate to today (${today}).
- Divide total months by 12 and round to one decimal place. Store as a number (e.g. 3.5).

SKILLS — proficiencyLevel (integer 1–5):
- 1 = beginner: less than 6 months of use.
- 2 = basic: 6 to 18 months of use.
- 3 = intermediate: 1.5 to 3 years of use.
- 4 = advanced: 3 to 6 years of use, or used in a senior/lead capacity.
- 5 = expert: 6+ years of use, or demonstrably leading, architecting, or publishing in that area.
- Infer from total usage time combined with role seniority titles.

EXPERIENCE LEVEL — experienceLevel field:
- Calculate the candidate's total professional work experience in years as of today (${today}).
- Sum all non-overlapping work experience periods across all jobs. For current roles use today as the end date.
- Map total years to a level:
  - "junior" — less than 2 years total professional experience
  - "mid"    — 2 years up to (but not including) 5 years
  - "senior" — 5 years up to (but not including) 8 years
  - "lead"   — 8 or more years, OR the resume shows explicit leadership titles (Lead, Principal, Head of, Director, VP, CTO, etc.)
- If work experience dates are entirely absent from the resume, use null.

INDUSTRY PREFERENCE — industryPreference field:
- Identify the primary industry the candidate has worked in based on their employers, job titles, and domain keywords.
- Choose the single best match from this list only: Technology, Finance, Healthcare, Engineering, Marketing, Education, Sales, Other.
- Technology: software, IT, SaaS, data, AI/ML, cybersecurity, cloud, telecommunications.
- Finance: banking, investment, insurance, accounting, fintech, payments.
- Healthcare: hospitals, medical devices, pharma, health services, NDIS.
- Engineering: civil, mechanical, electrical, structural, mining, construction.
- Marketing: advertising, brand, content, SEO, PR, media.
- Education: schools, universities, e-learning, EdTech, training.
- Sales: sales teams, customer success, retail, business development.
- Other: hospitality, legal, HR, government, non-profit, or any domain not above.
- If no clear industry can be determined, use null.

EDUCATION:
- degree: Full degree name (e.g. "Bachelor of Science", "Master of Engineering").
- field: Major or field of study.
- graduationYear: Four-digit integer. If not stated, use null.

AVAILABILITY / PREFERREDJOB TYPES:
- Extract only if explicitly stated in the resume.
- If not stated, default to "immediate" and ["fulltime"].

MISSING VALUES:
- Use null for absent strings or numbers.
- Use [] for absent arrays.
- Never fabricate or guess information not present in the resume.`;
}

function extractRootObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\' && inString) {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

@Injectable()
export class LlmService {
  private readonly genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY ?? '',
  );

  async extractResumeData(rawText: string): Promise<Record<string, unknown>> {
    const today = new Date().toISOString().slice(0, 10);

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite-preview',
      systemInstruction: buildExtractionPrompt(today),
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent(
      `Resume text to parse:\n\n${rawText.slice(0, 20_000)}`,
    );
    const raw = result.response.text();

    // Model sometimes appends prose after the closing brace.
    // Track brace depth (respecting strings) to find the exact end of the root object.
    const jsonStr = extractRootObject(raw);
    if (!jsonStr) return {};

    try {
      return JSON.parse(jsonStr) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
}
