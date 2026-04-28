import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { BaseRepository } from '../../common/db/repositories/base.repository';

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
  location: { city: string; country: string; remote: boolean };
  requiredSkills: JobRequiredSkill[];
  salaryRange: { min: number; max: number; currency: string };
  employmentType: 'fulltime' | 'parttime' | 'contract';
  experienceLevel: 'junior' | 'mid' | 'senior' | 'lead';
  status: 'active' | 'closed' | 'draft';
  postedAt: string;
  expiresAt: string;
  createdAt: string;
}

@Injectable()
export class JobRepository extends BaseRepository<JobDocument> {
  constructor(esService: ElasticsearchService) {
    super(esService, 'jobs');
  }

  findBySkills(skillNames: string[]) {
    return this.search({
      nested: {
        path: 'requiredSkills',
        query: { terms: { 'requiredSkills.name': skillNames } },
      },
    });
  }

  findByCompany(companyId: string) {
    return this.search({ term: { companyId } }, 100);
  }

  findActive() {
    return this.search({ term: { status: 'active' } }, 100);
  }

  fullTextSearch(q: string) {
    return this.search(
      {
        multi_match: {
          query: q,
          fields: ['title', 'description', 'companyName'],
        },
      },
      50,
    );
  }

  async findRecommendationsForCandidate(
    skillNames: string[],
    limit = 10,
  ): Promise<JobDocument[]> {
    if (!skillNames.length) return this.findActive();
    const result = await this.esService.search<JobDocument>({
      index: this.index,
      size: limit,
      query: {
        bool: {
          must: [{ term: { status: 'active' } }],
          should: skillNames.map((name) => ({
            nested: {
              path: 'requiredSkills',
              query: { term: { 'requiredSkills.name': name } },
            },
          })),
          minimum_should_match: 1,
        },
      },
    });
    return result.hits.hits.map((h) => h._source as JobDocument);
  }
}
