import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { CandidatesService } from './candidates.service';
import { JwtAuth, CurrentUser } from '../../common/auth/decorators';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import type { JwtPayload } from '../../common/auth/jwt.strategy';

const resumeUpload = FileInterceptor('file', {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

@ApiTags('candidates')
@ApiBearerAuth('jwt')
@Controller('candidates')
export class CandidatesController {
  constructor(private readonly service: CandidatesService) {}

  @Get('me')
  @JwtAuth('candidate')
  @ApiOperation({ summary: 'Get own candidate profile' })
  @ApiResponse({ status: 200, description: 'Candidate profile (no passwordHash).' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getMe(@CurrentUser() user: JwtPayload) {
    return this.service.getMe(user.sub);
  }

  @Patch('me')
  @JwtAuth('candidate')
  @ApiOperation({ summary: 'Update own candidate profile fields' })
  @ApiResponse({ status: 200, description: 'Updated candidate profile.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  updateMe(@CurrentUser() user: JwtPayload, @Body() body: UpdateCandidateDto) {
    return this.service.updateMe(user.sub, body as never);
  }

  @Delete('me')
  @JwtAuth('candidate')
  @ApiOperation({ summary: 'Delete own candidate account and all associated data' })
  @ApiResponse({ status: 200, description: 'Account deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  deleteMe(@CurrentUser() user: JwtPayload) {
    return this.service.deleteMe(user.sub);
  }

  @Post('me/resume')
  @JwtAuth('candidate')
  @UseInterceptors(resumeUpload)
  @ApiOperation({ summary: 'Upload resume (PDF or DOCX, max 5 MB) — extracts profile data via AI' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'PDF or DOCX resume file' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Profile updated with extracted resume data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 415, description: 'Unsupported file type.' })
  uploadResume(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.uploadResume(user.sub, file.buffer, file.mimetype);
  }

  @Patch('me/resume')
  @JwtAuth('candidate')
  @UseInterceptors(resumeUpload)
  @ApiOperation({ summary: 'Re-upload resume — overwrites previously extracted fields' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Replacement PDF or DOCX resume file' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Profile updated with new resume data.' })
  @ApiResponse({ status: 415, description: 'Unsupported file type.' })
  reUploadResume(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.uploadResume(user.sub, file.buffer, file.mimetype);
  }

  @Get('search')
  @JwtAuth('employer')
  @ApiOperation({ summary: '[Employer] Full-text search across candidate profiles' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiResponse({ status: 200, description: 'Matching candidates (no passwordHash).' })
  search(@Query('q') q: string) {
    return this.service.search(q ?? '');
  }

  @Get()
  @JwtAuth('employer')
  @ApiOperation({ summary: '[Employer] List all candidates with optional filters' })
  @ApiQuery({ name: 'skills', required: false, description: 'Comma-separated skill names' })
  @ApiQuery({ name: 'education', required: false, description: 'Degree or field filter' })
  @ApiQuery({ name: 'experience', required: false, description: 'Minimum years of experience in a skill' })
  @ApiResponse({ status: 200, description: 'List of candidates (no passwordHash).' })
  listAll(
    @Query('skills') skills?: string,
    @Query('education') education?: string,
    @Query('experience') experience?: string,
  ) {
    return this.service.listAll({ skills, education, experience });
  }

  @Get(':id')
  @JwtAuth('employer')
  @ApiOperation({ summary: '[Employer] View a single candidate profile by id' })
  @ApiResponse({ status: 200, description: 'Candidate profile.' })
  @ApiResponse({ status: 404, description: 'Candidate not found.' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }
}
