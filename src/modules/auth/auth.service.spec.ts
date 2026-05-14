import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { CandidateRepository } from '../candidates/candidate.repository';
import { EmployerRepository } from '../employers/employer.repository';
import { CompanyRepository } from '../companies/company.repository';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_pw'),
  compare: jest.fn(),
}));

jest.mock('uuid', () => ({ v4: jest.fn().mockReturnValue('test-uuid') }));

const mockCandidateRepo = () => ({
  findByEmail: jest.fn(),
  create: jest.fn(),
});

const mockEmployerRepo = () => ({
  findByEmail: jest.fn(),
  create: jest.fn(),
});

const mockCompanyRepo = () => ({ create: jest.fn() });

describe('AuthService', () => {
  let service: AuthService;
  let candidateRepo: ReturnType<typeof mockCandidateRepo>;
  let employerRepo: ReturnType<typeof mockEmployerRepo>;
  let companyRepo: ReturnType<typeof mockCompanyRepo>;
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    candidateRepo = mockCandidateRepo();
    employerRepo = mockEmployerRepo();
    companyRepo = mockCompanyRepo();
    jwtService = { sign: jest.fn().mockReturnValue('jwt.token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: CandidateRepository, useValue: candidateRepo },
        { provide: EmployerRepository, useValue: employerRepo },
        { provide: CompanyRepository, useValue: companyRepo },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('registerCandidate', () => {
    it('creates a candidate and returns id + role', async () => {
      candidateRepo.findByEmail.mockResolvedValue(null);
      candidateRepo.create.mockResolvedValue(undefined);

      const result = await service.registerCandidate({
        email: 'test@example.com',
        password: 'pass123',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(result).toEqual({ id: 'test-uuid', role: 'candidate' });
      expect(candidateRepo.create).toHaveBeenCalledWith(
        'test-uuid',
        expect.objectContaining({
          id: 'test-uuid',
          email: 'test@example.com',
          passwordHash: 'hashed_pw',
          firstName: 'John',
          lastName: 'Doe',
        }),
      );
    });

    it('throws ConflictException when email is already registered', async () => {
      candidateRepo.findByEmail.mockResolvedValue({ id: 'existing' });

      await expect(
        service.registerCandidate({ email: 'taken@x.com', password: 'pw', firstName: 'A', lastName: 'B' }),
      ).rejects.toThrow(ConflictException);

      expect(candidateRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('registerEmployer', () => {
    it('creates company + admin employer and returns metadata', async () => {
      employerRepo.findByEmail.mockResolvedValue(null);
      companyRepo.create.mockResolvedValue(undefined);
      employerRepo.create.mockResolvedValue(undefined);

      const result = await service.registerEmployer({
        email: 'boss@corp.com',
        password: 'secure',
        firstName: 'Boss',
        lastName: 'Man',
        organizationName: 'Acme Corp',
      });

      expect(result.role).toBe('employer');
      expect(result.isAdmin).toBe(true);
      expect(result.id).toBe('test-uuid');
      expect(companyRepo.create).toHaveBeenCalledWith(
        'test-uuid',
        expect.objectContaining({ organizationName: 'Acme Corp' }),
      );
      expect(employerRepo.create).toHaveBeenCalledWith(
        'test-uuid',
        expect.objectContaining({ isAdmin: true, companyId: 'test-uuid' }),
      );
    });

    it('throws ConflictException when email is already registered', async () => {
      employerRepo.findByEmail.mockResolvedValue({ id: 'existing' });

      await expect(
        service.registerEmployer({
          email: 'taken@corp.com',
          password: 'pw',
          firstName: 'A',
          lastName: 'B',
          organizationName: 'Corp',
        }),
      ).rejects.toThrow(ConflictException);

      expect(companyRepo.create).not.toHaveBeenCalled();
      expect(employerRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const candidateDoc = { id: 'c-1', email: 'c@test.com', passwordHash: 'hashed_pw' };
    const employerDoc = { id: 'e-1', email: 'e@test.com', passwordHash: 'hashed_pw', companyId: 'co-1', isAdmin: true };

    it('returns candidate JWT on valid candidate credentials', async () => {
      candidateRepo.findByEmail.mockResolvedValue(candidateDoc);
      employerRepo.findByEmail.mockResolvedValue(null);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login('c@test.com', 'password');

      expect(result.role).toBe('candidate');
      expect(result.accessToken).toBe('jwt.token');
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'c-1', role: 'candidate' });
    });

    it('returns employer JWT with companyId and isAdmin on valid employer credentials', async () => {
      candidateRepo.findByEmail.mockResolvedValue(null);
      employerRepo.findByEmail.mockResolvedValue(employerDoc);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login('e@test.com', 'password');

      expect(result.role).toBe('employer');
      expect(result.companyId).toBe('co-1');
      expect(result.isAdmin).toBe(true);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'e-1',
        role: 'employer',
        companyId: 'co-1',
        isAdmin: true,
      });
    });

    it('throws UnauthorizedException when neither candidate nor employer found', async () => {
      candidateRepo.findByEmail.mockResolvedValue(null);
      employerRepo.findByEmail.mockResolvedValue(null);

      await expect(service.login('nobody@x.com', 'pw')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      candidateRepo.findByEmail.mockResolvedValue(candidateDoc);
      employerRepo.findByEmail.mockResolvedValue(null);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login('c@test.com', 'wrongpw')).rejects.toThrow(UnauthorizedException);
    });
  });
});
