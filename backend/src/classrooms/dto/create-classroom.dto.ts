import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClassroomType } from '../../database/entities';

export class CreateClassroomDto {
  @ApiProperty({ example: 'LH-101' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Lecture Hall 101' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ClassroomType })
  @IsEnum(ClassroomType)
  type: ClassroomType;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(1)
  capacity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  building?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  floor?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasProjector?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasComputers?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
