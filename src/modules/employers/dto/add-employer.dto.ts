import { ApiProperty } from '@nestjs/swagger';

export class AddEmployerDto {
  @ApiProperty({ example: 'colleague@company.com' })
  email: string;

  @ApiProperty({ example: 'securepass123', minLength: 8 })
  password: string;

  @ApiProperty({ example: 'Bob' })
  firstName: string;

  @ApiProperty({ example: 'Jones' })
  lastName: string;
}
