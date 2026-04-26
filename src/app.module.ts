import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppElasticsearchModule } from './common/db/elasticsearch.module';
import elasticsearchConfig from './common/config/elasticsearch.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [elasticsearchConfig],
      envFilePath: '.env',
    }),
    AppElasticsearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
