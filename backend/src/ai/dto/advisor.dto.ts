import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdvisorDto {
  @ApiProperty({ description: 'Student ID' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: 'Academic query from student' })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiPropertyOptional({ description: 'Session for conversation context' })
  @IsString()
  @IsOptional()
  sessionId?: string;
}

export class AdvisorResponseDto {
  @ApiProperty()
  advice: string;

  @ApiProperty()
  studentId: string;

  @ApiPropertyOptional()
  relevantRegulations?: string[];

  @ApiPropertyOptional()
  warnings?: string[];
}
