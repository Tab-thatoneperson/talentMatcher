import { Module, Global } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchConnectionService } from './elasticsearch-connection.service';

@Global()
@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        node: config.get<string>('elasticsearch.node'),
        auth: config.get('elasticsearch.auth'),
        tls: config.get('elasticsearch.tls'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [ElasticsearchConnectionService],
  exports: [ElasticsearchModule],
})
export class AppElasticsearchModule {}
