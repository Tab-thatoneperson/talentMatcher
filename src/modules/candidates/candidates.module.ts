import { Module } from '@nestjs/common';
import { CandidateRepository } from './candidate.repository';
import { CandidatesService } from './candidates.service';
import { CandidatesController } from './candidates.controller';
import { ResumeParserService } from './resume/resume-parser.service';

@Module({
  providers: [CandidateRepository, CandidatesService, ResumeParserService],
  controllers: [CandidatesController],
  exports: [CandidateRepository],
})
export class CandidatesModule {}
