import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class JobLocationDto {
  @ApiPropertyOptional({ example: 'Sydney' }) city?: string;
  @ApiPropertyOptional({ example: 'Australia' }) country?: string;
  @ApiPropertyOptional({ example: false }) remote?: boolean;
}

class RequiredSkillDto {
  @ApiProperty({ example: 'TypeScript' }) name: string;
  @ApiPropertyOptional({ example: true }) required?: boolean;
  @ApiPropertyOptional({ example: 2 }) minYears?: number;
}

class SalaryRangeDto {
  @ApiPropertyOptional({ example: 100000 }) min?: number;
  @ApiPropertyOptional({ example: 140000 }) max?: number;
  @ApiPropertyOptional({ example: 'AUD' }) currency?: string;
}

export class CreateJobDto {
  @ApiProperty({ example: 'Senior Backend Developer' })
  title: string;

  @ApiProperty({ example: 'We are looking for a senior backend developer to join our team.' })
  description: string;

  @ApiPropertyOptional({ type: JobLocationDto })
  location?: JobLocationDto;

  @ApiPropertyOptional({ type: [RequiredSkillDto] })
  requiredSkills?: RequiredSkillDto[];

  @ApiPropertyOptional({ type: SalaryRangeDto })
  salaryRange?: SalaryRangeDto;

  @ApiPropertyOptional({ enum: ['fulltime', 'parttime', 'contract'], example: 'fulltime' })
  employmentType?: string;

  @ApiPropertyOptional({ enum: ['junior', 'mid', 'senior', 'lead'], example: 'senior' })
  experienceLevel?: string;

  @ApiPropertyOptional({
    enum: ['Technology', 'Finance', 'Healthcare', 'Education', 'Marketing', 'Engineering', 'Sales', 'Other'],
    example: 'Technology',
  })
  industry?: string;

  @ApiPropertyOptional({ enum: ['active', 'closed', 'draft'], example: 'active' })
  status?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  expiresAt?: string;
}
