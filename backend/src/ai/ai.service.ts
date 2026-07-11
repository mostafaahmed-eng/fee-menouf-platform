import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AiConversation, ConversationRole, ConversationLanguage } from '../database/entities/ai-conversation.entity';
import { User } from '../database/entities/user.entity';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @InjectRepository(AiConversation)
    private conversationRepository: Repository<AiConversation>,
  ) {}

  async sendMessage(
    userId: string,
    content: string,
    language: ConversationLanguage = ConversationLanguage.EN,
    sessionId?: string,
  ) {
    const actualSessionId = sessionId || uuidv4();
    const now = new Date().toISOString();

    this.logger.debug(`Saving messages for user ${userId} session ${actualSessionId}`);

    await this.conversationRepository.query(
      `INSERT INTO app.ai_conversations (session_id, role, content, language, tokens_used, user_id) VALUES ($1, $2, $3, $4, $5, $6)`,
      [actualSessionId, ConversationRole.USER, content, language, content.length, userId],
    );

    const assistantResponse = this.generateResponse(content, language);

    await this.conversationRepository.query(
      `INSERT INTO app.ai_conversations (session_id, role, content, language, tokens_used, metadata, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [actualSessionId, ConversationRole.ASSISTANT, assistantResponse, language, assistantResponse.length, JSON.stringify({ model: 'gpt-4', temperature: 0.7 }), userId],
    );

    return {
      sessionId: actualSessionId,
      message: assistantResponse,
      language,
    };
  }

  async getConversationHistory(userId: string, sessionId: string): Promise<AiConversation[]> {
    return this.conversationRepository.find({
      where: { user: { id: userId } as User, sessionId },
      order: { timestamp: 'ASC' },
    });
  }

  async getUserSessions(userId: string): Promise<any[]> {
    const sessions = await this.conversationRepository
      .createQueryBuilder('conv')
      .select('conv.sessionId', 'sessionId')
      .addSelect('MIN(conv.timestamp)', 'startedAt')
      .addSelect('MAX(conv.timestamp)', 'lastMessage')
      .addSelect('COUNT(conv.id)', 'messageCount')
      .where('conv.user_id = :userId', { userId })
      .groupBy('conv.sessionId')
      .orderBy('MAX(conv.timestamp)', 'DESC')
      .getRawMany();
    return sessions;
  }

  async deleteSession(userId: string, sessionId: string): Promise<void> {
    await this.conversationRepository.delete({ user: { id: userId } as User, sessionId });
  }

  async clearAllConversations(userId: string): Promise<number> {
    const result = await this.conversationRepository.delete({ user: { id: userId } as User });
    return result.affected || 0;
  }

  private generateResponse(userMessage: string, language: ConversationLanguage): string {
    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes('register') || lowerMessage.includes('تسجيل')) {
      return language === ConversationLanguage.AR
        ? 'للتسجيل في المقررات، يرجى زيارة بوابة التسجيل خلال فترة التسجيل المحددة. يمكنك التسجيل في المواد المتاحة حسب خطتك الدراسية.'
        : 'To register for courses, please visit the registration portal during the specified registration period. You can register for available courses according to your study plan.';
    }
    if (lowerMessage.includes('grade') || lowerMessage.includes('درجة') || lowerMessage.includes('result') || lowerMessage.includes('ناتج')) {
      return language === ConversationLanguage.AR
        ? 'يمكنك عرض نتائجك من خلال لوحة التحكم الخاصة بك في قسم "الدرجات". سيتم نشر النتائج بعد اعتمادها من قبل الدكتور المختص.'
        : 'You can view your grades through your dashboard in the "Grades" section. Results are published after approval by the responsible doctor.';
    }
    if (lowerMessage.includes('schedule') || lowerMessage.includes('جدول') || lowerMessage.includes('timetable')) {
      return language === ConversationLanguage.AR
        ? 'يمكنك عرض جدولك الدراسي من خلال قسم "الجدول" في لوحة التحكم. يتم تحديث الجدول في بداية كل فصل دراسي.'
        : 'You can view your schedule through the "Schedule" section in your dashboard. The schedule is updated at the beginning of each semester.';
    }
    if (lowerMessage.includes('attendance') || lowerMessage.includes('حضور')) {
      return language === ConversationLanguage.AR
        ? 'يتم تسجيل الحضور باستخدام رمز QR أو عبر نظام تحديد المواقع. تأكد من تسجيل حضورك في الوقت المحدد لكل محاضرة.'
        : 'Attendance is recorded using QR code or geolocation system. Make sure to mark your attendance at the specified time for each lecture.';
    }
    if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('مرحبا')) {
      return language === ConversationLanguage.AR
        ? 'مرحباً بك في المساعد الذكي لجامعة المنوفية - كلية الهندسة الإلكترونية! كيف يمكنني مساعدتك اليوم؟'
        : 'Welcome to the FEE-MENOUF Smart Assistant! How can I help you today?';
    }
    return language === ConversationLanguage.AR
      ? 'شكراً لاستفسارك. للمساعدة في استفسارات التسجيل والدرجات والجداول والحضور، يرجى توضيح سؤالك بشكل أكثر تحديداً.'
      : 'Thank you for your inquiry. For assistance with registrations, grades, schedules, and attendance, please clarify your question.';
  }
}
