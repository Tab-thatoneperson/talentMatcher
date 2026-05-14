import { Module } from '@nestjs/common';
import { EmployerRepository } from './employer.repository';
import { EmployersService } from './employers.service';
import { EmployersController } from './employers.controller';

@Module({
  providers: [EmployerRepository, EmployersService],
  controllers: [EmployersController],
  exports: [EmployerRepository],
})
export class EmployersModule {}
