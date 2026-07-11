import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from '../../src/notifications/notifications.service';
import { Notification, NotificationType } from '../../src/database/entities';

const mockNotification = {
  id: 'notif-id-1',
  userId: 'user-id-1',
  type: NotificationType.GRADE,
  title: 'New Grade Posted',
  message: 'Your CS101 grade has been posted.',
  isRead: false,
  metadata: null,
  createdAt: new Date(),
};

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationRepo: any;

  const mockRepo = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  });

  beforeEach(async () => {
    notificationRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: notificationRepo },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const dto = {
        userId: 'user-id-1',
        type: NotificationType.GRADE,
        title: 'New Grade Posted',
        message: 'Your CS101 grade has been posted.',
      };
      notificationRepo.create.mockReturnValue(mockNotification);
      notificationRepo.save.mockResolvedValue(mockNotification);

      const result = await service.create(dto);

      expect(result.id).toBe('notif-id-1');
      expect(result.type).toBe(NotificationType.GRADE);
      expect(notificationRepo.create).toHaveBeenCalledWith(dto);
    });

    it('should create notification with metadata', async () => {
      const dto = {
        userId: 'user-id-1',
        type: NotificationType.REGISTRATION,
        title: 'Registration Approved',
        message: 'Your course registration has been approved.',
        metadata: { courseId: 'course-id-1' },
      };
      notificationRepo.create.mockReturnValue({ ...mockNotification, ...dto });
      notificationRepo.save.mockResolvedValue({ ...mockNotification, ...dto });

      const result = await service.create(dto);

      expect(result.metadata).toEqual({ courseId: 'course-id-1' });
    });
  });

  describe('findAllForUser', () => {
    it('should return paginated notifications for a user', async () => {
      notificationRepo.findAndCount.mockResolvedValue([[mockNotification], 1]);

      const result = await service.findAllForUser('user-id-1', { page: 1, limit: 10 });

      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter notifications by type', async () => {
      notificationRepo.findAndCount.mockResolvedValue([[mockNotification], 1]);

      await service.findAllForUser('user-id-1', { type: NotificationType.GRADE });

      expect(notificationRepo.findAndCount).toHaveBeenCalled();
    });

    it('should return empty array when no notifications exist', async () => {
      notificationRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAllForUser('user-id-1', {});

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      notificationRepo.count.mockResolvedValue(3);

      const result = await service.getUnreadCount('user-id-1');

      expect(result).toBe(3);
      expect(notificationRepo.count).toHaveBeenCalledWith({ where: { userId: 'user-id-1', isRead: false } });
    });

    it('should return 0 when all are read', async () => {
      notificationRepo.count.mockResolvedValue(0);

      const result = await service.getUnreadCount('user-id-1');

      expect(result).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      notificationRepo.findOne.mockResolvedValue(mockNotification);
      notificationRepo.save.mockResolvedValue({ ...mockNotification, isRead: true });

      const result = await service.markAsRead('notif-id-1');

      expect(result.isRead).toBe(true);
    });

    it('should throw NotFoundException for non-existent notification', async () => {
      notificationRepo.findOne.mockResolvedValue(null);

      await expect(service.markAsRead('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      notificationRepo.update.mockResolvedValue({ affected: 5 });

      const result = await service.markAllAsRead('user-id-1');

      expect(result).toBe(5);
      expect(notificationRepo.update).toHaveBeenCalledWith(
        { userId: 'user-id-1', isRead: false },
        { isRead: true },
      );
    });

    it('should return 0 when no unread notifications', async () => {
      notificationRepo.update.mockResolvedValue({ affected: 0 });

      const result = await service.markAllAsRead('user-id-1');

      expect(result).toBe(0);
    });
  });

  describe('remove', () => {
    it('should delete a notification', async () => {
      notificationRepo.delete.mockResolvedValue({ affected: 1 });

      await service.remove('notif-id-1');

      expect(notificationRepo.delete).toHaveBeenCalledWith('notif-id-1');
    });

    it('should throw NotFoundException when deleting non-existent notification', async () => {
      notificationRepo.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return a notification by id', async () => {
      notificationRepo.findOne.mockResolvedValue(mockNotification);

      const result = await service['findOne']('notif-id-1');

      expect(result.id).toBe('notif-id-1');
    });

    it('should throw NotFoundException', async () => {
      notificationRepo.findOne.mockResolvedValue(null);

      await expect(service['findOne']('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('clearAll', () => {
    it('should delete all notifications for a user', async () => {
      notificationRepo.delete.mockResolvedValue({ affected: 10 });

      const result = await service.clearAll('user-id-1');

      expect(result).toBe(10);
    });
  });
});
