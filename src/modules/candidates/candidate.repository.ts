import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { BaseRepository } from '../../common/db/repositories/base.repository';
import type { QueryDslQueryContainer } from '@elastic/elasticsearch/lib/api/types';

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
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  location: { city: string; country: string };
  preferredLocation: { city: string; country: string };
  summary: string;
  skills: CandidateSkill[];
  experience: CandidateExperience[];
  education: CandidateEducation[];
  availability: 'immediate' | '2weeks' | '1month';
  preferredJobTypes: ('fulltime' | 'parttime' | 'contract' | 'remote')[];
  salaryExpectation: { min: number; max: number; currency: string };
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class CandidateRepository extends BaseRepository<CandidateDocument> {
  constructor(esService: ElasticsearchService) {
    super(esService, 'candidates');
  }

  async findByEmail(email: string): Promise<CandidateDocument | null> {
    const results = await this.search({ term: { email } }, 1);
    return results[0] ?? null;
  }

  async findFiltered(filters: {
    skills?: string;
    education?: string;
    experience?: string;
  }): Promise<CandidateDocument[]> {
    const must: QueryDslQueryContainer[] = [];

    if (filters.skills) {
      const skillNames = filters.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (skillNames.length) {
        must.push({
          nested: {
            path: 'skills',
            query: { terms: { 'skills.name': skillNames } },
          },
        });
      }
    }

    if (filters.education) {
      must.push({
        nested: {
          path: 'education',
          query: {
            bool: {
              should: [
                { term: { 'education.degree': filters.education } },
                { term: { 'education.field': filters.education } },
              ],
            },
          },
        },
      });
    }

    if (filters.experience) {
      const minYears = parseInt(filters.experience, 10);
      if (!isNaN(minYears)) {
        must.push({
          nested: {
            path: 'skills',
            query: { range: { 'skills.yearsOfExperience': { gte: minYears } } },
          },
        });
      }
    }

    const query: QueryDslQueryContainer = must.length
      ? { bool: { must } }
      : { match_all: {} };

    return this.search(query, 100);
  }

  fullTextSearch(q: string) {
    return this.search(
      {
        multi_match: {
          query: q,
          fields: ['firstName', 'lastName', 'summary'],
        },
      },
      50,
    );
  }

  async findRecommendationsForJob(
    skillNames: string[],
    limit = 10,
  ): Promise<CandidateDocument[]> {
    if (!skillNames.length) return this.findAll(limit);
    const result = await this.esService.search<CandidateDocument>({
      index: this.index,
      size: limit,
      query: {
        bool: {
          should: skillNames.map((name) => ({
            nested: {
              path: 'skills',
              query: { term: { 'skills.name': name } },
            },
          })),
          minimum_should_match: 1,
        },
      },
    });
    return result.hits.hits.map((h) => h._source as CandidateDocument);
  }

  findBySkills(skillNames: string[]) {
    return this.search({
      nested: {
        path: 'skills',
        query: { terms: { 'skills.name': skillNames } },
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

  findByPreferredLocation(city: string, country: string) {
    return this.search({
      bool: {
        must: [
          { term: { 'preferredLocation.city': city } },
          { term: { 'preferredLocation.country': country } },
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
