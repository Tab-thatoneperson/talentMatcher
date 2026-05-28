#!/usr/bin/env node
/**
 * Seed script — registers a demo employer and posts 100+ jobs.
 * Idempotent: skips registration if account exists, skips seeding if
 * jobs already exist.
 *
 * Usage:
 *   node scripts/seed.js                          # local (localhost:3000)
 *   API_URL=http://your-ec2-ip node scripts/seed.js
 */

const BASE   = process.env.API_URL || 'http://localhost:3000';
const ES_URL = process.env.ES_URL  || 'http://localhost:9200';

const EMPLOYER = {
  email: 'seed@talentmatcher.dev',
  password: 'Seed@12345',
  firstName: 'Demo',
  lastName: 'Employer',
  organizationName: 'TalentMatcher Demo',
};

const CITIES = [
  { city: 'Sydney',    country: 'Australia' },
  { city: 'Melbourne', country: 'Australia' },
  { city: 'Brisbane',  country: 'Australia' },
  { city: 'Perth',     country: 'Australia' },
  { city: 'Adelaide',  country: 'Australia' },
  { city: 'Canberra',  country: 'Australia' },
  { city: 'Hobart',    country: 'Australia' },
  { city: 'Darwin',    country: 'Australia' },
];

// job templates — title/description/skills vary by level via generators
const TEMPLATES = [
  // ── TECHNOLOGY ──────────────────────────────────────────────────────────
  {
    industry: 'Technology',
    variants: [
      {
        level: 'junior',
        title: 'Junior Frontend Developer',
        description: 'Build responsive UIs in React. Work with a senior mentor, contribute to the design system, and ship real features from your first week.',
        skills: ['React', 'JavaScript', 'CSS', 'HTML'],
        salary: [65000, 85000],
        type: 'fulltime',
      },
      {
        level: 'mid',
        title: 'Frontend Developer',
        description: 'Own major UI features end-to-end. Collaborate with designers and backend engineers to deliver polished, performant interfaces.',
        skills: ['React', 'TypeScript', 'CSS', 'REST APIs'],
        salary: [90000, 115000],
        type: 'fulltime',
      },
      {
        level: 'senior',
        title: 'Senior Frontend Engineer',
        description: 'Lead frontend architecture decisions, drive performance improvements, and mentor a team of three developers.',
        skills: ['React', 'TypeScript', 'Next.js', 'GraphQL'],
        salary: [130000, 160000],
        type: 'fulltime',
      },
      {
        level: 'lead',
        title: 'Principal Frontend Engineer',
        description: 'Set the technical direction for frontend across all products. Own the component library, performance budget, and hiring bar.',
        skills: ['React', 'TypeScript', 'Next.js', 'System Design'],
        salary: [175000, 215000],
        type: 'fulltime',
      },
    ],
  },
  {
    industry: 'Technology',
    variants: [
      {
        level: 'junior',
        title: 'Junior Backend Developer',
        description: 'Build and maintain REST APIs in Node.js. Great introduction to production engineering — you will own small services end-to-end.',
        skills: ['Node.js', 'JavaScript', 'SQL', 'Git'],
        salary: [68000, 88000],
        type: 'fulltime',
      },
      {
        level: 'mid',
        title: 'Backend Engineer',
        description: 'Design and build scalable APIs and data pipelines. Work closely with product to ship new features every sprint.',
        skills: ['Node.js', 'TypeScript', 'PostgreSQL', 'Redis'],
        salary: [95000, 125000],
        type: 'fulltime',
      },
      {
        level: 'senior',
        title: 'Senior Backend Engineer',
        description: 'Architect high-throughput services, improve reliability, and mentor the team on best practices.',
        skills: ['Node.js', 'TypeScript', 'Microservices', 'AWS'],
        salary: [135000, 165000],
        type: 'fulltime',
      },
      {
        level: 'lead',
        title: 'Lead Backend Engineer',
        description: 'Own the API platform strategy. Lead four engineers, drive the monolith-to-microservices migration, and define engineering standards.',
        skills: ['Node.js', 'Microservices', 'Kafka', 'AWS', 'System Design'],
        salary: [170000, 210000],
        type: 'fulltime',
      },
    ],
  },
  {
    industry: 'Technology',
    variants: [
      {
        level: 'mid',
        title: 'Data Scientist',
        description: 'Build predictive models and recommendation engines from large datasets. Collaborate with product to turn ML prototypes into production pipelines.',
        skills: ['Python', 'Machine Learning', 'SQL', 'Pandas'],
        salary: [110000, 140000],
        type: 'fulltime',
      },
      {
        level: 'senior',
        title: 'Senior Data Scientist',
        description: 'Lead ML research projects, design experimentation frameworks, and deploy models at scale using AWS SageMaker.',
        skills: ['Python', 'TensorFlow', 'AWS SageMaker', 'Statistics'],
        salary: [145000, 175000],
        type: 'fulltime',
      },
      {
        level: 'lead',
        title: 'Head of Data Science',
        description: 'Build and lead the data science function. Define the ML strategy, hire the team, and present findings to the board.',
        skills: ['Python', 'Machine Learning', 'Leadership', 'Statistics'],
        salary: [185000, 230000],
        type: 'fulltime',
      },
    ],
  },
  {
    industry: 'Technology',
    variants: [
      {
        level: 'junior',
        title: 'Junior DevOps Engineer',
        description: 'Support CI/CD pipelines and cloud infrastructure on AWS. Learn from a senior DevOps team and own your own services within 3 months.',
        skills: ['Linux', 'Docker', 'AWS', 'Bash'],
        salary: [75000, 95000],
        type: 'fulltime',
      },
      {
        level: 'mid',
        title: 'DevOps Engineer',
        description: 'Maintain and improve CI/CD pipelines, manage cloud infra on AWS, and drive reliability improvements.',
        skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform'],
        salary: [115000, 145000],
        type: 'fulltime',
      },
      {
        level: 'senior',
        title: 'Senior Site Reliability Engineer',
        description: 'Own uptime SLAs for a platform serving 2M users. Drive incident response, capacity planning, and chaos engineering initiatives.',
        skills: ['AWS', 'Kubernetes', 'Prometheus', 'Go', 'Terraform'],
        salary: [150000, 185000],
        type: 'fulltime',
      },
    ],
  },
  {
    industry: 'Technology',
    variants: [
      {
        level: 'mid',
        title: 'Product Manager',
        description: 'Own the roadmap for our core product. Work with engineering, design, and sales to ship features that drive retention.',
        skills: ['Product Strategy', 'Agile', 'Data Analysis', 'Roadmapping'],
        salary: [115000, 145000],
        type: 'fulltime',
      },
      {
        level: 'senior',
        title: 'Senior Product Manager',
        description: 'Lead a product squad of 8. Define OKRs, run discovery sprints, and own a $5M revenue product line.',
        skills: ['Product Strategy', 'Agile', 'Stakeholder Management', 'SQL'],
        salary: [145000, 175000],
        type: 'fulltime',
      },
      {
        level: 'lead',
        title: 'Director of Product',
        description: 'Set product vision across three squads. Recruit and develop PMs, present roadmap to investors, and own the P&L.',
        skills: ['Product Leadership', 'Strategy', 'P&L Management', 'OKRs'],
        salary: [190000, 240000],
        type: 'fulltime',
      },
    ],
  },
  {
    industry: 'Technology',
    variants: [
      {
        level: 'mid',
        title: 'QA Engineer',
        description: 'Build and run automated test suites for a web and mobile platform. Own test coverage metrics and work closely with developers.',
        skills: ['Selenium', 'Cypress', 'JavaScript', 'API Testing'],
        salary: [90000, 115000],
        type: 'fulltime',
      },
      {
        level: 'senior',
        title: 'Senior QA Engineer',
        description: 'Lead the quality strategy. Build end-to-end test automation, run performance testing, and introduce shift-left practices.',
        skills: ['Cypress', 'Playwright', 'k6', 'CI/CD', 'TypeScript'],
        salary: [120000, 150000],
        type: 'fulltime',
      },
    ],
  },
  {
    industry: 'Technology',
    variants: [
      {
        level: 'mid',
        title: 'Cybersecurity Analyst',
        description: 'Monitor threats, respond to incidents, and conduct vulnerability assessments across our cloud and on-premise environments.',
        skills: ['SIEM', 'Penetration Testing', 'AWS Security', 'Python'],
        salary: [105000, 135000],
        type: 'fulltime',
      },
      {
        level: 'senior',
        title: 'Senior Security Engineer',
        description: 'Design security architecture for a fintech platform. Lead pen tests, run the bug bounty programme, and advise on compliance.',
        skills: ['Security Architecture', 'AWS', 'ISO 27001', 'Python'],
        salary: [145000, 180000],
        type: 'fulltime',
      },
    ],
  },
  {
    industry: 'Technology',
    variants: [
      {
        level: 'junior',
        title: 'Mobile Developer (React Native)',
        description: 'Build features on our iOS and Android apps using React Native. Ship to 500k users and iterate quickly based on user feedback.',
        skills: ['React Native', 'JavaScript', 'iOS', 'Android'],
        salary: [75000, 95000],
        type: 'fulltime',
      },
      {
        level: 'mid',
        title: 'iOS Developer',
        description: 'Own iOS features from design to App Store release. Collaborate with designers and backend engineers.',
        skills: ['Swift', 'UIKit', 'SwiftUI', 'REST APIs'],
        salary: [105000, 135000],
        type: 'fulltime',
      },
      {
        level: 'senior',
        title: 'Senior Android Developer',
        description: 'Lead Android development, improve app performance, and introduce modern architecture patterns (Jetpack Compose, Coroutines).',
        skills: ['Kotlin', 'Jetpack Compose', 'Coroutines', 'Android SDK'],
        salary: [135000, 165000],
        type: 'fulltime',
      },
    ],
  },
  // ── FINANCE ─────────────────────────────────────────────────────────────
  {
    industry: 'Finance',
    variants: [
      {
        level: 'junior',
        title: 'Graduate Financial Analyst',
        description: 'Prepare financial models, analyse performance data, and support senior analysts on client engagements.',
        skills: ['Excel', 'Financial Modelling', 'PowerPoint'],
        salary: [65000, 82000],
        type: 'fulltime',
      },
      {
        level: 'mid',
        title: 'Financial Analyst',
        description: 'Build and maintain financial models, prepare board reports, and support the CFO on budgeting and forecasting.',
        skills: ['Financial Modelling', 'Excel', 'SQL', 'Power BI'],
        salary: [95000, 120000],
        type: 'fulltime',
      },
      {
        level: 'senior',
        title: 'Senior Finance Manager',
        description: 'Lead a team of three analysts, own the annual budget cycle, and partner with the CEO on strategic financial decisions.',
        skills: ['Financial Planning', 'Leadership', 'Excel', 'ERP Systems'],
        salary: [135000, 165000],
        type: 'fulltime',
      },
    ],
  },
  {
    industry: 'Finance',
    variants: [
      {
        level: 'mid',
        title: 'Risk Analyst',
        description: 'Identify and quantify market, credit, and operational risks. Prepare risk reports for executive and regulatory audiences.',
        skills: ['Risk Modelling', 'SQL', 'Python', 'Excel'],
        salary: [100000, 130000],
        type: 'fulltime',
      },
      {
        level: 'senior',
        title: 'Senior Risk Manager',
        description: 'Lead the enterprise risk framework, present to the board risk committee, and manage APRA regulatory relationships.',
        skills: ['Risk Frameworks', 'APRA', 'Leadership', 'Python'],
        salary: [145000, 180000],
        type: 'fulltime',
      },
    ],
  },
  {
    industry: 'Finance',
    variants: [
      {
        level: 'mid',
        title: 'Accountant (CPA)',
        description: 'Manage month-end close, statutory reporting, and tax compliance for a mid-sized financial services firm.',
        skills: ['CPA', 'MYOB', 'Xero', 'Tax Compliance'],
        salary: [85000, 110000],
        type: 'fulltime',
      },
      {
        level: 'senior',
        title: 'Financial Controller',
        description: 'Own the full accounting function. Lead month-end, manage external audit, and ensure ASIC compliance.',
        skills: ['CPA', 'IFRS', 'Leadership', 'ERP Systems'],
        salary: [140000, 170000],
        type: 'fulltime',
      },
    ],
  },
  // ── HEALTHCARE ──────────────────────────────────────────────────────────
  {
    industry: 'Healthcare',
    variants: [
      {
        level: 'junior',
        title: 'Graduate Nurse',
        description: 'Complete your transition-to-practice program in a supportive hospital environment with structured mentoring.',
        skills: ['Patient Care', 'AHPRA Registration', 'Clinical Documentation'],
        salary: [65000, 78000],
        type: 'fulltime',
      },
      {
        level: 'mid',
        title: 'Registered Nurse — General Ward',
        description: 'Deliver high-quality patient care in a busy general ward. Work in a multidisciplinary team with access to ongoing professional development.',
        skills: ['AHPRA Registration', 'Medication Administration', 'IV Therapy'],
        salary: [82000, 100000],
        type: 'fulltime',
      },
      {
        level: 'senior',
        title: 'Nurse Unit Manager',
        description: 'Lead and manage a nursing team of 12. Oversee clinical standards, rostering, and staff development.',
        skills: ['Leadership', 'AHPRA Registration', 'Budget Management', 'Clinical Governance'],
        salary: [115000, 140000],
        type: 'fulltime',
      },
    ],
  },
  {
    industry: 'Healthcare',
    variants: [
      {
        level: 'mid',
        title: 'Physiotherapist',
        description: 'Assess and treat patients across a broad caseload in a private practice setting. Flexible hours and professional development budget.',
        skills: ['AHPRA Registration', 'Manual Therapy', 'Exercise Rehabilitation'],
        salary: [80000, 105000],
        type: 'fulltime',
      },
      {
        level: 'senior',
        title: 'Senior Physiotherapist',
        description: 'Lead a team of physios, manage complex cases, and drive service improvement initiatives.',
        skills: ['AHPRA Registration', 'Leadership', 'Sports Rehabilitation', 'Musculoskeletal'],
        salary: [110000, 135000],
        type: 'fulltime',
      },
    ],
  },
  {
    industry: 'Healthcare',
    variants: [
      {
        level: 'mid',
        title: 'Medical Imaging Technologist',
        description: 'Perform CT, MRI, and X-ray imaging in a busy radiology department. Commitment to patient safety and image quality.',
        skills: ['AHPRA Registration', 'MRI', 'CT', 'Patient Communication'],
        salary: [85000, 108000],
        type: 'fulltime',
      },
    ],
  },
  {
    industry: 'Healthcare',
    variants: [
      {
        level: 'mid',
        title: 'Health Data Analyst',
        description: 'Analyse clinical datasets to inform hospital operations and patient outcomes. Build dashboards for clinical leadership.',
        skills: ['SQL', 'Python', 'Tableau', 'HL7 FHIR'],
        salary: [95000, 120000],
        type: 'fulltime',
      },
    ],
  },
  // ── ENGINEERING ─────────────────────────────────────────────────────────
  {
    industry: 'Engineering',
    variants: [
      {
        level: 'junior',
        title: 'Graduate Mechanical Engineer',
        description: 'Design and test components for an industrial equipment manufacturer. Hands-on role with strong mentoring and graduate program structure.',
        skills: ['SolidWorks', 'AutoCAD', 'FEA', 'Engineering Drawing'],
        salary: [68000, 85000],
        type: 'fulltime',
      },
      {
        level: 'mid',
        title: 'Mechanical Engineer',
        description: 'Lead design of mechanical systems for mining equipment. Own projects from concept through to commissioning.',
        skills: ['SolidWorks', 'FEA', 'GD&T', 'Project Management'],
        salary: [95000, 125000],
        type: 'fulltime',
      },
      {
        level: 'senior',
        title: 'Senior Mechanical Engineer',
        description: 'Drive technical excellence on high-value capital projects. Review and approve engineering deliverables and mentor graduate engineers.',
        skills: ['SolidWorks', 'ANSYS', 'AS Standards', 'Leadership'],
        salary: [130000, 160000],
        type: 'fulltime',
      },
    ],
  },
  {
    industry: 'Engineering',
    variants: [
      {
        level: 'mid',
        title: 'Civil Engineer',
        description: 'Deliver infrastructure projects including roads, drainage, and structural works. Strong design and stakeholder skills required.',
        skills: ['AutoCAD', 'Civil 3D', 'Structural Analysis', 'Project Management'],
        salary: [95000, 125000],
        type: 'fulltime',
      },
      {
        level: 'senior',
        title: 'Senior Civil Engineer',
        description: 'Lead technical design on large infrastructure projects. Manage client relationships and mentor the graduate cohort.',
        skills: ['Civil 3D', 'Leadership', 'AS Standards', 'Stakeholder Management'],
        salary: [135000, 165000],
        type: 'fulltime',
      },
    ],
  },
  {
    industry: 'Engineering',
    variants: [
      {
        level: 'mid',
        title: 'Electrical Engineer (Contract)',
        description: 'Six-month contract designing electrical systems for a commercial building project in Sydney CBD.',
        skills: ['AutoCAD Electrical', 'AS/NZS 3000', 'Power Systems', 'Revit MEP'],
        salary: [115000, 140000],
        type: 'contract',
      },
      {
        level: 'senior',
        title: 'Senior Electrical Engineer',
        description: 'Lead electrical design on $50M+ infrastructure projects. Manage a small team and liaise with contractors.',
        skills: ['AutoCAD Electrical', 'Leadership', 'Power Systems', 'HV Systems'],
        salary: [140000, 175000],
        type: 'fulltime',
      },
    ],
  },
  // ── MARKETING ───────────────────────────────────────────────────────────
  {
    industry: 'Marketing',
    variants: [
      {
        level: 'junior',
        title: 'Marketing Coordinator',
        description: 'Support campaign execution across digital channels, manage social media calendars, and report on campaign performance.',
        skills: ['Social Media', 'Copywriting', 'Canva', 'Analytics'],
        salary: [60000, 78000],
        type: 'fulltime',
      },
      {
        level: 'mid',
        title: 'Digital Marketing Manager',
        description: 'Lead performance marketing across paid search, social, and email. Own the acquisition budget and iterate on creative.',
        skills: ['Google Ads', 'Meta Ads', 'Analytics', 'Email Marketing'],
        salary: [95000, 125000],
        type: 'fulltime',
      },
      {
        level: 'senior',
        title: 'Head of Marketing',
        description: 'Build and lead the marketing function. Own brand, demand gen, and content strategy. Report directly to the CEO.',
        skills: ['Brand Strategy', 'Demand Generation', 'Leadership', 'Budget Management'],
        salary: [155000, 195000],
        type: 'fulltime',
      },
    ],
  },
  {
    industry: 'Marketing',
    variants: [
      {
        level: 'mid',
        title: 'Content Marketing Manager',
        description: 'Build and execute a content strategy across blog, video, and social. Grow organic traffic and build brand authority.',
        skills: ['SEO', 'Content Strategy', 'Copywriting', 'HubSpot'],
        salary: [90000, 115000],
        type: 'fulltime',
      },
      {
        level: 'senior',
        title: 'Senior Brand Strategist',
        description: 'Lead brand positioning and visual identity for a portfolio of consumer brands. Manage agency relationships.',
        skills: ['Brand Strategy', 'Consumer Insights', 'Agency Management', 'Creative Direction'],
        salary: [130000, 160000],
        type: 'fulltime',
      },
    ],
  },
  // ── EDUCATION ───────────────────────────────────────────────────────────
  {
    industry: 'Education',
    variants: [
      {
        level: 'mid',
        title: 'Secondary Teacher — Mathematics',
        description: 'Teach Years 7–12 Mathematics at a leading independent school. Opportunities to run extension programs and coach the maths olympiad team.',
        skills: ['Mathematics', 'NESA Accreditation', 'Classroom Management'],
        salary: [80000, 100000],
        type: 'fulltime',
      },
      {
        level: 'senior',
        title: 'Head of Mathematics',
        description: 'Lead the maths faculty, develop curriculum, and manage a team of six teachers across Years 7–12.',
        skills: ['Mathematics', 'Curriculum Development', 'Leadership', 'NESA Accreditation'],
        salary: [110000, 130000],
        type: 'fulltime',
      },
    ],
  },
  {
    industry: 'Education',
    variants: [
      {
        level: 'mid',
        title: 'Secondary Teacher — English',
        description: 'Deliver engaging English lessons across Years 7–12. Contribute to extra-curricular literary programs.',
        skills: ['English', 'NESA Accreditation', 'Curriculum Design', 'Classroom Management'],
        salary: [80000, 100000],
        type: 'fulltime',
      },
      {
        level: 'mid',
        title: 'Secondary Teacher — Science',
        description: 'Teach Biology, Chemistry, or Physics across Years 7–12 at a growing community school.',
        skills: ['Science', 'NESA Accreditation', 'Laboratory Management', 'Classroom Management'],
        salary: [80000, 100000],
        type: 'fulltime',
      },
    ],
  },
  {
    industry: 'Education',
    variants: [
      {
        level: 'mid',
        title: 'Learning & Development Specialist',
        description: 'Design and deliver training programs for a corporate workforce. Build e-learning content and run facilitator-led workshops.',
        skills: ['Instructional Design', 'Articulate 360', 'Facilitation', 'LMS Administration'],
        salary: [90000, 115000],
        type: 'fulltime',
      },
      {
        level: 'senior',
        title: 'Head of Learning & Development',
        description: 'Own the L&D strategy for 1,500 employees. Build the capability framework, lead a team of four, and manage the learning budget.',
        skills: ['L&D Strategy', 'Leadership', 'Capability Frameworks', 'Stakeholder Management'],
        salary: [140000, 175000],
        type: 'fulltime',
      },
    ],
  },
  // ── SALES ────────────────────────────────────────────────────────────────
  {
    industry: 'Sales',
    variants: [
      {
        level: 'junior',
        title: 'Sales Development Representative',
        description: 'Generate pipeline through outbound prospecting — cold calls, LinkedIn, and personalised email sequences. Uncapped commission.',
        skills: ['Cold Outreach', 'CRM', 'Communication', 'Salesforce'],
        salary: [65000, 85000],
        type: 'fulltime',
      },
      {
        level: 'mid',
        title: 'Account Executive',
        description: 'Own a book of SMB accounts. Run full sales cycles from discovery to close, and consistently hit quarterly quota.',
        skills: ['B2B Sales', 'Salesforce', 'Negotiation', 'Presentation'],
        salary: [100000, 135000],
        type: 'fulltime',
      },
      {
        level: 'senior',
        title: 'Senior Enterprise Account Executive',
        description: 'Land and expand enterprise accounts ($200k+ ACV). Own relationships with C-suite buyers and manage complex multi-stakeholder deals.',
        skills: ['Enterprise Sales', 'Salesforce', 'Executive Relationships', 'Contract Negotiation'],
        salary: [150000, 200000],
        type: 'fulltime',
      },
      {
        level: 'lead',
        title: 'Head of Sales',
        description: 'Build and lead the sales team. Set quota, run sales process, hire AEs, and report revenue forecasts to the board.',
        skills: ['Sales Leadership', 'Revenue Forecasting', 'Hiring', 'Salesforce'],
        salary: [190000, 250000],
        type: 'fulltime',
      },
    ],
  },
  {
    industry: 'Sales',
    variants: [
      {
        level: 'mid',
        title: 'Customer Success Manager',
        description: 'Own post-sale relationships for a portfolio of 40 mid-market accounts. Drive adoption, expansions, and renewals.',
        skills: ['Customer Success', 'Gainsight', 'Upselling', 'Stakeholder Management'],
        salary: [95000, 120000],
        type: 'fulltime',
      },
      {
        level: 'senior',
        title: 'Senior Customer Success Manager',
        description: 'Manage the top 20 enterprise accounts ($5M+ ARR). Build executive relationships and own net revenue retention.',
        skills: ['Enterprise Customer Success', 'EBR Delivery', 'Stakeholder Management', 'CRM'],
        salary: [130000, 160000],
        type: 'fulltime',
      },
    ],
  },
  // ── LEGAL ────────────────────────────────────────────────────────────────
  {
    industry: 'Other',
    variants: [
      {
        level: 'mid',
        title: 'Legal Counsel — Technology',
        description: 'Provide commercial and technology law advice across SaaS contracts, IP, data privacy, and M&A.',
        skills: ['Contract Law', 'Data Privacy', 'IP Law', 'GDPR/Privacy Act'],
        salary: [130000, 165000],
        type: 'fulltime',
      },
      {
        level: 'senior',
        title: 'General Counsel',
        description: 'Lead all legal matters for a Series B startup. Manage outside counsel, negotiate strategic contracts, and advise the board.',
        skills: ['Corporate Law', 'M&A', 'Leadership', 'Contract Negotiation'],
        salary: [200000, 260000],
        type: 'fulltime',
      },
    ],
  },
  // ── HR & PEOPLE OPS ──────────────────────────────────────────────────────
  {
    industry: 'Other',
    variants: [
      {
        level: 'mid',
        title: 'HR Business Partner',
        description: 'Partner with tech leads on talent strategy, performance management, and organisational design for a 200-person engineering org.',
        skills: ['HR Strategy', 'Performance Management', 'ER/IR', 'Workday'],
        salary: [110000, 135000],
        type: 'fulltime',
      },
      {
        level: 'senior',
        title: 'Senior Talent Acquisition Partner',
        description: 'Own end-to-end tech hiring. Build pipelines for engineering and product roles, and lead employer branding initiatives.',
        skills: ['Technical Recruiting', 'LinkedIn Recruiter', 'Sourcing', 'ATS'],
        salary: [120000, 150000],
        type: 'fulltime',
      },
      {
        level: 'lead',
        title: 'Head of People & Culture',
        description: 'Build the people function from scratch. Own hiring, onboarding, compensation, and culture for a 400-person startup.',
        skills: ['People Strategy', 'Leadership', 'Compensation Design', 'HRIS'],
        salary: [175000, 220000],
        type: 'fulltime',
      },
    ],
  },
  {
    industry: 'Finance',
    variants: [
      {
        level: 'junior',
        title: 'Payroll Officer',
        description: 'Process fortnightly payroll for 300 employees. Manage leave, terminations, and Fair Work compliance.',
        skills: ['Payroll', 'Xero Payroll', 'Fair Work Act', 'Excel'],
        salary: [62000, 78000],
        type: 'fulltime',
      },
      {
        level: 'mid',
        title: 'Payroll Manager',
        description: 'Lead end-to-end payroll for 1,200 staff across multiple EBAs. Own payroll compliance and system improvements.',
        skills: ['Chris21', 'EBA Interpretation', 'STP Reporting', 'Leadership'],
        salary: [95000, 120000],
        type: 'fulltime',
      },
    ],
  },
  // ── OPERATIONS & SUPPLY CHAIN ─────────────────────────────────────────────
  {
    industry: 'Engineering',
    variants: [
      {
        level: 'mid',
        title: 'Operations Manager',
        description: 'Oversee daily operations for a manufacturing facility. Manage production schedules, safety, and a team of 30.',
        skills: ['Operations Management', 'Lean Manufacturing', 'Safety', 'ERP Systems'],
        salary: [110000, 140000],
        type: 'fulltime',
      },
      {
        level: 'senior',
        title: 'Supply Chain Manager',
        description: 'Lead procurement, logistics, and inventory for a national distribution network. Negotiate supplier contracts and drive cost savings.',
        skills: ['Supply Chain', 'Procurement', 'SAP', 'Contract Negotiation'],
        salary: [140000, 175000],
        type: 'fulltime',
      },
      {
        level: 'junior',
        title: 'Logistics Coordinator',
        description: 'Coordinate freight movements, manage carrier relationships, and track shipments across the national network.',
        skills: ['Logistics', 'TMS', 'Excel', 'Communication'],
        salary: [62000, 80000],
        type: 'fulltime',
      },
    ],
  },
  // ── CONSTRUCTION ─────────────────────────────────────────────────────────
  {
    industry: 'Engineering',
    variants: [
      {
        level: 'mid',
        title: 'Project Manager — Construction',
        description: 'Deliver commercial construction projects from contract award to handover. Manage subcontractors, programme, and budget.',
        skills: ['Construction Management', 'MS Project', 'Cost Management', 'NCC'],
        salary: [120000, 150000],
        type: 'fulltime',
      },
      {
        level: 'senior',
        title: 'Senior Project Manager — Construction',
        description: 'Lead $50M+ commercial and industrial construction projects. Own client relationships and P&L.',
        skills: ['Construction Management', 'P&L Management', 'Client Management', 'Risk Management'],
        salary: [160000, 200000],
        type: 'fulltime',
      },
      {
        level: 'junior',
        title: 'Site Engineer',
        description: 'Support the project manager on a large residential development. Manage daily site activities, RFIs, and quality inspections.',
        skills: ['Construction', 'AutoCAD', 'Site Management', 'QA/QC'],
        salary: [75000, 95000],
        type: 'fulltime',
      },
      {
        level: 'mid',
        title: 'Quantity Surveyor',
        description: 'Prepare cost estimates, manage variations, and produce monthly cost reports for a $30M mixed-use development.',
        skills: ['Cost Estimating', 'CostX', 'Contract Administration', 'NCC'],
        salary: [100000, 130000],
        type: 'fulltime',
      },
    ],
  },
  // ── AI / ML ENGINEERING ────────────────────────────────────────────────
  {
    industry: 'Technology',
    variants: [
      {
        level: 'mid',
        title: 'Machine Learning Engineer',
        description: 'Build and deploy ML models into production. Bridge the gap between data science research and scalable engineering.',
        skills: ['Python', 'MLOps', 'AWS SageMaker', 'FastAPI', 'Docker'],
        salary: [130000, 160000],
        type: 'fulltime',
      },
      {
        level: 'senior',
        title: 'Senior AI Engineer',
        description: 'Architect and ship AI-powered features using LLMs and retrieval-augmented generation. Own model evaluation and safety practices.',
        skills: ['Python', 'LLMs', 'RAG', 'Vector Databases', 'MLOps'],
        salary: [165000, 200000],
        type: 'fulltime',
      },
      {
        level: 'lead',
        title: 'Head of AI Engineering',
        description: 'Lead the AI team building next-generation intelligent features. Define the technical roadmap and represent AI at the executive table.',
        skills: ['AI Strategy', 'Python', 'MLOps', 'Leadership', 'LLMs'],
        salary: [210000, 270000],
        type: 'fulltime',
      },
    ],
  },
  {
    industry: 'Technology',
    variants: [
      {
        level: 'senior',
        title: 'Cloud Solutions Architect',
        description: 'Design cloud-native architectures for enterprise clients on AWS. Own the technical pre-sales process and lead solution design workshops.',
        skills: ['AWS', 'Cloud Architecture', 'Terraform', 'Pre-sales', 'Solution Design'],
        salary: [165000, 205000],
        type: 'fulltime',
      },
      {
        level: 'mid',
        title: 'Platform Engineer',
        description: 'Build and maintain the internal developer platform. Own the golden path tooling that helps 50 engineers ship faster.',
        skills: ['Kubernetes', 'Backstage', 'GitHub Actions', 'Terraform', 'Go'],
        salary: [125000, 155000],
        type: 'fulltime',
      },
    ],
  },
  // ── RETAIL & HOSPITALITY ──────────────────────────────────────────────────
  {
    industry: 'Sales',
    variants: [
      {
        level: 'mid',
        title: 'Retail Store Manager',
        description: 'Lead a team of 15 in a flagship retail store. Own sales targets, visual merchandising, and staff rostering.',
        skills: ['Retail Management', 'Leadership', 'Visual Merchandising', 'POS Systems'],
        salary: [75000, 95000],
        type: 'fulltime',
      },
      {
        level: 'junior',
        title: 'Retail Sales Assistant (Part-time)',
        description: 'Deliver excellent customer service and achieve sales targets in a fast-paced retail environment. Flexible weekend availability required.',
        skills: ['Customer Service', 'POS', 'Sales', 'Communication'],
        salary: [45000, 58000],
        type: 'parttime',
      },
    ],
  },
  {
    industry: 'Technology',
    variants: [
      {
        level: 'junior',
        title: 'IT Support Analyst',
        description: 'Provide Level 1/2 support to a 500-person organisation. Troubleshoot hardware, software, and network issues.',
        skills: ['Windows', 'Active Directory', 'Networking', 'ITIL'],
        salary: [60000, 78000],
        type: 'fulltime',
      },
      {
        level: 'mid',
        title: 'Systems Administrator',
        description: 'Manage servers, Active Directory, Microsoft 365, and on-premise infrastructure for a mid-sized professional services firm.',
        skills: ['Windows Server', 'Active Directory', 'Microsoft 365', 'VMware'],
        salary: [85000, 110000],
        type: 'fulltime',
      },
      {
        level: 'mid',
        title: 'Business Analyst',
        description: 'Elicit requirements, map business processes, and translate needs into technical specifications for a digital transformation programme.',
        skills: ['Requirements Gathering', 'BPMN', 'Agile', 'SQL'],
        salary: [95000, 125000],
        type: 'fulltime',
      },
      {
        level: 'senior',
        title: 'Technical Project Manager',
        description: 'Deliver complex technology projects on time and budget. Manage cross-functional teams, stakeholders, and risk registers.',
        skills: ['Project Management', 'Agile', 'PMP', 'Stakeholder Management'],
        salary: [135000, 165000],
        type: 'fulltime',
      },
    ],
  },
  {
    industry: 'Healthcare',
    variants: [
      {
        level: 'mid',
        title: 'Pharmacist',
        description: 'Dispense medications, provide clinical advice, and support patient medication management in a busy community pharmacy.',
        skills: ['AHPRA Registration', 'Clinical Pharmacy', 'Patient Counselling', 'Dispensing'],
        salary: [100000, 125000],
        type: 'fulltime',
      },
      {
        level: 'junior',
        title: 'Dental Assistant',
        description: 'Assist dentists in clinical procedures, sterilise instruments, and provide chairside support in a modern dental practice.',
        skills: ['Dental Assistance', 'Infection Control', 'Patient Communication', 'X-ray'],
        salary: [55000, 70000],
        type: 'fulltime',
      },
      {
        level: 'mid',
        title: 'Speech Pathologist',
        description: 'Assess and treat communication and swallowing disorders across paediatric and adult caseloads. NDIS provider.',
        skills: ['AHPRA Registration', 'NDIS', 'AAC', 'Dysphagia'],
        salary: [82000, 105000],
        type: 'fulltime',
      },
      {
        level: 'senior',
        title: 'Clinical Psychologist',
        description: 'Provide evidence-based psychological assessments and therapy. Oversee a team of provisional psychologists.',
        skills: ['AHPRA Registration', 'CBT', 'Assessment', 'Supervision'],
        salary: [120000, 155000],
        type: 'fulltime',
      },
    ],
  },
  {
    industry: 'Other',
    variants: [
      {
        level: 'mid',
        title: 'Restaurant Manager',
        description: 'Manage floor operations, lead a team of 20, and drive revenue in a busy inner-city restaurant.',
        skills: ['Hospitality Management', 'Leadership', 'Revenue Management', 'POS Systems'],
        salary: [75000, 95000],
        type: 'fulltime',
      },
      {
        level: 'junior',
        title: 'Barista / Café All-Rounder (Part-time)',
        description: 'Make exceptional coffee and provide friendly service in a specialty café. Morning shifts, 20–25 hours per week.',
        skills: ['Barista', 'Customer Service', 'Food Safety Certificate'],
        salary: [48000, 58000],
        type: 'parttime',
      },
    ],
  },
  // ── PART-TIME & CONTRACT MIX ─────────────────────────────────────────────
  {
    industry: 'Technology',
    variants: [
      {
        level: 'mid',
        title: 'UX Designer (Part-time)',
        description: 'Design user flows, wireframes, and high-fidelity prototypes for a consumer fintech app. 3 days per week, fully remote.',
        skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
        salary: [75000, 95000],
        type: 'parttime',
      },
      {
        level: 'senior',
        title: 'UX/UI Lead',
        description: 'Own the design system and product design process. Lead two designers and work directly with the CPO.',
        skills: ['Figma', 'Design Systems', 'User Research', 'Leadership'],
        salary: [140000, 170000],
        type: 'fulltime',
      },
    ],
  },
  {
    industry: 'Finance',
    variants: [
      {
        level: 'mid',
        title: 'Bookkeeper (Part-time)',
        description: 'Manage accounts payable/receivable, payroll, and BAS lodgements for a growing SME. 2–3 days per week.',
        skills: ['Xero', 'BAS', 'Payroll', 'Accounts Payable'],
        salary: [55000, 70000],
        type: 'parttime',
      },
    ],
  },
  {
    industry: 'Marketing',
    variants: [
      {
        level: 'mid',
        title: 'Graphic Designer (Contract)',
        description: 'Three-month contract producing social, digital, and print assets for a product launch campaign.',
        skills: ['Adobe Creative Suite', 'Figma', 'Brand Guidelines', 'Motion Graphics'],
        salary: [85000, 105000],
        type: 'contract',
      },
    ],
  },
  {
    industry: 'Technology',
    variants: [
      {
        level: 'senior',
        title: 'Data Engineer (Contract)',
        description: 'Six-month contract building a modern data platform on AWS. Migrate from on-premise warehouse to Snowflake.',
        skills: ['Python', 'Snowflake', 'dbt', 'AWS Glue', 'Airflow'],
        salary: [155000, 185000],
        type: 'contract',
      },
    ],
  },
  {
    industry: 'Engineering',
    variants: [
      {
        level: 'mid',
        title: 'Structural Engineer (Contract)',
        description: 'Nine-month contract on a multi-storey residential development. Structural analysis and documentation to DA approval.',
        skills: ['ETABS', 'AutoCAD', 'AS/NZS 1170', 'Revit Structure'],
        salary: [110000, 140000],
        type: 'contract',
      },
    ],
  },
  {
    industry: 'Healthcare',
    variants: [
      {
        level: 'mid',
        title: 'Occupational Therapist (Part-time)',
        description: 'Work with NDIS participants on functional assessments and home modifications. Flexible hours, supportive team.',
        skills: ['AHPRA Registration', 'NDIS', 'Functional Assessments', 'Report Writing'],
        salary: [80000, 100000],
        type: 'parttime',
      },
    ],
  },
];

