import { IsUUID, IsEnum, IsString, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '../../database/entities';

class BatchRecordDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiProperty()
  @IsString()
  date: string;
}

export class MarkAttendanceBatchDto {
  @ApiProperty()
  @IsUUID()
  courseId: string;

  @ApiProperty({ type: [BatchRecordDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchRecordDto)
  records: BatchRecordDto[];
}
