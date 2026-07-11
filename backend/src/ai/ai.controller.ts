import { Controller, Get, Post, Body, Param, Delete, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { ConversationLanguage } from '../database/entities/ai-conversation.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly aiService: AiService,
  ) {}

  @Post('chat')
  @ApiOperation({ summary: 'Send a message to AI assistant' })
  async chat(
    @CurrentUser('id') userId: string,
    @Body() dto: { message: string; language?: ConversationLanguage; sessionId?: string },
  ) {
    return this.aiService.sendMessage(
      userId,
      dto.message,
      dto.language || ConversationLanguage.EN,
      dto.sessionId,
    );
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get user conversation sessions' })
  getSessions(@CurrentUser('id') userId: string) {
    return this.aiService.getUserSessions(userId);
  }

  @Get('sessions/:sessionId')
  @ApiOperation({ summary: 'Get conversation history' })
  getHistory(
    @CurrentUser('id') userId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.aiService.getConversationHistory(userId, sessionId);
  }

  @Delete('sessions/:sessionId')
  @ApiOperation({ summary: 'Delete a conversation session' })
  deleteSession(
    @CurrentUser('id') userId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.aiService.deleteSession(userId, sessionId);
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Clear all conversations' })
  clearAll(@CurrentUser('id') userId: string) {
    return this.aiService.clearAllConversations(userId);
  }
}
