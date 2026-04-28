import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppElasticsearchModule } from './common/db/elasticsearch.module';
import { LlmModule } from './common/llm/llm.module';
import elasticsearchConfig from './common/config/elasticsearch.config';
import { AuthModule } from './modules/auth/auth.module';
import { CandidatesModule } from './modules/candidates/candidates.module';
import { EmployersModule } from './modules/employers/employers.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { CompaniesModule } from './modules/companies/companies.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [elasticsearchConfig],
      envFilePath: '.env',
    }),
    AppElasticsearchModule,
    LlmModule,
    AuthModule,
    CandidatesModule,
    EmployersModule,
    JobsModule,
    CompaniesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
