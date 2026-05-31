import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { CandidateRepository } from '../candidates/candidate.repository';
import { EmployerRepository } from '../employers/employer.repository';
import { CompanyRepository } from '../companies/company.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly candidateRepo: CandidateRepository,
    private readonly employerRepo: EmployerRepository,
    private readonly companyRepo: CompanyRepository,
    private readonly jwtService: JwtService,
  ) {}

  async registerCandidate(dto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const existing = await this.candidateRepo.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const id = uuidv4();
    const now = new Date().toISOString();
    await this.candidateRepo.create(id, {
      id,
      email: dto.email,
      passwordHash: await bcrypt.hash(dto.password, 10),
      firstName: dto.firstName,
      lastName: dto.lastName,
      location: { city: '', country: '' },
      summary: '',
      skills: [],
      experience: [],
      education: [],
      availability: 'immediate',
      preferredJobTypes: [],
      salaryExpectation: { min: 0, max: 0, currency: 'USD' },
      createdAt: now,
      updatedAt: now,
    });

    return { id, role: 'candidate' as const };
  }

  async registerEmployer(dto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName: string;
  }) {
    const existing = await this.employerRepo.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const companyId = uuidv4();
    const now = new Date().toISOString();
    await this.companyRepo.create(companyId, {
      id: companyId,
      organizationName: dto.organizationName,
      createdAt: now,
    });

    const employerId = uuidv4();
    await this.employerRepo.create(employerId, {
      id: employerId,
      email: dto.email,
      passwordHash: await bcrypt.hash(dto.password, 10),
      firstName: dto.firstName,
      lastName: dto.lastName,
      companyId,
      isAdmin: true,
      createdAt: now,
      updatedAt: now,
    });

    return {
      id: employerId,
      role: 'employer' as const,
      companyId,
      isAdmin: true,
    };
  }

  async login(email: string, password: string) {
    const [candidate, employer] = await Promise.all([
      this.candidateRepo.findByEmail(email),
      this.employerRepo.findByEmail(email),
    ]);

    if (candidate && (await bcrypt.compare(password, candidate.passwordHash))) {
      const accessToken = this.jwtService.sign({
        sub: candidate.id,
        role: 'candidate',
      });
      return { accessToken, role: 'candidate', id: candidate.id };
    }

    if (employer && (await bcrypt.compare(password, employer.passwordHash))) {
      const accessToken = this.jwtService.sign({
        sub: employer.id,
        role: 'employer',
        companyId: employer.companyId,
        isAdmin: employer.isAdmin,
      });
      return {
        accessToken,
        role: 'employer',
        id: employer.id,
        companyId: employer.companyId,
        isAdmin: employer.isAdmin,
      };
    }

    throw new UnauthorizedException('Invalid email or password');
  }
}
