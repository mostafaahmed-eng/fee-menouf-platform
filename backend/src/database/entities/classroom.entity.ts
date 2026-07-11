import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToMany, Index
} from 'typeorm';
import { ExamSchedule } from './exam-schedule.entity';

export enum ClassroomType {
  LECTURE_HALL = 'LECTURE_HALL',
  LAB = 'LAB',
  SEMINAR_ROOM = 'SEMINAR_ROOM',
}

@Entity('classrooms')
export class Classroom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'enum', enum: ClassroomType, default: ClassroomType.LECTURE_HALL })
  type: ClassroomType;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  building: string;

  @Column({ type: 'int', default: 0 })
  floor: number;

  @Column({ type: 'boolean', default: false, name: 'has_projector' })
  hasProjector: boolean;

  @Column({ type: 'boolean', default: false, name: 'has_computers' })
  hasComputers: boolean;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ExamSchedule, (schedule) => schedule.classroom)
  examSchedules: ExamSchedule[];
}
