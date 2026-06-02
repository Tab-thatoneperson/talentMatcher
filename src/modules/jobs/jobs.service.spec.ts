import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobRepository } from './job.repository';
import { CandidateRepository } from '../candidates/candidate.repository';

jest.mock('uuid', () => ({ v4: jest.fn().mockReturnValue('new-job-id') }));

const mockJob = {
  id: 'job-1',
  title: 'Senior Developer',
  description: 'Build cool things',
  companyId: 'comp-1',
  companyName: 'Acme Corp',
  location: { city: 'Sydney', country: 'AU', remote: false },
  requiredSkills: [{ name: 'TypeScript', required: true, minYears: 2 }],
  salaryRange: { min: 100000, max: 140000, currency: 'AUD' },
  employmentType: 'fulltime',
  experienceLevel: 'senior',
  status: 'active',
  postedAt: '2026-01-01T00:00:00.000Z',
  expiresAt: '2026-06-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const mockCandidate = {
  id: 'cand-1',
  skills: [{ name: 'TypeScript', proficiencyLevel: 4, yearsOfExperience: 3 }],
};

describe('JobsService', () => {
  let service: JobsService;
  let jobRepo: {
    findActive: jest.Mock;
    findByCompany: jest.Mock;
    fullTextSearch: jest.Mock;
    findRecommendationsForCandidate: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let candidateRepo: {
    findById: jest.Mock;
    findRecommendationsForJob: jest.Mock;
  };

  beforeEach(async () => {
    jobRepo = {
      findActive: jest.fn(),
      findByCompany: jest.fn(),
      fullTextSearch: jest.fn(),
      findRecommendationsForCandidate: jest.fn(),
      findById: jest.fn(),
      create: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    candidateRepo = {
      findById: jest.fn(),
      findRecommendationsForJob: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: JobRepository, useValue: jobRepo },
        { provide: CandidateRepository, useValue: candidateRepo },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  describe('listActive', () => {
    it('delegates to jobRepo.findActive', async () => {
      jobRepo.findActive.mockResolvedValue([mockJob]);

      const result = await service.listActive();

      expect(jobRepo.findActive).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('listByCompany', () => {
    it('returns jobs for the given company', async () => {
      jobRepo.findByCompany.mockResolvedValue([mockJob]);

      const result = await service.listByCompany('comp-1');

      expect(jobRepo.findByCompany).toHaveBeenCalledWith('comp-1');
      expect(result[0].companyId).toBe('comp-1');
    });
  });

  describe('search', () => {
    it('delegates to jobRepo.fullTextSearch', async () => {
      jobRepo.fullTextSearch.mockResolvedValue([mockJob]);

      const result = await service.search('developer');

      expect(jobRepo.fullTextSearch).toHaveBeenCalledWith('developer');
      expect(result).toHaveLength(1);
    });
  });

  describe('getRecommendationsForCandidate', () => {
    it('fetches candidate skills and queries job recommendations', async () => {
      candidateRepo.findById.mockResolvedValue(mockCandidate);
      jobRepo.findRecommendationsForCandidate.mockResolvedValue([mockJob]);

      const result = await service.getRecommendationsForCandidate('cand-1');

      expect(candidateRepo.findById).toHaveBeenCalledWith('cand-1');
      expect(jobRepo.findRecommendationsForCandidate).toHaveBeenCalledWith(
        ['TypeScript'],
        10,
      );
      expect(result).toHaveLength(1);
    });

    it('throws NotFoundException when candidate does not exist', async () => {
      candidateRepo.findById.mockResolvedValue(null);

      await expect(
        service.getRecommendationsForCandidate('missing'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getById', () => {
    it('returns the job', async () => {
      jobRepo.findById.mockResolvedValue(mockJob);

      const result = await service.getById('job-1');

      expect(result.id).toBe('job-1');
    });

    it('throws NotFoundException when job does not exist', async () => {
      jobRepo.findById.mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates a job with generated id and timestamps', async () => {
      const result = await service.create('comp-1', 'Acme Corp', {
        title: 'Backend Dev',
        description: 'Node work',
        employmentType: 'fulltime',
        experienceLevel: 'mid',
      });

      expect(result.id).toBe('new-job-id');
      expect(result.companyId).toBe('comp-1');
      expect(result.companyName).toBe('Acme Corp');
      expect(result.title).toBe('Backend Dev');
      expect(jobRepo.create).toHaveBeenCalledWith(
        'new-job-id',
        expect.objectContaining({ title: 'Backend Dev' }),
      );
    });
  });

  describe('update', () => {
    it('updates an existing job owned by the same company', async () => {
      jobRepo.findById
        .mockResolvedValueOnce(mockJob)
        .mockResolvedValueOnce({ ...mockJob, title: 'Updated Title' });

      const result = await service.update('job-1', 'comp-1', {
        title: 'Updated Title',
      });

      expect(jobRepo.update).toHaveBeenCalledWith('job-1', {
        title: 'Updated Title',
      });
      expect(result.title).toBe('Updated Title');
    });

    it('throws NotFoundException when job does not exist', async () => {
      jobRepo.findById.mockResolvedValue(null);

      await expect(service.update('missing', 'comp-1', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when job belongs to a different company', async () => {
      jobRepo.findById.mockResolvedValue({
        ...mockJob,
        companyId: 'other-company',
      });

      await expect(service.update('job-1', 'comp-1', {})).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('delete', () => {
    it('deletes a job owned by the same company', async () => {
      jobRepo.findById.mockResolvedValue(mockJob);

      await service.delete('job-1', 'comp-1');

      expect(jobRepo.delete).toHaveBeenCalledWith('job-1');
    });

    it('throws NotFoundException when job does not exist', async () => {
      jobRepo.findById.mockResolvedValue(null);

      await expect(service.delete('missing', 'comp-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when job belongs to a different company', async () => {
      jobRepo.findById.mockResolvedValue({
        ...mockJob,
        companyId: 'other-company',
      });

      await expect(service.delete('job-1', 'comp-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getRecommendationsForJob', () => {
    it('fetches job skills and queries matching candidates', async () => {
      jobRepo.findById.mockResolvedValue(mockJob);
      candidateRepo.findRecommendationsForJob.mockResolvedValue([
        { id: 'cand-1', skills: [] },
      ]);

      const result = await service.getRecommendationsForJob('job-1');

      expect(candidateRepo.findRecommendationsForJob).toHaveBeenCalledWith([
        'TypeScript',
      ]);
      expect(result).toHaveLength(1);
    });

    it('throws NotFoundException when job does not exist', async () => {
      jobRepo.findById.mockResolvedValue(null);

      await expect(service.getRecommendationsForJob('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
