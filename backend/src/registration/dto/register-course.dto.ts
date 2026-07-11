import { IsUUID, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterCourseDto {
  @ApiProperty()
  @IsUUID()
  semesterId: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  courseIds: string[];
}
