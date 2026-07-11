import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiService } from '../../src/ai/ai.service';
import { AiConversation, ConversationRole, ConversationLanguage } from '../../src/database/entities/ai-conversation.entity';

describe('AiService', () => {
  let service: AiService;
  let conversationRepo: any;

  const mockRepo = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  });

  beforeEach(async () => {
    conversationRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: getRepositoryToken(AiConversation), useValue: conversationRepo },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send a message and return a response in English', async () => {
      conversationRepo.create.mockReturnValue({});
      conversationRepo.save.mockResolvedValue({});

      const result = await service.sendMessage(
        'user-id-1',
        'What is my schedule?',
        ConversationLanguage.EN,
      );

      expect(result.sessionId).toBeDefined();
      expect(result.message).toContain('schedule');
      expect(result.language).toBe(ConversationLanguage.EN);
      expect(conversationRepo.create).toHaveBeenCalledTimes(2);
      expect(conversationRepo.save).toHaveBeenCalledTimes(2);
    });

    it('should send a message in Arabic', async () => {
      conversationRepo.create.mockReturnValue({});
      conversationRepo.save.mockResolvedValue({});

      const result = await service.sendMessage(
        'user-id-1',
        'ما هو جدولي؟',
        ConversationLanguage.AR,
      );

      expect(result.language).toBe(ConversationLanguage.AR);
      expect(result.message).toContain('الجدول');
    });

    it('should reuse sessionId when provided', async () => {
      conversationRepo.create.mockReturnValue({});
      conversationRepo.save.mockResolvedValue({});

      const result = await service.sendMessage(
        'user-id-1',
        'Hello',
        ConversationLanguage.EN,
        'existing-session-id',
      );

      expect(result.sessionId).toBe('existing-session-id');
    });

    it('should respond correctly to registration queries', async () => {
      conversationRepo.create.mockReturnValue({});
      conversationRepo.save.mockResolvedValue({});

      const result = await service.sendMessage('user-id-1', 'How do I register?');

      expect(result.message.toLowerCase()).toContain('register');
    });

    it('should respond correctly to grade queries', async () => {
      conversationRepo.create.mockReturnValue({});
      conversationRepo.save.mockResolvedValue({});

      const result = await service.sendMessage('user-id-1', 'Show me my grades');

      expect(result.message.toLowerCase()).toContain('grade');
    });

    it('should respond correctly to attendance queries', async () => {
      conversationRepo.create.mockReturnValue({});
      conversationRepo.save.mockResolvedValue({});

      const result = await service.sendMessage('user-id-1', 'Mark my attendance');

      expect(result.message.toLowerCase()).toContain('attendance');
    });

    it('should respond correctly to greeting', async () => {
      conversationRepo.create.mockReturnValue({});
      conversationRepo.save.mockResolvedValue({});

      const result = await service.sendMessage('user-id-1', 'Hi there!');

      expect(result.message.toLowerCase()).toContain('welcome');
    });

    it('should handle general queries with a fallback response', async () => {
      conversationRepo.create.mockReturnValue({});
      conversationRepo.save.mockResolvedValue({});

      const result = await service.sendMessage('user-id-1', 'Tell me about the university');

      expect(result.message).toBeTruthy();
    });

    it('should track token usage', async () => {
      let savedMessages: any[] = [];
      conversationRepo.create.mockImplementation((dto: any) => dto);
      conversationRepo.save.mockImplementation((msg: any) => {
        savedMessages.push(msg);
        return Promise.resolve(msg);
      });

      await service.sendMessage('user-id-1', 'Hello', ConversationLanguage.EN);

      const userMsg = savedMessages[0];
      const assistantMsg = savedMessages[1];
      expect(userMsg.tokensUsed).toBe(5); // length of 'Hello'
      expect(assistantMsg.tokensUsed).toBeGreaterThan(0);
    });
  });

  describe('getConversationHistory', () => {
    it('should return conversation history ordered by timestamp', async () => {
      const history = [
        { role: ConversationRole.USER, content: 'Hello', timestamp: new Date('2024-01-01') },
        { role: ConversationRole.ASSISTANT, content: 'Hi!', timestamp: new Date('2024-01-02') },
      ];
      conversationRepo.find.mockResolvedValue(history);

      const result = await service.getConversationHistory('user-id-1', 'session-id-1');

      expect(result.length).toBe(2);
      expect(conversationRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-id-1', sessionId: 'session-id-1' },
        order: { timestamp: 'ASC' },
      });
    });

    it('should return empty array for new session', async () => {
      conversationRepo.find.mockResolvedValue([]);

      const result = await service.getConversationHistory('user-id-1', 'new-session');

      expect(result).toEqual([]);
    });
  });

  describe('getUserSessions', () => {
    it('should return user sessions grouped by sessionId', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { sessionId: 's1', startedAt: new Date(), lastMessage: new Date(), messageCount: '5' },
        ]),
      };
      conversationRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getUserSessions('user-id-1');

      expect(result.length).toBe(1);
      expect(result[0].sessionId).toBe('s1');
    });
  });

  describe('deleteSession', () => {
    it('should delete a conversation session', async () => {
      conversationRepo.delete.mockResolvedValue({ affected: 5 });

      await service.deleteSession('user-id-1', 'session-id-1');

      expect(conversationRepo.delete).toHaveBeenCalledWith({ userId: 'user-id-1', sessionId: 'session-id-1' });
    });
  });

  describe('clearAllConversations', () => {
    it('should delete all conversations for a user', async () => {
      conversationRepo.delete.mockResolvedValue({ affected: 10 });

      const result = await service.clearAllConversations('user-id-1');

      expect(result).toBe(10);
    });

    it('should return 0 if no conversations exist', async () => {
      conversationRepo.delete.mockResolvedValue({ affected: 0 });

      const result = await service.clearAllConversations('user-id-1');

      expect(result).toBe(0);
    });
  });
});
