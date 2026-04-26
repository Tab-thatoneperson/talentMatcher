import { ElasticsearchService } from '@nestjs/elasticsearch';
import type { QueryDslQueryContainer } from '@elastic/elasticsearch/lib/api/types';

export abstract class BaseRepository<T extends Record<string, unknown>> {
  constructor(
    protected readonly esService: ElasticsearchService,
    protected readonly index: string,
  ) {}

  async create(id: string, document: T): Promise<void> {
    await this.esService.index({ index: this.index, id, document });
  }

  async findById(id: string): Promise<T | null> {
    try {
      const result = await this.esService.get<T>({ index: this.index, id });
      return result._source ?? null;
    } catch {
      return null;
    }
  }

  async update(id: string, partial: Partial<T>): Promise<void> {
    await this.esService.update({ index: this.index, id, doc: partial });
  }

  async delete(id: string): Promise<void> {
    await this.esService.delete({ index: this.index, id });
  }

  async findAll(size = 100): Promise<T[]> {
    const result = await this.esService.search<T>({
      index: this.index,
      size,
      query: { match_all: {} },
    });
    return result.hits.hits.map((hit) => hit._source as T);
  }

  async search(query: QueryDslQueryContainer, size = 10): Promise<T[]> {
    const result = await this.esService.search<T>({
      index: this.index,
      size,
      query,
    });
    return result.hits.hits.map((hit) => hit._source as T);
  }
}
