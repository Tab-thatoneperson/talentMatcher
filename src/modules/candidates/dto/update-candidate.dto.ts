import { ApiPropertyOptional } from '@nestjs/swagger';

class LocationDto {
  @ApiPropertyOptional({ example: 'Sydney' }) city?: string;
  @ApiPropertyOptional({ example: 'Australia' }) country?: string;
}

class SkillDto {
  @ApiPropertyOptional({ example: 'TypeScript' }) name?: string;
  @ApiPropertyOptional({ minimum: 1, maximum: 5, example: 4 }) proficiencyLevel?: number;
  @ApiPropertyOptional({ example: 3 }) yearsOfExperience?: number;
}

class ExperienceDto {
  @ApiPropertyOptional({ example: 'Senior Developer' }) title?: string;
  @ApiPropertyOptional({ example: 'Acme Corp' }) company?: string;
  @ApiPropertyOptional({ example: 'Built scalable services' }) description?: string;
  @ApiPropertyOptional({ example: '2022-01' }) startDate?: string;
  @ApiPropertyOptional({ example: '2024-06', nullable: true }) endDate?: string | null;
  @ApiPropertyOptional({ example: false }) current?: boolean;
}

class EducationDto {
  @ApiPropertyOptional({ example: 'Bachelor of Science' }) degree?: string;
  @ApiPropertyOptional({ example: 'University of Wollongong' }) institution?: string;
  @ApiPropertyOptional({ example: 'Computer Science' }) field?: string;
  @ApiPropertyOptional({ example: 2023 }) graduationYear?: number;
}

class SalaryExpectationDto {
  @ApiPropertyOptional({ example: 80000 }) min?: number;
  @ApiPropertyOptional({ example: 120000 }) max?: number;
  @ApiPropertyOptional({ example: 'AUD' }) currency?: string;
}

export class UpdateCandidateDto {
  @ApiPropertyOptional({ example: 'John' }) firstName?: string;
  @ApiPropertyOptional({ example: 'Doe' }) lastName?: string;
  @ApiPropertyOptional({ type: LocationDto }) location?: LocationDto;
  @ApiPropertyOptional({ example: 'Remote' }) preferredWorking?: string;
  @ApiPropertyOptional({ example: 'Experienced full-stack developer' }) summary?: string;
  @ApiPropertyOptional({ type: [SkillDto] }) skills?: SkillDto[];
  @ApiPropertyOptional({ type: [ExperienceDto] }) experience?: ExperienceDto[];
  @ApiPropertyOptional({ type: [EducationDto] }) education?: EducationDto[];
  @ApiPropertyOptional({ enum: ['immediate', '2weeks', '1month'], example: 'immediate' })
  availability?: string;
  @ApiPropertyOptional({ enum: ['junior', 'mid', 'senior', 'lead'], example: 'mid' })
  experienceLevel?: string;
  @ApiPropertyOptional({ example: 'Technology' })
  industryPreference?: string;
  @ApiPropertyOptional({ enum: ['fulltime', 'parttime', 'contract', 'remote'], isArray: true })
  preferredJobTypes?: string[];
  @ApiPropertyOptional({ type: SalaryExpectationDto }) salaryExpectation?: SalaryExpectationDto;
  @ApiPropertyOptional({ example: false }) isMember?: boolean;
  @ApiPropertyOptional({ example: '78 Nothing street nowhere place 2898' }) billingAddress?: string;
}


