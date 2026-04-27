import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { BaseRepository } from '../../common/db/repositories/base.repository';

// ─── Document shape ───────────────────────────────────────────────────────────

export interface JobRequiredSkill extends Record<string, unknown> {
  name: string;
  required: boolean;
  minYears: number;
}

export interface JobDocument extends Record<string, unknown> {
  id: string;
  title: string;
  description: string;
  companyId: string;
  companyName: string;
  location: {
    city: string;
    country: string;
    remote: boolean;
  };
  requiredSkills: JobRequiredSkill[];
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  employmentType: 'fulltime' | 'parttime' | 'contract';
  experienceLevel: 'junior' | 'mid' | 'senior' | 'lead';
  status: 'active' | 'closed' | 'draft';
  postedAt: string;
  expiresAt: string;
  createdAt: string;
}

// ─── Repository ───────────────────────────────────────────────────────────────

@Injectable()
export class JobRepository extends BaseRepository<JobDocument> {
  constructor(esService: ElasticsearchService) {
    super(esService, 'jobs');
  }

  findBySkills(skillNames: string[]) {
    return this.search({
      nested: {
        path: 'requiredSkills',
        query: {
          terms: { 'requiredSkills.name': skillNames },
        },
      },
    });
  }

  findByCompany(companyId: string) {
    return this.search({ term: { companyId } });
  }

  findActive() {
    return this.search({ term: { status: 'active' } });
  }
}
