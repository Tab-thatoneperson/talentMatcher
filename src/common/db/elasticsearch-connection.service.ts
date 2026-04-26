import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class ElasticsearchConnectionService implements OnModuleInit {
  private readonly logger = new Logger('Elasticsearch');

  constructor(private readonly esService: ElasticsearchService) {}

  async onModuleInit() {
    const info = await this.esService.info();
    this.logger.log(
      `Connected to Elasticsearch ${info.version.number} at ${info.name}`,
    );
  }
}
