import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { BaseRepository } from '../../common/db/repositories/base.repository';

// ─── Document shape ───────────────────────────────────────────────────────────

export interface CandidateSkill extends Record<string, unknown> {
  name: string;
  proficiencyLevel: 1 | 2 | 3 | 4 | 5;
  yearsOfExperience: number;
}

export interface CandidateExperience extends Record<string, unknown> {
  title: string;
  company: string;
  description: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
}

export interface CandidateEducation extends Record<string, unknown> {
  degree: string;
  institution: string;
  field: string;
  graduationYear: number;
}

export interface CandidateDocument extends Record<string, unknown> {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  location: {
    city: string;
    country: string;
  };
  summary: string;
  skills: CandidateSkill[];
  experience: CandidateExperience[];
  education: CandidateEducation[];
  availability: 'immediate' | '2weeks' | '1month';
  preferredJobTypes: ('fulltime' | 'parttime' | 'contract' | 'remote')[];
  salaryExpectation: {
    min: number;
    max: number;
    currency: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ─── Repository ───────────────────────────────────────────────────────────────

@Injectable()
export class CandidateRepository extends BaseRepository<CandidateDocument> {
  constructor(esService: ElasticsearchService) {
    super(esService, 'candidates');
  }

  findBySkills(skillNames: string[]) {
    return this.search({
      nested: {
        path: 'skills',
        query: {
          terms: { 'skills.name': skillNames },
        },
      },
    });
  }

  findByLocation(city: string, country: string) {
    return this.search({
      bool: {
        must: [
          { term: { 'location.city': city } },
          { term: { 'location.country': country } },
        ],
      },
    });
  }

  findAvailable() {
    return this.search({
      terms: { availability: ['immediate', '2weeks', '1month'] },
    });
  }
}
