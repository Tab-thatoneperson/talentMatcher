import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { BaseRepository } from '../../common/db/repositories/base.repository';

export interface EmployerDocument extends Record<string, unknown> {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  companyId: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class EmployerRepository extends BaseRepository<EmployerDocument> {
  constructor(esService: ElasticsearchService) {
    super(esService, 'employers');
  }

  async findByEmail(email: string): Promise<EmployerDocument | null> {
    const results = await this.search({ term: { email } }, 1);
    return results[0] ?? null;
  }

  findByCompany(companyId: string) {
    return this.search({ term: { companyId } }, 100);
  }
}
