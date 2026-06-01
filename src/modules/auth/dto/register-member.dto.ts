import { ApiProperty } from '@nestjs/swagger';

export class RegisterMemberDto {
  @ApiProperty({ example: 'Mr James Bond' })
  cardName: string;

  @ApiProperty({ example: '8976111109003456', minLength: 16 })
  cardNumber: string;

  @ApiProperty({ example: '09/28' })
  expiryDate: string;

  @ApiProperty({ example: '500' })
  CVC: string;

  @ApiProperty({ example: '78 Nothing street Nowhere place 2367' })
  billingAddress: string;
}
