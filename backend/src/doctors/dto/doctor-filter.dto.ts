import { IsOptional, IsString, IsUUID, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DoctorTitle } from '../../database/entities';

export class DoctorFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ enum: DoctorTitle })
  @IsOptional()
  @IsEnum(DoctorTitle)
  title?: DoctorTitle;
}
