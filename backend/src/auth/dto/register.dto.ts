import {
  IsEmail, IsString, MinLength, MaxLength, IsOptional, IsUUID, IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../database/entities/user.entity';

const SELF_REGISTRATION_ROLES = [UserRole.STUDENT];

export class RegisterDto {
  @ApiProperty({ example: 'student1@fee-menouf.edu.eg' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;

  @ApiProperty({ example: 'أحمد محمد' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  fullNameAr: string;

  @ApiProperty({ example: 'Ahmed Mohamed' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  fullNameEn: string;

  @ApiProperty({ enum: SELF_REGISTRATION_ROLES, example: UserRole.STUDENT })
  @IsIn(SELF_REGISTRATION_ROLES)
  role: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ example: '+201234567890' })
  @IsOptional()
  @IsString()
  phone?: string;
}
