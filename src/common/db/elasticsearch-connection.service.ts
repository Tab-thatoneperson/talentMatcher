import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

const CANDIDATES_MAPPINGS = {
  properties: {
    id: { type: 'keyword' },
    email: { type: 'keyword' },
    passwordHash: { type: 'keyword', index: false },
    firstName: { type: 'text' },
    lastName: { type: 'text' },
    location: {
      properties: { city: { type: 'keyword' }, country: { type: 'keyword' } },
    },
    summary: { type: 'text' },
    skills: {
      type: 'nested',
      properties: {
        name: { type: 'keyword' },
        proficiencyLevel: { type: 'integer' },
        yearsOfExperience: { type: 'integer' },
      },
    },
    experience: {
      type: 'nested',
      properties: {
        title: { type: 'text' },
        company: { type: 'text' },
        description: { type: 'text' },
        startDate: { type: 'keyword' },
        endDate: { type: 'keyword' },
        current: { type: 'boolean' },
      },
    },
    education: {
      type: 'nested',
      properties: {
        degree: { type: 'keyword' },
        institution: { type: 'text' },
        field: { type: 'keyword' },
        graduationYear: { type: 'integer' },
      },
    },
    availability: { type: 'keyword' },
    preferredJobTypes: { type: 'keyword' },
    salaryExpectation: {
      properties: {
        min: { type: 'integer' },
        max: { type: 'integer' },
        currency: { type: 'keyword' },
      },
    },
    isMember: { type: 'boolean' },
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' },
  },
};

const EMPLOYERS_MAPPINGS = {
  properties: {
    id: { type: 'keyword' },
    email: { type: 'keyword' },
    passwordHash: { type: 'keyword', index: false },
    firstName: { type: 'text' },
    lastName: { type: 'text' },
    companyId: { type: 'keyword' },
    isAdmin: { type: 'boolean' },
    isMember: { type: 'boolean' },
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' },
  },
};

const COMPANIES_MAPPINGS = {
  properties: {
    id: { type: 'keyword' },
    organizationName: { type: 'text' },
    createdAt: { type: 'date' },
  },
};

const JOBS_MAPPINGS = {
  properties: {
    id: { type: 'keyword' },
    title: { type: 'text' },
    description: { type: 'text' },
    companyId: { type: 'keyword' },
    companyName: { type: 'keyword' },
    location: {
      properties: {
        city: { type: 'keyword' },
        country: { type: 'keyword' },
        remote: { type: 'boolean' },
      },
    },
    requiredSkills: {
      type: 'nested',
      properties: {
        name: { type: 'keyword' },
        required: { type: 'boolean' },
        minYears: { type: 'integer' },
      },
    },
    salaryRange: {
      properties: {
        min: { type: 'integer' },
        max: { type: 'integer' },
        currency: { type: 'keyword' },
      },
    },
    employmentType: { type: 'keyword' },
    experienceLevel: { type: 'keyword' },
    status: { type: 'keyword' },
    postedAt: { type: 'date' },
    expiresAt: { type: 'date' },
    createdAt: { type: 'date' },
  },
};

@Injectable()
export class ElasticsearchConnectionService implements OnModuleInit {
  private readonly logger = new Logger('Elasticsearch');

  constructor(private readonly esService: ElasticsearchService) {}

  async onModuleInit() {
    const info = await this.esService.info();
    this.logger.log(
      `Connected to Elasticsearch ${info.version.number} at ${info.name}`,
    );
    await this.ensureIndices();
  }

  private async ensureIndices() {
    const indices = [
      { index: 'candidates', mappings: CANDIDATES_MAPPINGS },
      { index: 'employers', mappings: EMPLOYERS_MAPPINGS },
      { index: 'companies', mappings: COMPANIES_MAPPINGS },
      { index: 'jobs', mappings: JOBS_MAPPINGS },
    ];

    for (const { index, mappings } of indices) {
      try {
        const exists = await this.esService.indices.exists({ index });
        if (!exists) {
          await this.esService.indices.create({ index, mappings } as Parameters<typeof this.esService.indices.create>[0]);
          this.logger.log(`Created index: ${index}`);
        }
      } catch (err: unknown) {
        this.logger.warn(`Could not ensure index ${index}: ${(err as Error).message}`);
      }
    }
  }
}
