import { Injectable, UnsupportedMediaTypeException } from '@nestjs/common';
import * as mammoth from 'mammoth';

const PDF_MIME = 'application/pdf';
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

@Injectable()
export class ResumeParserService {
  async extractText(buffer: Buffer, mimetype: string): Promise<string> {
    if (mimetype === PDF_MIME) {
      // pdf-parse v2 uses a class-based API: new PDFParse({ data: buffer }).getText()
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PDFParse } = require('pdf-parse') as {
        PDFParse: new (opts: { data: Buffer }) => {
          getText(): Promise<{ text: string }>;
          destroy(): Promise<void>;
        };
      };
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      await parser.destroy();
      return result.text;
    }

    if (mimetype === DOCX_MIME) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    throw new UnsupportedMediaTypeException(
      'Only PDF and DOCX files are allowed',
    );
  }
}
