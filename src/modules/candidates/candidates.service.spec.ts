import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { CandidateRepository } from './candidate.repository';
import { ResumeParserService } from './resume/resume-parser.service';
import { LlmService } from '../../common/llm/llm.service';

const mockCandidate = {
  id: 'cand-1',
  email: 'test@example.com',
  passwordHash: 'secret_hash',
  firstName: 'John',
  lastName: 'Doe',
  location: { city: 'Sydney', country: 'Australia' },
  summary: 'A developer',
  skills: [{ name: 'TypeScript', proficiencyLevel: 4, yearsOfExperience: 3 }],
  experience: [],
  education: [],
  availability: 'immediate',
  preferredJobTypes: ['fulltime'],
  salaryExpectation: { min: 80000, max: 120000, currency: 'AUD' },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('CandidatesService', () => {
  let service: CandidatesService;
  let repo: { findById: jest.Mock; update: jest.Mock; delete: jest.Mock; findFiltered: jest.Mock; fullTextSearch: jest.Mock };
  let resumeParser: { extractText: jest.Mock };
  let llm: { extractResumeData: jest.Mock };

  beforeEach(async () => {
    repo = {
      findById: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      findFiltered: jest.fn(),
      fullTextSearch: jest.fn(),
    };
    resumeParser = { extractText: jest.fn() };
    llm = { extractResumeData: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidatesService,
        { provide: CandidateRepository, useValue: repo },
        { provide: ResumeParserService, useValue: resumeParser },
        { provide: LlmService, useValue: llm },
      ],
    }).compile();

    service = module.get<CandidatesService>(CandidatesService);
  });

  describe('getMe', () => {
    it('returns profile without passwordHash', async () => {
      repo.findById.mockResolvedValue(mockCandidate);

      const result = await service.getMe('cand-1');

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toBe('test@example.com');
      expect(result.id).toBe('cand-1');
    });

    it('throws NotFoundException when candidate does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.getMe('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMe', () => {
    it('updates allowed fields and returns sanitized profile', async () => {
      repo.findById.mockResolvedValue({ ...mockCandidate, summary: 'Updated bio' });

      const result = await service.updateMe('cand-1', { summary: 'Updated bio' });

      expect(repo.update).toHaveBeenCalledWith(
        'cand-1',
        expect.objectContaining({ summary: 'Updated bio', updatedAt: expect.any(String) }),
      );
      expect(result.summary).toBe('Updated bio');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('strips identity and auth fields from the update payload', async () => {
      repo.findById.mockResolvedValue(mockCandidate);

      await service.updateMe('cand-1', {
        email: 'evil@hacker.com',
        passwordHash: 'pwned',
        id: 'different-id',
        createdAt: '1970-01-01',
        summary: 'Legitimate change',
      } as never);

      const updateArg = repo.update.mock.calls[0][1] as Record<string, unknown>;
      expect(updateArg).not.toHaveProperty('email');
      expect(updateArg).not.toHaveProperty('passwordHash');
      expect(updateArg).not.toHaveProperty('id');
      expect(updateArg).not.toHaveProperty('createdAt');
      expect(updateArg.summary).toBe('Legitimate change');
    });
  });

  describe('deleteMe', () => {
    it('delegates to repository delete', async () => {
      await service.deleteMe('cand-1');

      expect(repo.delete).toHaveBeenCalledWith('cand-1');
    });
  });

  describe('uploadResume', () => {
    it('parses resume, calls LLM, and merges extracted profile fields', async () => {
      const buffer = Buffer.from('resume');
      resumeParser.extractText.mockResolvedValue('raw text');
      llm.extractResumeData.mockResolvedValue({
        firstName: 'Jane',
        summary: 'ML Engineer',
        skills: [{ name: 'Python', proficiencyLevel: 5, yearsOfExperience: 4 }],
      });
      repo.findById.mockResolvedValue({ ...mockCandidate, firstName: 'Jane', summary: 'ML Engineer' });

      const result = await service.uploadResume('cand-1', buffer, 'application/pdf');

      expect(resumeParser.extractText).toHaveBeenCalledWith(buffer, 'application/pdf');
      expect(llm.extractResumeData).toHaveBeenCalledWith('raw text');
      expect(repo.update).toHaveBeenCalledWith(
        'cand-1',
        expect.objectContaining({ firstName: 'Jane', summary: 'ML Engineer' }),
      );
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('does not overwrite email, id, passwordHash, or createdAt from LLM output', async () => {
      resumeParser.extractText.mockResolvedValue('text');
      llm.extractResumeData.mockResolvedValue({
        email: 'injected@evil.com',
        id: 'stolen-id',
        passwordHash: 'hacked',
        createdAt: '1970-01-01',
        firstName: 'Safe',
      });
      repo.findById.mockResolvedValue(mockCandidate);

      await service.uploadResume('cand-1', Buffer.from(''), 'application/pdf');

      const updateArg = repo.update.mock.calls[0][1] as Record<string, unknown>;
      expect(updateArg).not.toHaveProperty('email');
      expect(updateArg).not.toHaveProperty('id');
      expect(updateArg).not.toHaveProperty('passwordHash');
      expect(updateArg).not.toHaveProperty('createdAt');
      expect(updateArg.firstName).toBe('Safe');
    });

    it('skips repository update when LLM returns no extractable fields', async () => {
      resumeParser.extractText.mockResolvedValue('empty');
      llm.extractResumeData.mockResolvedValue({});
      repo.findById.mockResolvedValue(mockCandidate);

      await service.uploadResume('cand-1', Buffer.from(''), 'application/pdf');

      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('listAll', () => {
    it('returns sanitized list from findFiltered', async () => {
      repo.findFiltered.mockResolvedValue([mockCandidate]);

      const result = await service.listAll({ skills: 'TypeScript,Python' });

      expect(repo.findFiltered).toHaveBeenCalledWith({ skills: 'TypeScript,Python' });
      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('passwordHash');
    });

    it('passes all filter params to repository', async () => {
      repo.findFiltered.mockResolvedValue([]);

      await service.listAll({ skills: 'Go', education: 'Bachelor', experience: '3' });

      expect(repo.findFiltered).toHaveBeenCalledWith({
        skills: 'Go',
        education: 'Bachelor',
        experience: '3',
      });
    });
  });

  describe('search', () => {
    it('returns sanitized results from fullTextSearch', async () => {
      repo.fullTextSearch.mockResolvedValue([mockCandidate]);

      const result = await service.search('developer');

      expect(repo.fullTextSearch).toHaveBeenCalledWith('developer');
      expect(result[0]).not.toHaveProperty('passwordHash');
    });
  });

  describe('getById', () => {
    it('returns sanitized candidate by id', async () => {
      repo.findById.mockResolvedValue(mockCandidate);

      const result = await service.getById('cand-1');

      expect(result.id).toBe('cand-1');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('throws NotFoundException when candidate does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
