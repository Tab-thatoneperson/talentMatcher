import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { EmployersService } from './employers.service';
import { JwtAuth, CurrentUser } from '../../common/auth/decorators';
import { AddEmployerDto } from './dto/add-employer.dto';
import { UpdateEmployerDto } from './dto/update-employer.dto';
import type { JwtPayload } from '../../common/auth/jwt.strategy';

@ApiTags('employers')
@ApiBearerAuth('jwt')
@Controller('employers')
export class EmployersController {
  constructor(private readonly service: EmployersService) {}

  @Get('me')
  @JwtAuth('employer')
  @ApiOperation({ summary: 'Get own employer profile' })
  @ApiResponse({
    status: 200,
    description: 'Employer profile (no passwordHash).',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getMe(@CurrentUser() user: JwtPayload) {
    return this.service.getMe(user.sub);
  }

  @Patch('me')
  @JwtAuth('employer')
  @ApiOperation({ summary: 'Update own employer profile' })
  @ApiResponse({ status: 200, description: 'Updated employer profile.' })
  updateMe(@CurrentUser() user: JwtPayload, @Body() body: UpdateEmployerDto) {
    return this.service.updateMe(user.sub, body as never);
  }

  @Delete('me')
  @JwtAuth('employer')
  @ApiOperation({ summary: 'Delete own employer account' })
  @ApiResponse({ status: 200, description: 'Account deleted.' })
  deleteMe(@CurrentUser() user: JwtPayload) {
    return this.service.deleteMe(user.sub);
  }

  @Get()
  @JwtAuth('employer')
  @ApiOperation({ summary: '[Admin] List all employers in own company' })
  @ApiResponse({
    status: 200,
    description: 'List of employers in the company.',
  })
  @ApiResponse({ status: 403, description: 'Admin access required.' })
  listAll(@CurrentUser() user: JwtPayload) {
    if (!user.isAdmin) throw new ForbiddenException('Admin only');
    return this.service.listByCompany(user.companyId!);
  }

  @Post()
  @JwtAuth('employer')
  @ApiOperation({ summary: '[Admin] Add a new employer to own company' })
  @ApiResponse({ status: 201, description: 'New employer created.' })
  @ApiResponse({ status: 403, description: 'Admin access required.' })
  addEmployer(@CurrentUser() user: JwtPayload, @Body() body: AddEmployerDto) {
    if (!user.isAdmin) throw new ForbiddenException('Admin only');
    return this.service.addToCompany(user.companyId!, body);
  }

  @Patch(':id')
  @JwtAuth('employer')
  @ApiOperation({ summary: '[Admin] Update another employer in own company' })
  @ApiResponse({ status: 200, description: 'Employer updated.' })
  @ApiResponse({
    status: 403,
    description: 'Admin access required or not in your company.',
  })
  @ApiResponse({ status: 404, description: 'Employer not found.' })
  updateById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: UpdateEmployerDto,
  ) {
    if (!user.isAdmin) throw new ForbiddenException('Admin only');
    return this.service.updateById(id, user.companyId!, body as never);
  }

  @Delete(':id')
  @JwtAuth('employer')
  @ApiOperation({ summary: '[Admin] Remove an employer from own company' })
  @ApiResponse({ status: 200, description: 'Employer removed.' })
  @ApiResponse({
    status: 403,
    description: 'Admin access required or not in your company.',
  })
  @ApiResponse({ status: 404, description: 'Employer not found.' })
  deleteById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    if (!user.isAdmin) throw new ForbiddenException('Admin only');
    return this.service.deleteById(id, user.companyId!);
  }
}
