import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AiConversation, ConversationRole, ConversationLanguage } from '../database/entities/ai-conversation.entity';
import { StudentsService } from '../students/students.service';
import { GradesService } from '../grades/grades.service';
import { AttendanceService } from '../attendance/attendance.service';
import { RegistrationService } from '../registration/registration.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly aiEngineUrl: string;

  constructor(
    @InjectRepository(AiConversation)
    private conversationRepository: Repository<AiConversation>,
    private readonly configService: ConfigService,
    private readonly studentsService: StudentsService,
    private readonly gradesService: GradesService,
    private readonly attendanceService: AttendanceService,
    private readonly registrationService: RegistrationService,
  ) {
    this.aiEngineUrl = this.configService.get<string>('app.aiEngineUrl') || 'http://ai-engine:8000';
  }

  async sendMessage(
    userId: string,
    content: string,
    language: ConversationLanguage = ConversationLanguage.EN,
    sessionId?: string,
  ) {
    const actualSessionId = sessionId || uuidv4();

    await this.conversationRepository.query(
      `INSERT INTO app.ai_conversations (session_id, role, content, language, tokens_used, user_id) VALUES ($1, $2, $3, $4, $5, $6)`,
      [actualSessionId, ConversationRole.USER, content, language, content.length, userId],
    );

    const studentData = await this.buildStudentContext(userId);
    this.logger.log(`Student context built for user ${userId}: ${studentData ? 'YES' : 'NO'}`);
    if (studentData) {
      this.logger.debug(`Student context: ${JSON.stringify(studentData)}`);
    }

    const assistantResponse = await this.proxyToAiEngine(content, language, actualSessionId, studentData);

    await this.conversationRepository.query(
      `INSERT INTO app.ai_conversations (session_id, role, content, language, tokens_used, metadata, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [actualSessionId, ConversationRole.ASSISTANT, assistantResponse, language, assistantResponse.length, JSON.stringify({ model: 'ai-engine', proxy: true }), userId],
    );

    return {
      sessionId: actualSessionId,
      message: assistantResponse,
      language,
    };
  }

  private async buildStudentContext(userId: string): Promise<Record<string, any> | null> {
    try {
      const student = await this.studentsService.findByUserId(userId);
      if (!student) return null;

      const studentId = student.id;

      let transcript: any = null;
      try {
        transcript = await this.gradesService.getStudentTranscript(studentId);
      } catch {
        this.logger.debug('Could not fetch transcript for student context');
      }

      let attendance: any[] = [];
      try {
        attendance = await this.attendanceService.getStudentAttendance(studentId);
      } catch {
        this.logger.debug('Could not fetch attendance for student context');
      }

      let registrations: any[] = [];
      try {
        registrations = await this.registrationService.getStudentRegistrations(studentId);
      } catch {
        this.logger.debug('Could not fetch registrations for student context');
      }

      const enrolledCourses = registrations
        .filter((r: any) => r.status === 'APPROVED' || r.status === 'PENDING')
        .map((r: any) => r.course?.nameEn || r.course?.nameAr || 'Unknown')
        .filter(Boolean);

      let recentGrades: string[] = [];
      if (transcript?.courses) {
        recentGrades = transcript.courses.map((c: any) =>
          `${c.name || c.nameEn || c.nameAr || 'Unknown'} (${c.code || ''}): ${c.totalScore !== undefined ? c.totalScore + '%' : 'N/A'}`,
        );
      }

      let attendanceRate = 0;
      if (attendance.length > 0) {
        const present = attendance.filter((a: any) => a.status === 'PRESENT').length;
        attendanceRate = Math.round((present / attendance.length) * 100);
      }

      return {
        name: student.user?.fullNameEn || student.user?.fullNameAr || 'Student',
        department: student.department?.nameEn || student.department?.nameAr || '',
        academic_level: student.level || 1,
        gpa: student.gpa || 0,
        cgpa: student.cgpa || 0,
        completed_credits: student.totalCredits || 0,
        current_semester: student.semester?.nameEn || student.semester?.nameAr || '',
        enrolled_courses: enrolledCourses,
        recent_grades: recentGrades,
        attendance_rate: attendanceRate,
        failed_credits: 0,
        student_id: student.studentId || '',
      };
    } catch (error) {
      this.logger.warn(`Failed to build student context for user ${userId}: ${error.message}`);
      return null;
    }
  }

  private async proxyToAiEngine(
    message: string,
    language: ConversationLanguage,
    sessionId: string,
    studentData: Record<string, any> | null,
  ): Promise<string> {
    try {
      const url = `${this.aiEngineUrl}/api/v1/chat`;
      const body: Record<string, any> = {
        message,
        session_id: sessionId,
      };
      if (studentData) {
        body.student_data = studentData;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`AI engine responded with ${response.status}: ${errorText}`);
        return this.getFallbackResponse(language);
      }

      const result = await response.json();
      return result.answer || result.message || this.getFallbackResponse(language);
    } catch (error) {
      this.logger.error(`Failed to proxy to AI engine: ${error.message}`);
      return this.getFallbackResponse(language);
    }
  }

  private getFallbackResponse(language: ConversationLanguage): string {
    return language === ConversationLanguage.AR
      ? 'عذراً، المساعد الذكي غير متاح حالياً. يرجى المحاولة مرة أخرى لاحقاً.'
      : 'Sorry, the AI assistant is currently unavailable. Please try again later.';
  }

  async getConversationHistory(userId: string, sessionId: string): Promise<AiConversation[]> {
    return this.conversationRepository.find({
      where: { user: { id: userId }, sessionId },
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
    await this.conversationRepository.delete({ user: { id: userId }, sessionId });
  }

  async clearAllConversations(userId: string): Promise<number> {
    const result = await this.conversationRepository.delete({ user: { id: userId } });
    return result.affected || 0;
  }
}
