import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectRegistrationDto {
  @ApiProperty()
  @IsString()
  reason: string;
}
