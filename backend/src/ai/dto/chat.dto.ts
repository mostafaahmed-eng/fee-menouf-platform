import { IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ChatLanguage {
  ARABIC = 'ar',
  ENGLISH = 'en',
  BILINGUAL = 'bilingual',
}

export class ChatDto {
  @ApiProperty({ description: 'User message' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ enum: ChatLanguage, default: ChatLanguage.ENGLISH })
  @IsEnum(ChatLanguage)
  @IsOptional()
  language?: ChatLanguage;

  @ApiPropertyOptional({ description: 'Session ID for conversation history' })
  @IsString()
  @IsOptional()
  sessionId?: string;
}

export class ChatResponseDto {
  @ApiProperty()
  reply: string;

  @ApiProperty()
  sessionId: string;

  @ApiProperty()
  language: ChatLanguage;

  @ApiPropertyOptional()
  sources?: string[];
}
