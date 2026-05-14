import { ApiProperty } from '@nestjs/swagger';

export class RegisterEmployerDto {
  @ApiProperty({ example: 'boss@acme.com' })
  email: string;

  @ApiProperty({ example: 'securepass123', minLength: 8 })
  password: string;

  @ApiProperty({ example: 'Alice' })
  firstName: string;

  @ApiProperty({ example: 'Smith' })
  lastName: string;

  @ApiProperty({ example: 'Acme Corp' })
  organizationName: string;
}
