import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { BaseRepository } from '../../common/db/repositories/base.repository';

// ─── Document shape ───────────────────────────────────────────────────────────

export interface CompanyDocument extends Record<string, unknown> {
  id: string;
  organizationName: string;
  createdAt: string;
}

// ─── Repository ───────────────────────────────────────────────────────────────

@Injectable()
export class CompanyRepository extends BaseRepository<CompanyDocument> {
  constructor(esService: ElasticsearchService) {
    super(esService, 'companies');
  }

  findByOrganizationName(name: string) {
    return this.search({ match: { organizationName: name } });
  }
}
