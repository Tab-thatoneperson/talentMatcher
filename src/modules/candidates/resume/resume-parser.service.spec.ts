import { UnsupportedMediaTypeException } from '@nestjs/common';
import { ResumeParserService } from './resume-parser.service';

const mockDestroy = jest.fn().mockResolvedValue(undefined);
const mockGetText = jest.fn().mockResolvedValue({ text: 'extracted pdf text' });
jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn().mockImplementation(() => ({
    getText: mockGetText,
    destroy: mockDestroy,
  })),
}));

jest.mock('mammoth', () => ({
  extractRawText: jest.fn().mockResolvedValue({ value: 'extracted docx text' }),
}));

describe('ResumeParserService', () => {
  let service: ResumeParserService;

  beforeEach(() => {
    service = new ResumeParserService();
  });

  it('extracts text from a PDF buffer', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PDFParse } = require('pdf-parse') as { PDFParse: jest.Mock };
    const buffer = Buffer.from('fake pdf bytes');

    const result = await service.extractText(buffer, 'application/pdf');

    expect(result).toBe('extracted pdf text');
    expect(PDFParse).toHaveBeenCalledWith({ data: buffer });
    expect(mockGetText).toHaveBeenCalled();
    expect(mockDestroy).toHaveBeenCalled();
  });

  it('extracts text from a DOCX buffer', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require('mammoth') as { extractRawText: jest.Mock };
    const buffer = Buffer.from('fake docx bytes');

    const result = await service.extractText(
      buffer,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );

    expect(result).toBe('extracted docx text');
    expect(mammoth.extractRawText).toHaveBeenCalledWith({ buffer });
  });

  it('throws UnsupportedMediaTypeException for unsupported MIME types', async () => {
    await expect(
      service.extractText(Buffer.from(''), 'image/png'),
    ).rejects.toThrow(UnsupportedMediaTypeException);

    await expect(
      service.extractText(Buffer.from(''), 'text/plain'),
    ).rejects.toThrow(UnsupportedMediaTypeException);
  });
});
