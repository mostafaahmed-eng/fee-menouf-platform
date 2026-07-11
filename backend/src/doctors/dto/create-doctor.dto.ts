import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DoctorTitle } from '../../database/entities';

export class CreateDoctorDto {
  @ApiProperty({ example: 'DOC2024001' })
  @IsString()
  employeeId: string;

  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: DoctorTitle })
  @IsEnum(DoctorTitle)
  title: DoctorTitle;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  officeLocation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  officeHours?: string;
}
