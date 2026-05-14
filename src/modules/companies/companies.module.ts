import { Module } from '@nestjs/common';
import { CompanyRepository } from './company.repository';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';

@Module({
  providers: [CompanyRepository, CompaniesService],
  controllers: [CompaniesController],
  exports: [CompanyRepository],
})
export class CompaniesModule {}
