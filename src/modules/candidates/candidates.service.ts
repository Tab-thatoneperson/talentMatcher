import { Injectable, NotFoundException } from '@nestjs/common';
import { CandidateDocument, CandidateRepository } from './candidate.repository';
import { ResumeParserService } from './resume/resume-parser.service';
import { LlmService } from '../../common/llm/llm.service';

function sanitize(
  doc: CandidateDocument,
): Omit<CandidateDocument, 'passwordHash'> {
  const { passwordHash: _pw, ...rest } = doc;
  void _pw;
  return rest;
}

@Injectable()
export class CandidatesService {
  constructor(
    private readonly repo: CandidateRepository,
    private readonly resumeParser: ResumeParserService,
    private readonly llm: LlmService,
  ) {}

  async getMe(id: string) {
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException('Candidate not found');
    return sanitize(doc);
  }

  async updateMe(id: string, partial: Partial<CandidateDocument>) {
    const {
      email: _e,
      passwordHash: _pw,
      id: _id,
      createdAt: _ca,
      ...safe
    } = partial as Record<string, unknown>;
    void _e;
    void _pw;
    void _id;
    void _ca;
    await this.repo.update(id, {
      ...(safe as Partial<CandidateDocument>),
      updatedAt: new Date().toISOString(),
    });
    return this.getMe(id);
  }

  async deleteMe(id: string) {
    await this.repo.delete(id);
  }

  async uploadResume(id: string, buffer: Buffer, mimetype: string) {
    const rawText = await this.resumeParser.extractText(buffer, mimetype);
    const extracted = await this.llm.extractResumeData(rawText);

    const {
      email: _e,
      id: _id,
      passwordHash: _pw,
      createdAt: _ca,
      ...profileFields
    } = extracted;
    void _e;
    void _id;
    void _pw;
    void _ca;

    if (Object.keys(profileFields).length > 0) {
      await this.repo.update(id, {
        ...(profileFields as Partial<CandidateDocument>),
        updatedAt: new Date().toISOString(),
      });
    }

    return this.getMe(id);
  }

  async listAll(filters: {
    skills?: string;
    education?: string;
    experience?: string;
  }) {
    const docs = await this.repo.findFiltered(filters);
    return docs.map(sanitize);
  }

  async search(q: string) {
    const docs = await this.repo.fullTextSearch(q);
    return docs.map(sanitize);
  }

  async getById(id: string) {
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException('Candidate not found');
    return sanitize(doc);
  }
}
