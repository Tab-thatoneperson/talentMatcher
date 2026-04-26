/**
 * EXAMPLE: How to create a repository for a specific index.
 *
 * 1. Define your document interface.
 * 2. Extend BaseRepository<YourDocument> and pass the index name to super().
 * 3. Add domain-specific query methods using this.search() or this.esService directly.
 * 4. Register this class as a provider in your feature module.
 */

import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { BaseRepository } from './base.repository';

// ─── Document shape ───────────────────────────────────────────────────────────

interface ExampleDocument extends Record<string, unknown> {
  id: string;
  title: string;
  tags: string[];
  score: number;
  createdAt: string;
}

// ─── Repository ───────────────────────────────────────────────────────────────

@Injectable()
export class ExampleRepository extends BaseRepository<ExampleDocument> {
  constructor(esService: ElasticsearchService) {
    super(esService, 'example');
  }

  // Domain-specific queries go here — inherited methods handle generic CRUD.

  findByTitle(title: string) {
    return this.search({ match: { title } });
  }

  findByTag(tag: string) {
    return this.search({ term: { tags: tag } });
  }

  findTopScored(size = 10) {
    return this.esService.search<ExampleDocument>({
      index: this.index,
      size,
      sort: [{ score: { order: 'desc' } }],
      query: { match_all: {} },
    });
  }
}
