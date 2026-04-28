import { ApiPropertyOptional } from '@nestjs/swagger';

class JobLocationDto {
  @ApiPropertyOptional({ example: 'Melbourne' }) city?: string;
  @ApiPropertyOptional({ example: 'Australia' }) country?: string;
  @ApiPropertyOptional({ example: true }) remote?: boolean;
}

class RequiredSkillDto {
  @ApiPropertyOptional({ example: 'Python' }) name?: string;
  @ApiPropertyOptional({ example: true }) required?: boolean;
  @ApiPropertyOptional({ example: 3 }) minYears?: number;
}

class SalaryRangeDto {
  @ApiPropertyOptional({ example: 90000 }) min?: number;
  @ApiPropertyOptional({ example: 130000 }) max?: number;
  @ApiPropertyOptional({ example: 'AUD' }) currency?: string;
}

export class UpdateJobDto {
  @ApiPropertyOptional({ example: 'Lead Backend Developer' }) title?: string;
  @ApiPropertyOptional({ example: 'Updated description.' }) description?: string;
  @ApiPropertyOptional({ type: JobLocationDto }) location?: JobLocationDto;
  @ApiPropertyOptional({ type: [RequiredSkillDto] }) requiredSkills?: RequiredSkillDto[];
  @ApiPropertyOptional({ type: SalaryRangeDto }) salaryRange?: SalaryRangeDto;
  @ApiPropertyOptional({ enum: ['fulltime', 'parttime', 'contract'] }) employmentType?: string;
  @ApiPropertyOptional({ enum: ['junior', 'mid', 'senior', 'lead'] }) experienceLevel?: string;
  @ApiPropertyOptional({ enum: ['active', 'closed', 'draft'] }) status?: string;
  @ApiPropertyOptional({ example: '2027-06-30' }) expiresAt?: string;
}
