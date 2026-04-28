import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEmployerDto {
  @ApiPropertyOptional({ example: 'Alice' }) firstName?: string;
  @ApiPropertyOptional({ example: 'Johnson' }) lastName?: string;
}
