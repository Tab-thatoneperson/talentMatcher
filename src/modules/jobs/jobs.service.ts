import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { JobDocument, JobRepository } from './job.repository';
import { CandidateRepository } from '../candidates/candidate.repository';

@Injectable()
export class JobsService {
  constructor(
    private readonly jobRepo: JobRepository,
    private readonly candidateRepo: CandidateRepository,
  ) {}

  listActive() {
    return this.jobRepo.findActive();
  }

  listByCompany(companyId: string) {
    return this.jobRepo.findByCompany(companyId);
  }

  search(q: string) {
    return this.jobRepo.fullTextSearch(q);
  }

  async getRecommendationsForCandidate(candidateId: string) {
    const candidate = await this.candidateRepo.findById(candidateId);
    if (!candidate) throw new NotFoundException('Candidate not found');
    const skillNames = candidate.skills.map((s) => s.name);
    return this.jobRepo.findRecommendationsForCandidate(skillNames);
  }

  async getById(id: string) {
    const job = await this.jobRepo.findById(id);
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async create(companyId: string, companyName: string, dto: Partial<JobDocument>) {
    const id = uuidv4();
    const now = new Date().toISOString();
    const doc: JobDocument = {
      id,
      title: (dto.title as string) ?? '',
      description: (dto.description as string) ?? '',
      companyId,
      companyName,
      industry: (dto.industry as string) ?? '',
      location: (dto.location as JobDocument['location']) ?? {
        city: '',
        country: '',
        remote: false,
      },
      requiredSkills: (dto.requiredSkills as JobDocument['requiredSkills']) ?? [],
      salaryRange: (dto.salaryRange as JobDocument['salaryRange']) ?? {
        min: 0,
        max: 0,
        currency: 'USD',
      },
      employmentType: (dto.employmentType as JobDocument['employmentType']) ?? 'fulltime',
      experienceLevel: (dto.experienceLevel as JobDocument['experienceLevel']) ?? 'mid',
      status: (dto.status as JobDocument['status']) ?? 'active',
      postedAt: now,
      expiresAt: (dto.expiresAt as string) ?? '',
      createdAt: now,
    };
    await this.jobRepo.create(id, doc);
    return doc;
  }

  async update(id: string, companyId: string, dto: Partial<JobDocument>) {
    const job = await this.jobRepo.findById(id);
    if (!job) throw new NotFoundException('Job not found');
    if (job.companyId !== companyId) throw new ForbiddenException('Not your job');
    await this.jobRepo.update(id, dto);
    return this.getById(id);
  }

  async delete(id: string, companyId: string) {
    const job = await this.jobRepo.findById(id);
    if (!job) throw new NotFoundException('Job not found');
    if (job.companyId !== companyId) throw new ForbiddenException('Not your job');
    await this.jobRepo.delete(id);
  }

  async getRecommendationsForJob(jobId: string) {
    const job = await this.jobRepo.findById(jobId);
    if (!job) throw new NotFoundException('Job not found');
    const skillNames = job.requiredSkills.map((s) => s.name);
    return this.candidateRepo.findRecommendationsForJob(skillNames);
  }
}
