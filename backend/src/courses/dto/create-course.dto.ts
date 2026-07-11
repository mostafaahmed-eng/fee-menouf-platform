import { IsString, IsOptional, IsUUID, IsNumber, IsBoolean, Min, Max, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ example: 'CS101' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'مقدمة في علوم الحاسب' })
  @IsString()
  nameAr: string;

  @ApiProperty({ example: 'Introduction to Computer Science' })
  @IsString()
  nameEn: string;

  @ApiProperty({ example: 3 })
  @IsNumber()
  @Min(1)
  @Max(6)
  credits: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lectureHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  labHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @IsNumber()
  capacity?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  maxStudents?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  programId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  prerequisiteIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
