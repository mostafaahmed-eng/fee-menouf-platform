import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index
} from 'typeorm';
import { User } from './user.entity';

export enum NotificationType {
  REGISTRATION = 'REGISTRATION',
  GRADE = 'GRADE',
  ATTENDANCE = 'ATTENDANCE',
  EXAM = 'EXAM',
  DEADLINE = 'DEADLINE',
  WARNING = 'WARNING',
  GENERAL = 'GENERAL',
}

@Index(['userId', 'isRead'])
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: NotificationType, default: NotificationType.GENERAL })
  type: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Index()
  @Column({ type: 'boolean', default: false, name: 'is_read' })
  isRead: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: object;

  @Index()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.notifications)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

}
