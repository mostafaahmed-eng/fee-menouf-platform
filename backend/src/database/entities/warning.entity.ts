import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index
} from 'typeorm';
import { Student } from './student.entity';

export enum WarningType {
  ACADEMIC = 'ACADEMIC',
  ATTENDANCE = 'ATTENDANCE',
  BEHAVIORAL = 'BEHAVIORAL',
  FINANCIAL = 'FINANCIAL',
}

@Entity('warnings')
export class Warning {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: WarningType, default: WarningType.ACADEMIC })
  type: WarningType;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'text', nullable: true })
  action: string;

  @Column({ type: 'boolean', default: false, name: 'is_resolved' })
  isResolved: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'resolved_at' })
  resolvedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Student, (student) => student.warnings)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'student_id' })
  studentId: string;
}
