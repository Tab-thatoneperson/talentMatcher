import { Module } from '@nestjs/common';
import { CandidateRepository } from './candidate.repository';

@Module({
  providers: [CandidateRepository],
  exports: [CandidateRepository],
})
export class CandidatesModule {}
