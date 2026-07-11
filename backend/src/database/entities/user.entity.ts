import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToOne, OneToMany, Index
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Student } from './student.entity';
import { Doctor } from './doctor.entity';
import { Ta } from './ta.entity';
import { Advisor } from './advisor.entity';
import { Notification } from './notification.entity';
import { AiConversation } from './ai-conversation.entity';
import { AuditLog } from './audit-log.entity';

export enum UserRole {
  STUDENT = 'STUDENT',
  DOCTOR = 'DOCTOR',
  TA = 'TA',
  ADVISOR = 'ADVISOR',
  HEAD = 'HEAD',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 255, name: 'full_name_ar' })
  fullNameAr: string;

  @Column({ type: 'varchar', length: 255, name: 'full_name_en' })
  fullNameEn: string;

  @Index()
  @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar: string;

  @Index()
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_verified' })
  isVerified: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'last_login' })
  lastLogin: Date;

  @Exclude()
  @Column({ type: 'varchar', length: 500, nullable: true, name: 'refresh_token' })
  refreshToken: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Student, (student) => student.user, { cascade: true })
  student: Student;

  @OneToOne(() => Doctor, (doctor) => doctor.user, { cascade: true })
  doctor: Doctor;

  @OneToOne(() => Ta, (ta) => ta.user, { cascade: true })
  ta: Ta;

  @OneToOne(() => Advisor, (advisor) => advisor.user, { cascade: true })
  advisor: Advisor;

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => AiConversation, (conversation) => conversation.user)
  conversations: AiConversation[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.user)
  auditLogs: AuditLog[];
}
