import { IsArray, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExamType } from '../../database/entities';

export class GenerateExamScheduleDto {
  @ApiProperty()
  semesterId: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  courseIds: string[];

  @ApiProperty({ enum: ExamType })
  @IsEnum(ExamType)
  examType: ExamType;
}
