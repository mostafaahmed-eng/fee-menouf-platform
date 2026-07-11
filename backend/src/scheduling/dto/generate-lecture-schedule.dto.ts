import { IsArray, IsUUID, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SemesterType } from '../../database/entities';

export class GenerateLectureScheduleDto {
  @ApiProperty()
  semesterId: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  courseIds: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preferences?: string;
}
