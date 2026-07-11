import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Faculty } from '../../database/entities';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Computer Science' })
  @IsString()
  nameEn: string;

  @ApiProperty({ example: 'علوم الحاسب' })
  @IsString()
  nameAr: string;

  @ApiProperty({ example: 'CS' })
  @IsString()
  code: string;

  @ApiProperty({ enum: Faculty })
  @IsEnum(Faculty)
  faculty: Faculty;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  headId?: string;
}
