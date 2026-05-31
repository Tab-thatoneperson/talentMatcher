import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterCandidateDto } from './dto/register-candidate.dto';
import { RegisterEmployerDto } from './dto/register-employer.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/candidate')
  @ApiOperation({ summary: 'Register a new candidate account' })
  @ApiResponse({
    status: 201,
    description: 'Candidate created. Returns id and role.',
  })
  @ApiResponse({ status: 409, description: 'Email already registered.' })
  registerCandidate(@Body() dto: RegisterCandidateDto) {
    return this.authService.registerCandidate(dto);
  }

  @Post('register/employer')
  @ApiOperation({
    summary:
      'Register a new employer — creates company and admin account in one step',
  })
  @ApiResponse({
    status: 201,
    description:
      'Employer and company created. Returns id, companyId, isAdmin.',
  })
  @ApiResponse({ status: 409, description: 'Email already registered.' })
  registerEmployer(@Body() dto: RegisterEmployerDto) {
    return this.authService.registerEmployer(dto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Log in as candidate or employer — returns a JWT access token',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Returns accessToken, role, id.',
  })
  @ApiResponse({ status: 401, description: 'Invalid email or password.' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }
}
