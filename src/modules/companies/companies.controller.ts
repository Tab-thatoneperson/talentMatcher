import { Body, Controller, Delete, Get, Param, Patch } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { JwtAuth, CurrentUser } from '../../common/auth/decorators';
import { UpdateCompanyDto } from './dto/update-company.dto';
import type { JwtPayload } from '../../common/auth/jwt.strategy';

@ApiTags('companies')
@ApiBearerAuth('jwt')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}

  @Get(':id')
  @JwtAuth()
  @ApiOperation({ summary: 'Get company details by id' })
  @ApiResponse({ status: 200, description: 'Company details.' })
  @ApiResponse({ status: 404, description: 'Company not found.' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Patch(':id')
  @JwtAuth('employer')
  @ApiOperation({ summary: '[Admin Employer] Update own company details' })
  @ApiResponse({ status: 200, description: 'Company updated.' })
  @ApiResponse({
    status: 403,
    description: 'Admin access required for own company only.',
  })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: UpdateCompanyDto,
  ) {
    return this.service.update(
      id,
      user.isAdmin ?? false,
      user.companyId ?? '',
      body as never,
    );
  }

  @Delete(':id')
  @JwtAuth('employer')
  @ApiOperation({ summary: '[Admin Employer] Delete own company' })
  @ApiResponse({ status: 200, description: 'Company deleted.' })
  @ApiResponse({
    status: 403,
    description: 'Admin access required for own company only.',
  })
  delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.delete(id, user.isAdmin ?? false, user.companyId ?? '');
  }
}
