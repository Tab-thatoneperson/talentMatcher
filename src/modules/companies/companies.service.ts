import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CompanyDocument, CompanyRepository } from './company.repository';

@Injectable()
export class CompaniesService {
  constructor(private readonly repo: CompanyRepository) {}

  async getById(id: string) {
    const company = await this.repo.findById(id);
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async update(
    id: string,
    isAdmin: boolean,
    companyId: string,
    dto: Partial<CompanyDocument>,
  ) {
    if (!isAdmin || companyId !== id) {
      throw new ForbiddenException(
        'Admin access required for own company only',
      );
    }
    await this.repo.update(id, dto);
    return this.getById(id);
  }

  async delete(id: string, isAdmin: boolean, companyId: string) {
    if (!isAdmin || companyId !== id) {
      throw new ForbiddenException(
        'Admin access required for own company only',
      );
    }
    await this.repo.delete(id);
  }
}
