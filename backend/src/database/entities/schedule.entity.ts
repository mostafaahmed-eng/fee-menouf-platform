import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index
} from 'typeorm';

export enum ScheduleType {
  LECTURE = 'LECTURE',
  EXAM = 'EXAM',
}

export enum ScheduleStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ScheduleType })
  type: ScheduleType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'jsonb' })
  data: object;

  @Column({ type: 'enum', enum: ScheduleStatus, default: ScheduleStatus.DRAFT })
  status: ScheduleStatus;

  @Column({ type: 'uuid', nullable: true, name: 'semester_id' })
  semesterId: string;

  @Column({ type: 'uuid', nullable: true, name: 'department_id' })
  departmentId: string | null;

  @Column({ type: 'int', nullable: true, name: 'generation_duration' })
  generationDuration: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'fitness_score' })
  fitnessScore: number;

  @Column({ type: 'jsonb', nullable: true })
  constraints: object;

  @Column({ type: 'jsonb', nullable: true, name: 'optimization_metrics' })
  optimizationMetrics: object;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