// Build the full jobs array
const JOBS = [];
let cityIndex = 0;
for (const template of TEMPLATES) {
  for (const v of template.variants) {
    const loc = CITIES[cityIndex % CITIES.length];
    cityIndex++;
    JOBS.push({
      title: v.title,
      description: v.description,
      industry: template.industry,
      location: { ...loc, remote: v.type === 'contract' || cityIndex % 4 === 0 },
      employmentType: v.type,
      experienceLevel: v.level,
      requiredSkills: v.skills.map((name, i) => ({ name, required: i < 2 })),
      salaryRange: { min: v.salary[0], max: v.salary[1], currency: 'AUD' },
      status: 'active',
      expiresAt: '2026-12-31',
    });
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function post(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json };
}

async function get(path, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { headers });
  const json = await res.json();
  return { status: res.status, body: json };
}

// ── main ─────────────────────────────────────────────────────────────────────

async function clearJobs() {
  try {
    // Delete all documents in the jobs index then force a refresh
    const del = await fetch(`${ES_URL}/jobs/_delete_by_query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: { match_all: {} } }),
    });
    const result = await del.json();
    await fetch(`${ES_URL}/jobs/_refresh`, { method: 'POST' });
    console.log(`🗑️  Deleted ${result.deleted ?? '?'} existing jobs from Elasticsearch`);
  } catch (e) {
    console.warn('⚠️  Could not clear ES index (is Elasticsearch up?):', e.message);
  }
}

async function main() {
  console.log(`\nSeeding ${BASE}  (${JOBS.length} jobs prepared)\n`);

  // 0. Wipe existing jobs so re-seeding is clean
  await clearJobs();

  // 1. Register employer
  const reg = await post('/auth/register/employer', EMPLOYER);
  if (reg.status === 201) {
    console.log('✅ Employer registered — waiting for index refresh...');
    await sleep(1500);
  } else if (reg.status === 409) {
    console.log('ℹ️  Employer already exists — skipping registration');
  } else {
    console.error('❌ Registration failed:', reg.body);
    process.exit(1);
  }

  // 2. Login
  const login = await post('/auth/login', { email: EMPLOYER.email, password: EMPLOYER.password });
  if (login.status !== 200 && login.status !== 201) {
    console.error('❌ Login failed:', login.body);
    process.exit(1);
  }
  const { accessToken } = login.body;
  console.log('✅ Logged in\n');

  // 3. Post all jobs
  let created = 0, skipped = 0;
  for (const job of JOBS) {
    const res = await post('/jobs', job, accessToken);
    if (res.status === 201 || res.status === 200) {
      console.log(`  ✅ [${job.experienceLevel.padEnd(6)}] ${job.title}`);
      created++;
    } else {
      console.warn(`  ⚠️  "${job.title}" — ${res.status}:`, res.body);
      skipped++;
    }
  }

  console.log(`\nDone — ${created} jobs created, ${skipped} skipped.\n`);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
