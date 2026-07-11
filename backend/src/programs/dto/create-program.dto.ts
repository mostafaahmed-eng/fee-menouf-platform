import { IsString, IsOptional, IsNumber, IsEnum, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Degree } from '../../database/entities';

export class CreateProgramDto {
  @ApiProperty()
  @IsString()
  nameAr: string;

  @ApiProperty()
  @IsString()
  nameEn: string;

  @ApiProperty()
  @IsString()
  code: string;

  @ApiPropertyOptional({ default: 4 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional({ default: 160 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  totalCredits?: number;

  @ApiPropertyOptional({ enum: Degree, default: Degree.BACHELOR })
  @IsOptional()
  @IsEnum(Degree)
  degree?: Degree;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;
}
