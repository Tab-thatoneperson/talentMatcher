import { Module } from '@nestjs/common';
import { JobRepository } from './job.repository';

@Module({
  providers: [JobRepository],
  exports: [JobRepository],
})
export class JobsModule {}
