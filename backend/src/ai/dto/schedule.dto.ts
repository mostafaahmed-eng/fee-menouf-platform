import { IsString, IsNotEmpty, IsOptional, IsArray, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScheduleConstraint {
  @ApiPropertyOptional()
  maxLecturesPerDay?: number;

  @ApiPropertyOptional()
  maxLabHoursPerWeek?: number;

  @ApiPropertyOptional()
  preferredStartTime?: string;

  @ApiPropertyOptional()
  preferredEndTime?: string;

  @ApiPropertyOptional()
  avoidDays?: string[];

  @ApiPropertyOptional({ default: false })
  noBackToBack?: boolean;

  @ApiPropertyOptional({ default: true })
  respectCapacity?: boolean;
}

export class ScheduleDto {
  @ApiProperty({ description: 'Semester ID' })
  @IsString()
  @IsNotEmpty()
  semesterId: string;

  @ApiPropertyOptional({ type: ScheduleConstraint })
  @IsObject()
  @IsOptional()
  constraints?: ScheduleConstraint;
}

export class ScheduleResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  scheduleId: string;

  @ApiProperty()
  totalSessions: number;

  @ApiProperty()
  conflicts: number;

  @ApiPropertyOptional()
  details?: Record<string, unknown>;
}

export class RecommendDto {
  @ApiProperty({ description: 'Student ID' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiPropertyOptional({ description: 'Semester ID' })
  @IsString()
  @IsOptional()
  semesterId?: string;
}

export class RiskPredictionDto {
  @ApiProperty({ description: 'Student ID' })
  @IsString()
  @IsNotEmpty()
  studentId: string;
}

export class GraduationCheckDto {
  @ApiProperty({ description: 'Student ID' })
  @IsString()
  @IsNotEmpty()
  studentId: string;
}
