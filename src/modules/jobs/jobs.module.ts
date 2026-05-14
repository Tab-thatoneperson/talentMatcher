import { Module } from '@nestjs/common';
import { JobRepository } from './job.repository';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { CandidatesModule } from '../candidates/candidates.module';
import { CompaniesModule } from '../companies/companies.module';

@Module({
  imports: [CandidatesModule, CompaniesModule],
  providers: [JobRepository, JobsService],
  controllers: [JobsController],
  exports: [JobRepository],
})
export class JobsModule {}
