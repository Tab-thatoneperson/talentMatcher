import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CompanyRepository } from '../companies/company.repository';
import { JwtAuth, CurrentUser } from '../../common/auth/decorators';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import type { JwtPayload } from '../../common/auth/jwt.strategy';

@ApiTags('jobs')
@ApiBearerAuth('jwt')
@Controller('jobs')
export class JobsController {
  constructor(
    private readonly service: JobsService,
    private readonly companyRepo: CompanyRepository,
  ) {}

  @Get('mine')
  @JwtAuth('employer')
  @ApiOperation({ summary: "[Employer] List own company's job listings" })
  @ApiResponse({ status: 200, description: "Company's job listings." })
  getMyJobs(@CurrentUser() user: JwtPayload) {
    return this.service.listByCompany(user.companyId!);
  }

  @Get('search')
  @JwtAuth()
  @ApiOperation({ summary: 'Full-text search across job listings' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiResponse({ status: 200, description: 'Matching job listings.' })
  search(@Query('q') q: string) {
    return this.service.search(q ?? '');
  }

  @Get('recommendations')
  @JwtAuth('candidate')
  @ApiOperation({
    summary:
      '[Candidate] Get top 10 job recommendations based on profile skills',
  })
  @ApiResponse({ status: 200, description: 'Top 10 recommended jobs.' })
  @ApiResponse({ status: 404, description: 'Candidate profile not found.' })
  getRecommendations(@CurrentUser() user: JwtPayload) {
    return this.service.getRecommendationsForCandidate(user.sub);
  }

  @Get()
  @JwtAuth('candidate')
  @ApiOperation({ summary: '[Candidate] List all active job postings' })
  @ApiResponse({ status: 200, description: 'All active jobs.' })
  listActive() {
    return this.service.listActive();
  }

  @Get(':id/recommendations')
  @JwtAuth('employer')
  @ApiOperation({
    summary:
      '[Employer] Get top 10 candidate recommendations for a job listing',
  })
  @ApiResponse({
    status: 200,
    description: 'Top 10 recommended candidates (no passwordHash).',
  })
  @ApiResponse({ status: 404, description: 'Job not found.' })
  getJobRecommendations(@Param('id') id: string) {
    return this.service.getRecommendationsForJob(id);
  }

  @Get(':id')
  @JwtAuth()
  @ApiOperation({ summary: 'Get a single job listing by id' })
  @ApiResponse({ status: 200, description: 'Job details.' })
  @ApiResponse({ status: 404, description: 'Job not found.' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @JwtAuth('employer')
  @ApiOperation({ summary: '[Employer] Create a new job listing' })
  @ApiResponse({ status: 201, description: 'Job listing created.' })
  async create(@CurrentUser() user: JwtPayload, @Body() body: CreateJobDto) {
    const company = await this.companyRepo.findById(user.companyId!);
    return this.service.create(
      user.companyId!,
      company?.organizationName ?? '',
      body as never,
    );
  }

  @Patch(':id')
  @JwtAuth('employer')
  @ApiOperation({ summary: '[Employer] Update own job listing' })
  @ApiResponse({ status: 200, description: 'Job updated.' })
  @ApiResponse({ status: 403, description: 'Not your job.' })
  @ApiResponse({ status: 404, description: 'Job not found.' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: UpdateJobDto,
  ) {
    return this.service.update(id, user.companyId!, body as never);
  }

  @Delete(':id')
  @JwtAuth('employer')
  @ApiOperation({ summary: '[Employer] Delete own job listing' })
  @ApiResponse({ status: 200, description: 'Job deleted.' })
  @ApiResponse({ status: 403, description: 'Not your job.' })
  @ApiResponse({ status: 404, description: 'Job not found.' })
  delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.delete(id, user.companyId!);
  }
}
