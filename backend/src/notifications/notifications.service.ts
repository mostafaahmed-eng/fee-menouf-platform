import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Notification, NotificationType } from '../database/entities/notification.entity';
import { User, UserRole } from '../database/entities/user.entity';
import { paginate, PaginatedResult, getPaginationParams, getSkipTake } from '../common/utils/pagination';

interface FindNotificationsQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  isRead?: string;
  type?: NotificationType;
  [key: string]: unknown;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async create(dto: { userId: string; type: NotificationType; title: string; message: string; metadata?: Record<string, unknown> }): Promise<Notification> {
    const notification = this.notificationRepository.create(dto);
    return this.notificationRepository.save(notification);
  }

  async findAllForUser(userId: string, query: FindNotificationsQuery): Promise<PaginatedResult<Notification>> {
    const params = getPaginationParams(query);
    const { skip, take } = getSkipTake(params.page, params.limit);
    const where: FindOptionsWhere<Notification> = { userId };
    if (query.isRead !== undefined) where.isRead = query.isRead === 'true';
    if (query.type) where.type = query.type;
    const [data, total] = await this.notificationRepository.findAndCount({
      where, skip, take,
      order: { createdAt: 'DESC' },
    });
    return paginate(data, total, params);
  }

  async findOne(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    return notification;
  }

  async markAsRead(id: string, currentUser: User): Promise<Notification> {
    const notification = await this.findOne(id);
    if (currentUser.role === UserRole.STUDENT && notification.userId !== currentUser.id) {
      throw new ForbiddenException('You can only modify your own notifications');
    }
    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
    return result.affected || 0;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({ where: { userId, isRead: false } });
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const notification = await this.findOne(id);
    if (currentUser.role === UserRole.STUDENT && notification.userId !== currentUser.id) {
      throw new ForbiddenException('You can only delete your own notifications');
    }
    const result = await this.notificationRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Notification not found');
  }

  async clearAll(userId: string): Promise<number> {
    const result = await this.notificationRepository.delete({ userId });
    return result.affected || 0;
  }
}
