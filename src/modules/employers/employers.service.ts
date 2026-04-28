import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { EmployerDocument, EmployerRepository } from './employer.repository';

function sanitize(doc: EmployerDocument): Omit<EmployerDocument, 'passwordHash'> {
  const { passwordHash: _pw, ...rest } = doc;
  void _pw;
  return rest;
}

@Injectable()
export class EmployersService {
  constructor(private readonly repo: EmployerRepository) {}

  async getMe(id: string) {
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException('Employer not found');
    return sanitize(doc);
  }

  async updateMe(id: string, dto: Partial<EmployerDocument>) {
    await this.repo.update(id, { ...dto, updatedAt: new Date().toISOString() });
    return this.getMe(id);
  }

  async deleteMe(id: string) {
    await this.repo.delete(id);
  }

  async listByCompany(companyId: string) {
    const docs = await this.repo.findByCompany(companyId);
    return docs.map(sanitize);
  }

  async addToCompany(
    companyId: string,
    dto: { email: string; password: string; firstName: string; lastName: string },
  ) {
    const id = uuidv4();
    const now = new Date().toISOString();
    await this.repo.create(id, {
      id,
      email: dto.email,
      passwordHash: await bcrypt.hash(dto.password, 10),
      firstName: dto.firstName,
      lastName: dto.lastName,
      companyId,
      isAdmin: false,
      createdAt: now,
      updatedAt: now,
    });
    return this.getMe(id);
  }

  async updateById(id: string, companyId: string, dto: Partial<EmployerDocument>) {
    const emp = await this.repo.findById(id);
    if (!emp) throw new NotFoundException('Employer not found');
    if (emp.companyId !== companyId) throw new ForbiddenException('Not in your company');
    await this.repo.update(id, { ...dto, updatedAt: new Date().toISOString() });
    return this.getMe(id);
  }

  async deleteById(id: string, companyId: string) {
    const emp = await this.repo.findById(id);
    if (!emp) throw new NotFoundException('Employer not found');
    if (emp.companyId !== companyId) throw new ForbiddenException('Not in your company');
    await this.repo.delete(id);
  }
}
